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

/** URL пер-артикульного GLB или null */
export function resolveProductGlbUrl(productId: string | null): string | null {
  if (!productId) return null;
  return FILES[productId] ?? null;
}

export function hasProductGlb(productId: string): boolean {
  return Boolean(FILES[productId]);
}
