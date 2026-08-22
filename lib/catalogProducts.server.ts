/**
 * Видимый каталог сайта: только позиции с front-фото
 * и (GLB или PHOTO_ONLY). Сейчас полный набор = 89 артикулов.
 */

import { resolveFashionForProduct, getFashionModelMap } from "@/lib/fashionModels.server";
import { isPhotoOnlyProduct } from "@/lib/models";
import { getProductIdsWithGlb } from "@/lib/models.server";
import { getAllProductPhotos } from "@/lib/productImages.server";
import { getAllProducts } from "@/lib/products";
import type { Product } from "@/types/product";
import type { ProductPhotos } from "@/lib/productImages";

export function isProductVisibleInCatalog(
  product: Product,
  photos: ProductPhotos | undefined,
  productIdsWith3d: Set<string>,
): boolean {
  if (!photos?.front) return false;
  if (productIdsWith3d.has(product.id)) return true;
  return isPhotoOnlyProduct(product.id);
}

/** Все позиции, которые показываются в /catalog */
export function getVisibleCatalogProducts(): Product[] {
  const cardPhotos = getAllProductPhotos();
  const productIdsWith3d = getProductIdsWithGlb();
  return getAllProducts().filter((product) =>
    isProductVisibleInCatalog(
      product,
      cardPhotos[product.id],
      productIdsWith3d,
    ),
  );
}

export function getCatalogStats(): {
  productCount: number;
  colorwayCount: number;
} {
  const visible = getVisibleCatalogProducts();
  const colorways = new Set<string>();
  for (const product of visible) {
    for (const code of product.colorways) {
      colorways.add(code);
    }
  }
  return {
    productCount: visible.length,
    colorwayCount: colorways.size,
  };
}

/** Данные для страницы /catalog: видимые товары + fashion map */
export function getCatalogPageData(): {
  products: Product[];
  cardPhotos: Record<string, ProductPhotos>;
  fashionModels: Record<string, string>;
  productIdsWith3d: string[];
} {
  const cardPhotos = getAllProductPhotos();
  const fashionRaw = getFashionModelMap();
  const productIdsWith3d = getProductIdsWithGlb();
  const products = getAllProducts().filter((product) =>
    isProductVisibleInCatalog(
      product,
      cardPhotos[product.id],
      productIdsWith3d,
    ),
  );

  const fashionModels: Record<string, string> = { ...fashionRaw };
  for (const product of products) {
    const resolved = resolveFashionForProduct(product);
    if (resolved) fashionModels[product.id] = resolved;
  }

  return {
    products,
    cardPhotos,
    fashionModels,
    productIdsWith3d: Array.from(productIdsWith3d),
  };
}
