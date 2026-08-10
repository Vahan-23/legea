/**
 * Спецификация GLB-моделей для /public/models/
 * (decisions.txt 4.5)
 *
 * Naming: {model}.glb — например jersey_ss.glb
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

export function isKnownModel(model: string | null): model is ModelId {
  if (!model) return false;
  return (MODEL_FILES as readonly string[]).includes(model);
}
