/**
 * Спецификация GLB-моделей
 * (decisions.txt 4.5)
 *
 * Приоритет загрузки:
 * 1. /public/3D/{productId}_3D.glb или /public/3D/{productId}.glb
 * 2. /public/models/{model}.glb — общая модель типа (jersey_ss и т.д.)
 * 3. Пока грузится — CanvasLoader; если файла нет — пустая сцена
 *
 * Требования:
 * - высота торса ≈ 0.7 world unit
 * - origin в центре объекта
 * - Y-up
 * - меши (или материалы) с именами: Base, Trim, Logo
 * - рекомендуется Draco + meshopt, текстуры KTX2
 *
 * Зоны цветов: data/glbColorZones.json (`npm run glb:zones`)
 */

import { getGlbBakedColorwayFromZones } from "@/lib/glbColorZones";
import { resolveProductGlbUrl } from "@/lib/glbManifest";

export const MODEL_FILES = [
  "jersey_ss",
  "jersey_ls",
  "shorts",
  "socks",
  "jacket",
  "hoodie",
  "pants",
  "gk_kit",
  "ball",
  "backpack",
  "volley_top",
  "basket_top",
] as const;

export type ModelId = (typeof MODEL_FILES)[number];

export function modelPath(model: string): string {
  return `/models/${model}.glb`;
}

/** Пер-артикульный GLB: {id}_3D.glb (предпочтительно) или {id}.glb */
export function productGlbPath(productId: string): string {
  return `/3D/${productId}_3D.glb`;
}

export function productGlbCandidates(productId: string): string[] {
  const known = resolveProductGlbUrl(productId);
  if (known) return [known];
  return [`/3D/${productId}_3D.glb`, `/3D/${productId}.glb`];
}

/** Синхронный resolve без HEAD-запросов */
export function resolveGlbUrlSync(
  glbUrlProp: string | null,
  productId: string | null,
  model: string | null,
): string | null {
  if (glbUrlProp) return glbUrlProp;
  if (productId) {
    const byProduct = resolveProductGlbUrl(productId);
    if (byProduct) return byProduct;
  }
  if (model && isKnownModel(model)) return modelPath(model);
  return null;
}

/** Бренд-логотип для hero и т.п. */
export function brandLogoGlbPath(): string {
  return "/3D/logo_3d.glb";
}

export function getGlbBakedColorway(productId: string | null): string | null {
  return getGlbBakedColorwayFromZones(productId);
}

/** @deprecated → getGlbBakedColorway */
export function getGlbBakedKitColorway(productId: string | null): string | null {
  return getGlbBakedColorway(productId);
}

export function isKnownModel(model: string | null): model is ModelId {
  if (!model) return false;
  return (MODEL_FILES as readonly string[]).includes(model);
}

/** TXM-костюмы (верх/низ): показываем GLB как запечён, без kit-shader. */
export function preserveGlbMaterials(productId: string | null | undefined): boolean {
  return Boolean(productId?.startsWith("TXM"));
}
