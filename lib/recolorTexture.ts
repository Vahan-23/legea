import * as THREE from "three";
import { parseColorway } from "@/lib/colorCode";

export type SplitAlbedoMaps = {
  /** Почти белый shading-map ткани (logo = чёрный) — цвет ≈ colorMap */
  fabricMap: THREE.CanvasTexture;
  /** Маска логотипа (белый текст / значки) */
  logoMap: THREE.CanvasTexture;
};

export type ZoneRecolorMaps = {
  /** Albedo: зоны перекрашены, остальное (лого/принты) как в оригинале */
  map: THREE.CanvasTexture;
};

export type ColorZone = {
  bakedHex: string;
  targetHex: string;
  /** Радиус совпадения RGB; если нет — ZONE_MATCH_DEFAULT */
  matchRadius?: number;
  role?: "base" | "trim" | "top" | "bottom" | "accent";
};

export type RecolorSplitMode = "nearest" | "luminance";

type Rgb = { r: number; g: number; b: number };

function parseHexRgb(hex: string): Rgb {
  const n = hex.replace("#", "");
  return {
    r: Number.parseInt(n.slice(0, 2), 16),
    g: Number.parseInt(n.slice(2, 4), 16),
    b: Number.parseInt(n.slice(4, 6), 16),
  };
}

