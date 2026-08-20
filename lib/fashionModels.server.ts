/**
 * AI Fashion Models для карточек каталога / hero.
 *
 * Кладите файлы сюда с именем как есть:
 *   public/3D/FashionModels/{id} (AI Fashion Models).jpg
 *   например: B303 (AI Fashion Models).jpg
 *   варианты TXM…BP… / JP… подхватываются на родительскую карточку
 *
 * Fallback (необязательно): public/images/fashion/{id}.jpg
 */

import fs from "node:fs";
import path from "node:path";

const EXT = /\.(jpe?g|png|webp)$/i;

type FashionEntry = {
  url: string;
  mtimeMs: number;
};

function productIdFromFashionName(name: string): string | null {
  const base = name.replace(EXT, "").trim();
  // C165B (AI Fashion Models) → C165B
  const labeled = /^(.*?)\s*\(\s*AI Fashion Models\s*\)$/i.exec(base);
  if (labeled?.[1]?.trim()) return labeled[1].trim();
  // Fallback: P352.jpg / TXM1144P188_fashion.jpg
  const head = (base.split(/[\s_]/)[0] ?? base).trim();
  return head || null;
}

function scanDir(
  absDir: string,
  urlPrefix: string,
  map: Map<string, FashionEntry>,
): void {
  if (!fs.existsSync(absDir)) return;
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (!entry.isFile() || !EXT.test(entry.name)) continue;
    const id = productIdFromFashionName(entry.name);
    if (!id || id.toLowerCase() === "comand") continue;
    const abs = path.join(absDir, entry.name);
    const mtimeMs = fs.statSync(abs).mtimeMs;
    const prev = map.get(id);
    if (prev && prev.mtimeMs >= mtimeMs) continue;
    const fileUrl = `${urlPrefix}/${entry.name
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    map.set(id, { url: fileUrl, mtimeMs });
  }
}

let cache: Map<string, FashionEntry> | null = null;

function getFashionEntries(): Map<string, FashionEntry> {
  if (cache && process.env.NODE_ENV === "production") return cache;

  const map = new Map<string, FashionEntry>();
  const root = process.cwd();

  scanDir(
    path.join(root, "public", "3D", "FashionModels"),
    "/3D/FashionModels",
    map,
  );
  scanDir(
    path.join(root, "public", "images", "fashion"),
    "/images/fashion",
    map,
  );

  cache = map;
  return map;
}

/** Карта productId → URL fashion-фото */
export function getFashionModelMap(): Record<string, string> {
  return Object.fromEntries(
    [...getFashionEntries()].map(([id, entry]) => [id, entry.url]),
  );
}

export function getFashionModelUrl(
  productId: string | null | undefined,
): string | null {
  if (!productId) return null;
  return getFashionEntries().get(productId)?.url ?? null;
}

/**
 * Fashion для карточки каталога.
 * 1) точный артикул родителя
 * 2) иначе самый свежий среди oversize/junior (BP/JP)
 */
export function resolveFashionForProduct(product: {
  id: string;
  oversizeId?: string;
  juniorId?: string;
}): string | null {
  const map = getFashionEntries();
  const exact = map.get(product.id);
  if (exact) return exact.url;

  let best: FashionEntry | null = null;
  for (const id of [product.oversizeId, product.juniorId]) {
    if (!id) continue;
    const entry = map.get(id);
    if (!entry) continue;
    if (!best || entry.mtimeMs >= best.mtimeMs) best = entry;
  }
  return best?.url ?? null;
}
