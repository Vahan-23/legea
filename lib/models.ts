/**
 * Спецификация GLB-моделей
 * (decisions.txt 4.5)
 *
 * Приоритет загрузки:
 * 1. /public/3D/{productId}_3D.glb — модель конкретного артикула
 * 2. /public/models/{model}.glb — общая модель типа (jersey_ss и т.д.)
 * 3. PlaceholderModel
 *
 * Требования:
 * - высота торса ≈ 0.7 world unit
 * - origin в центре объекта
 * - Y-up
 * - меши (или материалы) с именами: Base, Trim, Logo
 * - рекомендуется Draco + meshopt, текстуры KTX2
 *
 * Пока файла нет — используется PlaceholderModel с теми же именами материалов.
 */

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

/** Пер-артикульный GLB: public/3D/{id}_3D.glb */
export function productGlbPath(productId: string): string {
  return `/3D/${productId}_3D.glb`;
}

/** Бренд-логотип для hero и т.п. */
export function brandLogoGlbPath(): string {
  return "/3D/logo_3d.glb";
}

export function isKnownModel(model: string | null): model is ModelId {
  if (!model) return false;
  return (MODEL_FILES as readonly string[]).includes(model);
}
