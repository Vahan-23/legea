/**
 * Растеризация логотипа (PNG/SVG) в data URL для декаля.
 * SVG → canvas 1024px (decisions 9.6).
 */

const MAX_BYTES = 5 * 1024 * 1024;
const RASTER_SIZE = 1024;

export type LogoLoadResult =
  | { ok: true; dataUrl: string; fileName: string }
  | { ok: false; error: "type" | "size" | "read" };

export function validateLogoFile(file: File): "type" | "size" | null {
  const okType =
    file.type === "image/png" ||
    file.type === "image/svg+xml" ||
    file.name.toLowerCase().endsWith(".svg") ||
    file.name.toLowerCase().endsWith(".png");
  if (!okType) return "type";
  if (file.size > MAX_BYTES) return "size";
  return null;
}

export async function loadLogoFile(file: File): Promise<LogoLoadResult> {
  const invalid = validateLogoFile(file);
  if (invalid) return { ok: false, error: invalid };

  try {
    if (
      file.type === "image/svg+xml" ||
      file.name.toLowerCase().endsWith(".svg")
    ) {
      const text = await file.text();
      const dataUrl = await rasterizeSvg(text, RASTER_SIZE);
      return { ok: true, dataUrl, fileName: file.name };
    }

    const dataUrl = await readAsDataUrl(file);
    return { ok: true, dataUrl, fileName: file.name };
  } catch {
    return { ok: false, error: "read" };
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("read failed"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function rasterizeSvg(
  svgText: string,
  size: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("no ctx"));
        return;
      }
      ctx.clearRect(0, 0, size, size);
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("svg load failed"));
    };
    img.src = url;
  });
}

/** Текстура номера/фамилии на спине (Anton). */
export function createNumberNameTexture(input: {
  number: string;
  name: string;
  colorHex: string;
}): string {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, 512, 512);
  ctx.fillStyle = input.colorHex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (input.number) {
    ctx.font = "700 220px Anton, Impact, sans-serif";
    ctx.fillText(input.number.slice(0, 3), 256, 200);
  }
  if (input.name) {
    ctx.font = "700 56px Anton, Impact, sans-serif";
    ctx.fillText(input.name.toUpperCase().slice(0, 16), 256, 360);
  }

  return canvas.toDataURL("image/png");
}

/** Снимок WebGL-канваса → PNG 1600×1600. */
export function captureCanvasPng(
  sourceCanvas: HTMLCanvasElement,
  opts: { whiteBackground: boolean; size?: number },
): string {
  const size = opts.size ?? 1600;
  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const ctx = out.getContext("2d");
  if (!ctx) return sourceCanvas.toDataURL("image/png");

  if (opts.whiteBackground) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.clearRect(0, 0, size, size);
  }

  const src = sourceCanvas;
  const scale = Math.min(size / src.width, size / src.height);
  const w = src.width * scale;
  const h = src.height * scale;
  ctx.drawImage(src, (size - w) / 2, (size - h) / 2, w, h);

  return out.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, fileName: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}
