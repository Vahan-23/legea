import { ProductCard } from "@/components/catalog/ProductCard";
import type { ProductPhotos } from "@/lib/productImages";
import type { Product } from "@/types/product";

type ProductGridProps = {
  products: Product[];
  cardPhotos?: Record<string, ProductPhotos>;
  /** Уже резолвнутые URL: productId → fashionSrc (включая oversize/junior). */
  fashionModels?: Record<string, string>;
};

export function ProductGrid({
  products,
  cardPhotos,
  fashionModels,
}: ProductGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            photos={cardPhotos?.[product.id]}
            fashionSrc={fashionModels?.[product.id] ?? null}
          />
        </li>
      ))}
    </ul>
  );
}