function rgbDist(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** Макс. дистанция до запечённого цвета зоны (иначе пиксель не трогаем) */
const ZONE_MATCH_DEFAULT = 95;
/** Чёрные принты (LEGEA) — не перекрашивать */
const KEEP_DARK_LUMA = 28;
/** Светлые низкосатур. принты */
const LOGO_SAT_MAX = 0.22;
const LOGO_LUMA_MIN = 170;

/**
 * Зоны из пары расцветок: single XXYY → base+trim; kit → верх+низ (+trim).
 */
export function colorZonesFromColorways(
  bakedCode: string,
  targetCode: string,
): ColorZone[] {
  const baked = parseColorway(bakedCode);
  const target = parseColorway(targetCode);
  const zones: ColorZone[] = [];
  const push = (bakedHex: string, targetHex: string) => {
    if (
      zones.some(
        (z) =>
          z.bakedHex.toLowerCase() === bakedHex.toLowerCase() &&
          z.targetHex.toLowerCase() === targetHex.toLowerCase(),
      )
    ) {
      return;
    }
    zones.push({ bakedHex, targetHex });
  };

  if (baked.kind === "kit" && target.kind === "kit") {
    push(baked.top.base, target.top.base);
    push(baked.top.trim, target.top.trim);
    push(baked.bottom.base, target.bottom.base);
    push(baked.bottom.trim, target.bottom.trim);
    return zones;
  }

  if (baked.kind === "single" && target.kind === "single") {
    push(baked.base, target.base);
    push(baked.trim, target.trim);
    return zones;
  }

  return zones;
}

function readImageData(
  source: THREE.Texture,
): { width: number; height: number; data: ImageData; ctx: CanvasRenderingContext2D } | null {
  const image = (source.image ??
    (source as THREE.Texture & { source?: { data?: unknown } }).source?.data) as
    | HTMLImageElement
    | HTMLCanvasElement
    | OffscreenCanvas
    | ImageBitmap
    | ImageData
    | undefined;
  if (!image) return null;

  const width =
    "width" in image ? Number(image.width) : 0;
  const height =
    "height" in image ? Number(image.height) : 0;
  if (!width || !height) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  try {
    if (image instanceof ImageData) {
      ctx.putImageData(image, 0, 0);
    } else {
      ctx.drawImage(image as CanvasImageSource, 0, 0);
    }
    return { width, height, data: ctx.getImageData(0, 0, width, height), ctx };
  } catch {
    return null;
  }
}

function copyTextureProps(
  source: THREE.Texture,
  target: THREE.CanvasTexture,
): void {
  target.colorSpace = THREE.SRGBColorSpace;
  target.flipY = source.flipY;
  target.wrapS = source.wrapS;
  target.wrapT = source.wrapT;
  target.needsUpdate = true;
}

/**
 * Режет цветной albedo на soft-AO ткань + маску белого логотипа.
 * (legacy для однозонных маек; предпочтительно recolorAlbedoZones)
 */
export function splitAlbedoForRecolor(
  source: THREE.Texture,
): SplitAlbedoMaps | null {
  const read = readImageData(source);
  if (!read) return null;
  const { width, height, data, ctx } = read;
  const src = data.data;

  const TARGET_LUMA = 240;
  const LOGO_ABOVE_MEDIAN = 50;
  const LOGO_LUMA_MIN_LEGACY = 142;

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
  const logoLumaCut = Math.max(LOGO_LUMA_MIN_LEGACY, median + LOGO_ABOVE_MEDIAN);

  const fabricLumas: number[] = [];
  const isLogoFlags = new Array<boolean>(meta.length);

  for (let p = 0; p < meta.length; p += 1) {
    const { luma, sat, a } = meta[p]!;
    const isLogo = a > 8 && sat < LOGO_SAT_MAX && luma >= logoLumaCut;
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
    if (isLogoFlags[p]) {
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
    const relative = mean > 1 ? luma / mean : 1;
    const shaded = Math.min(255, Math.max(0, relative * TARGET_LUMA));
    const v = Math.round(
      TARGET_LUMA * (1 - 0.3) + shaded * 0.3,
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
  copyTextureProps(source, fabricMap);
  copyTextureProps(source, logoMap);
  return { fabricMap, logoMap };
}

function lumaOf(c: Rgb): number {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
}

function otsuThreshold(lumas: number[]): number {
  const hist = new Array<number>(256).fill(0);
  for (const L of lumas) {
    hist[Math.max(0, Math.min(255, Math.round(L)))]! += 1;
  }
  const total = lumas.length;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * (hist[i] ?? 0);
  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let thresh = 128;
  for (let t = 0; t < 256; t += 1) {
    wB += hist[t] ?? 0;
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * (hist[t] ?? 0);
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      thresh = t;
    }
  }
  return thresh;
}

/**
 * Перекраска по зонам: пиксели, близкие к bakedHex зоны → targetHex.
 * Остальное (логотипы, полоски, фурнитура) остаётся как в GLB.
 * splitMode=luminance: для kit top/bottom делим по яркости (navy vs grey).
 */
export function recolorAlbedoZones(
  source: THREE.Texture,
  zones: ColorZone[],
  splitMode: RecolorSplitMode = "nearest",
): ZoneRecolorMaps | null {
  if (zones.length === 0) return null;

  const read = readImageData(source);
  if (!read) return null;
  const { width, height, data, ctx } = read;
  const src = data.data;
  const pixelCount = width * height;

  const zoneRgb = zones.map((z) => ({
    baked: parseHexRgb(z.bakedHex),
    target: parseHexRgb(z.targetHex),
    radius: z.matchRadius ?? ZONE_MATCH_DEFAULT,
    role: z.role,
    bakedLuma: lumaOf(parseHexRgb(z.bakedHex)),
  }));

  const topIdx = zoneRgb.findIndex((z) => z.role === "top");
  const botIdx = zoneRgb.findIndex((z) => z.role === "bottom");
  const useLumaSplit =
    splitMode === "luminance" && topIdx >= 0 && botIdx >= 0;

  // Медиана яркости ткани — порог верх/низ (не bakedHex: он может не совпасть)
  const fabricLumas: number[] = [];
  if (useLumaSplit) {
    for (let p = 0; p < pixelCount; p += 1) {
      const i = p * 4;
      const a = src[i + 3] ?? 255;
      if (a <= 8) continue;
      const r = src[i] ?? 0;
      const g = src[i + 1] ?? 0;
      const b = src[i + 2] ?? 0;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma < KEEP_DARK_LUMA) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat < LOGO_SAT_MAX && luma >= LOGO_LUMA_MIN) continue;
      fabricLumas.push(luma);
    }
    fabricLumas.sort((a, b) => a - b);
  }
  const lumaMid = useLumaSplit
    ? fabricLumas.length < 8
      ? (zoneRgb[topIdx]!.bakedLuma + zoneRgb[botIdx]!.bakedLuma) / 2
      : otsuThreshold(fabricLumas)
    : 0;
  const darkerIsTop = useLumaSplit
    ? zoneRgb[topIdx]!.bakedLuma <= zoneRgb[botIdx]!.bakedLuma
    : true;

  // Медиана яркости по каждой зоне — для shading
  const zoneLumas: number[][] = zoneRgb.map(() => []);

  const assignment = new Int8Array(pixelCount); // -1 = keep, else zone index

  for (let p = 0; p < pixelCount; p += 1) {
    const i = p * 4;
    const r = src[i] ?? 0;
    const g = src[i + 1] ?? 0;
    const b = src[i + 2] ?? 0;
    const a = src[i + 3] ?? 255;
    if (a <= 8) {
      assignment[p] = -1;
      continue;
    }

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = max === 0 ? 0 : (max - min) / max;

    // Чёрный/белый принт и графика вне палитры изделия
    if (luma < KEEP_DARK_LUMA || (sat < LOGO_SAT_MAX && luma >= LOGO_LUMA_MIN)) {
      assignment[p] = -1;
      continue;
    }

    const px = { r, g, b };
    let best = -1;
    let bestDist = Infinity;

    if (useLumaSplit) {
      const isDark = luma <= lumaMid;
      best = isDark === darkerIsTop ? topIdx : botIdx;
    } else {
      for (let z = 0; z < zoneRgb.length; z += 1) {
        const d = rgbDist(px, zoneRgb[z]!.baked);
        if (d < bestDist) {
          bestDist = d;
          best = z;
        }
      }

      if (best < 0 || bestDist > zoneRgb[best]!.radius) {
        assignment[p] = -1;
        continue;
      }
    }

    assignment[p] = best;
    zoneLumas[best]!.push(luma);
  }

  // Если bakedHex не совпал с реальной albedo (как B302 orange vs green) —
  // красим всю ткань в первую зону, иначе свотчи ничего не меняют.
  let assigned = 0;
  for (let p = 0; p < pixelCount; p += 1) {
    if (assignment[p]! >= 0) assigned += 1;
  }
  if (assigned < pixelCount * 0.08) {
    const fallback = 0;
    for (let p = 0; p < pixelCount; p += 1) {
      const i = p * 4;
      const r = src[i] ?? 0;
      const g = src[i + 1] ?? 0;
      const b = src[i + 2] ?? 0;
      const a = src[i + 3] ?? 255;
      if (a <= 8) continue;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      if (luma < KEEP_DARK_LUMA) continue;
      if (sat < LOGO_SAT_MAX && luma >= LOGO_LUMA_MIN) continue;
      assignment[p] = fallback;
      zoneLumas[fallback]!.push(luma);
    }
  }

  const out = ctx.createImageData(width, height);
  const o = out.data;

  for (let p = 0; p < pixelCount; p += 1) {
    const i = p * 4;
    const a = src[i + 3] ?? 255;
    const zone = assignment[p]!;

    if (zone < 0) {
      o[i] = src[i] ?? 0;
      o[i + 1] = src[i + 1] ?? 0;
      o[i + 2] = src[i + 2] ?? 0;
      o[i + 3] = a;
      continue;
    }

    const r = src[i] ?? 0;
    const g = src[i + 1] ?? 0;
    const b = src[i + 2] ?? 0;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const target = zoneRgb[zone]!.target;
    const shade = 0.88 + 0.24 * (luma / 255);

    o[i] = Math.round(Math.min(255, target.r * shade));
    o[i + 1] = Math.round(Math.min(255, target.g * shade));
    o[i + 2] = Math.round(Math.min(255, target.b * shade));
    o[i + 3] = a;
  }

  const mapCanvas = document.createElement("canvas");
  mapCanvas.width = width;
  mapCanvas.height = height;
  const mapCtx = mapCanvas.getContext("2d");
  if (!mapCtx) return null;
  mapCtx.putImageData(out, 0, 0);

  const map = new THREE.CanvasTexture(mapCanvas);
  copyTextureProps(source, map);
  return { map };
}

/**
 * То же, что recolorAlbedoZones, но из обычной картинки
 * (public/3D/albedo/*.webp — не GPU-текстура GLB).
 */
export function recolorAlbedoFromImage(
  image: CanvasImageSource,
  zones: ColorZone[],
  splitMode: RecolorSplitMode = "nearest",
): ZoneRecolorMaps | null {
  const tex = new THREE.Texture();
  tex.image = image as THREE.Texture["image"];
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return recolorAlbedoZones(tex, zones, splitMode);
}

/** @deprecated используйте recolorAlbedoZones */
export function recolorKitAlbedo(
  source: THREE.Texture,
  topHex: string,
  bottomHex: string,
  bakedTopHex?: string | null,
  bakedBottomHex?: string | null,
): { map: THREE.CanvasTexture; logoMap: THREE.CanvasTexture } | null {
  const zones: ColorZone[] = [];
  if (bakedTopHex) zones.push({ bakedHex: bakedTopHex, targetHex: topHex });
  if (bakedBottomHex)
    zones.push({ bakedHex: bakedBottomHex, targetHex: bottomHex });
  if (zones.length === 0) {
    zones.push({ bakedHex: topHex, targetHex: topHex });
    zones.push({ bakedHex: bottomHex, targetHex: bottomHex });
  }
  const result = recolorAlbedoZones(source, zones);
  if (!result) return null;

  // Пустая logo-map для совместимости
  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = 1;
  logoCanvas.height = 1;
  const logoMap = new THREE.CanvasTexture(logoCanvas);
  copyTextureProps(source, logoMap);
  return { map: result.map, logoMap };
}
