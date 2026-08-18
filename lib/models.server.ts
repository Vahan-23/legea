import { resolveProductGlbUrl } from "@/lib/glbManifest";
import productsFile from "@/data/products.json";

type ProductRow = { id: string };

/**
 * Артикулы с GLB в public/3D (data/glbManifest.json).
 */
export function getProductIdsWithGlb(): Set<string> {
  const ids = new Set<string>();
  const products = (productsFile as { products: ProductRow[] }).products ?? [];
  for (const product of products) {
    if (resolveProductGlbUrl(product.id)) ids.add(product.id);
  }
  return ids;
}
