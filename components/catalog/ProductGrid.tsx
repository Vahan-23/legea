import { ProductCard } from "@/components/catalog/ProductCard";
import type { Product } from "@/types/product";

type ProductGridProps = {
  products: Product[];
  cardImages?: Record<string, string>;
};

export function ProductGrid({ products, cardImages }: ProductGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            imageSrc={cardImages?.[product.id]}
          />
        </li>
      ))}
    </ul>
  );
}
