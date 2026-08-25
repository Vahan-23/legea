/**
 * Статический список GLB — без fetch(HEAD) на каждый артикул.
 * Обновляется: npm run glb:manifest
 */

import manifest from "@/data/glbManifest.json";

type GlbManifest = {
  version: number;
  generatedAt: string;
  files: Record<string, string>;
};

const FILES = (manifest as GlbManifest).files ?? {};

/** Точное совпадение + fallback без учёта регистра (b314.glb → B314). */
const FILES_BY_UPPER = new Map<string, string>(
  Object.entries(FILES).map(([id, url]) => [id.toUpperCase(), url]),
);

/** URL пер-артикульного GLB или null */
export function resolveProductGlbUrl(productId: string | null): string | null {
  if (!productId) return null;
  return FILES[productId] ?? FILES_BY_UPPER.get(productId.toUpperCase()) ?? null;
}

export function hasProductGlb(productId: string): boolean {
  return Boolean(FILES[productId]);
}
