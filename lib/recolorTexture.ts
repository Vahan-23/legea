import * as THREE from "three";

export type SplitAlbedoMaps = {
  /** Почти белый shading-map ткани (logo = чёрный) — цвет ≈ colorMap */
  fabricMap: THREE.CanvasTexture;
  /** Маска логотипа (белый текст / значки) */
  logoMap: THREE.CanvasTexture;
};

/** Целевая яркость плоских зон (умножение на colorway почти не гасит hex) */
const TARGET_LUMA = 240;
/** Доля оригинального shading (складки/объём), остальное — чистый цвет */
const SHADE_STRENGTH = 0.3;

/** Белые/светло-серые принты (плечи, LEGEA) — низкая насыщенность */
const LOGO_SAT_MAX = 0.25;
/** Абсолютный пол яркости логотипа */
const LOGO_LUMA_MIN = 142;
/** Логотип заметно светлее медианы ткани */
const LOGO_ABOVE_MEDIAN = 50;

/**
 * Режет цветной albedo на soft-AO ткань + маску белого логотипа.
 * Fabric нормализуется, чтобы итоговый цвет был ближе к colorMap, а не «грязным».
 * Белые значки/текст остаются в emissive и не перекрашиваются.
 */
export function splitAlbedoForRecolor(
  source: THREE.Texture,
): SplitAlbedoMaps | null {
  const image = source.image as
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | undefined;

  if (!image) return null;

  const width =
    "width" in image ? Number(image.width) : (image as ImageBitmap).width;
  const height =
    "height" in image ? Number(image.height) : (image as ImageBitmap).height;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(image as CanvasImageSource, 0, 0);
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, width, height);
  } catch {
    return null;
  }

  const src = data.data;
  const meta: Array<{ luma: number; sat: number; a: number }> = [];
  const allLumas: number[] = [];

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i] ?? 0;
    const g = src[i + 1] ?? 0;
    const b = src[i + 2] ?? 0;
    const a = src[i + 3] ?? 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = max === 0 ? 0 : (max - min) / max;
    meta.push({ luma, sat, a });
    if (a > 8) allLumas.push(luma);
  }

  allLumas.sort((x, y) => x - y);
  const median =
    allLumas.length > 0
      ? allLumas[Math.floor(allLumas.length * 0.5)]!
      : 128;

  const logoLumaCut = Math.max(LOGO_LUMA_MIN, median + LOGO_ABOVE_MEDIAN);

  const fabricLumas: number[] = [];
  const isLogoFlags = new Array<boolean>(meta.length);

  for (let p = 0; p < meta.length; p += 1) {
    const { luma, sat, a } = meta[p]!;
    const isLogo =
      a > 8 && sat < LOGO_SAT_MAX && luma >= logoLumaCut;
    isLogoFlags[p] = isLogo;
    if (!isLogo && a > 8) fabricLumas.push(luma);
  }

  fabricLumas.sort((x, y) => x - y);
  const mean =
    fabricLumas.length > 0
      ? fabricLumas[Math.floor(fabricLumas.length * 0.5)]!
      : median;

  const fabric = ctx.createImageData(width, height);
  const logo = ctx.createImageData(width, height);
  const f = fabric.data;
  const l = logo.data;

  for (let p = 0; p < meta.length; p += 1) {
    const i = p * 4;
    const { luma, a } = meta[p]!;
    const isLogo = isLogoFlags[p]!;

    if (isLogo) {
      f[i] = 0;
      f[i + 1] = 0;
      f[i + 2] = 0;
      f[i + 3] = a;
      l[i] = 255;
      l[i + 1] = 255;
      l[i + 2] = 255;
      l[i + 3] = a;
      continue;
    }

    // Нормализация к TARGET + мягкий shading → цвет ближе к свотчу
    const relative = mean > 1 ? luma / mean : 1;
    const shaded = Math.min(255, Math.max(0, relative * TARGET_LUMA));
    const v = Math.round(
      TARGET_LUMA * (1 - SHADE_STRENGTH) + shaded * SHADE_STRENGTH,
    );

    f[i] = v;
    f[i + 1] = v;
    f[i + 2] = v;
    f[i + 3] = a;
    l[i] = 0;
    l[i + 1] = 0;
    l[i + 2] = 0;
    l[i + 3] = a;
  }

  const fabricCanvas = document.createElement("canvas");
  fabricCanvas.width = width;
  fabricCanvas.height = height;
  const fabricCtx = fabricCanvas.getContext("2d");
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = width;
  logoCanvas.height = height;
  const logoCtx = logoCanvas.getContext("2d");
  if (!fabricCtx || !logoCtx) return null;

  fabricCtx.putImageData(fabric, 0, 0);
  logoCtx.putImageData(logo, 0, 0);

  const fabricMap = new THREE.CanvasTexture(fabricCanvas);
  const logoMap = new THREE.CanvasTexture(logoCanvas);
  fabricMap.colorSpace = THREE.SRGBColorSpace;
  logoMap.colorSpace = THREE.SRGBColorSpace;
  fabricMap.flipY = source.flipY;
  logoMap.flipY = source.flipY;
  fabricMap.wrapS = source.wrapS;
  fabricMap.wrapT = source.wrapT;
  logoMap.wrapS = source.wrapS;
  logoMap.wrapT = source.wrapT;
  fabricMap.needsUpdate = true;
  logoMap.needsUpdate = true;

  return { fabricMap, logoMap };
}
