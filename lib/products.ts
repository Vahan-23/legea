import productsFile from "@/data/products.json";
import type { Product, ProductsFile } from "@/types/product";

const data = productsFile as ProductsFile;

export type ProductVariant = {
  parent: string;
  kind: "oversize" | "junior";
  sizes: string[];
  colorways?: string[];
};

/** Все карточки каталога (без variants — они не отдельные позиции). */
export function getAllProducts(): Product[] {
  return data.products;
}

export function getCatalogStats(): {
  productCount: number;
  colorwayCount: number;
} {
  const colorways = new Set<string>();
  for (const product of data.products) {
    for (const code of product.colorways) {
      colorways.add(code);
    }
  }
  return {
    productCount: data.products.length,
    colorwayCount: colorways.size,
  };
}

export function getProductById(id: string): Product | undefined {
  return data.products.find((product) => product.id === id);
}

export function getProductsMeta(): ProductsFile["meta"] {
  return data.meta;
}

export function getVariant(id: string): ProductVariant | undefined {
  const raw = data.variants[id];
  if (!raw || typeof raw !== "object") return undefined;
  const variant = raw as ProductVariant;
  if (!variant.parent || !variant.kind || !Array.isArray(variant.sizes)) {
    return undefined;
  }
  return variant;
}

/**
 * Полный ряд размеров для матрицы: базовые + junior + oversize.
 * Порядок: junior → base (без дублей) → oversize.
 */
export function getMatrixSizes(product: Product): string[] {
  const junior = product.juniorId
    ? (getVariant(product.juniorId)?.sizes ?? [])
    : [];
  const oversize = product.oversizeId
    ? (getVariant(product.oversizeId)?.sizes ?? [])
    : [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const size of [...junior, ...product.sizes, ...oversize]) {
    if (!seen.has(size)) {
      seen.add(size);
      result.push(size);
    }
  }

  return result;
}

/**
 * Артикул для размера: B/J-вариант или базовый id (decisions 5.5).
 */
export function resolveSkuForSize(product: Product, size: string): string {
  if (product.oversizeId) {
    const oversize = getVariant(product.oversizeId);
    if (oversize?.sizes.includes(size)) return product.oversizeId;
  }
  if (product.juniorId) {
    const junior = getVariant(product.juniorId);
    if (junior?.sizes.includes(size)) return product.juniorId;
  }
  return product.id;
}

/**
 * Разбивает количества по артикулам B/J/base для добавления в спецификацию.
 */
export function partitionQuantitiesBySku(
  product: Product,
  quantities: Record<string, number>,
): Array<{ productId: string; quantities: Record<string, number> }> {
  const buckets = new Map<string, Record<string, number>>();

  for (const [size, qty] of Object.entries(quantities)) {
    if (qty <= 0) continue;
    const sku = resolveSkuForSize(product, size);
    const bucket = buckets.get(sku) ?? {};
    bucket[size] = qty;
    buckets.set(sku, bucket);
  }

  return Array.from(buckets.entries()).map(([productId, qty]) => ({
    productId,
    quantities: qty,
  }));
}
