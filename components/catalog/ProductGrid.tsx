"use client";

import { useEffect } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { consumeCatalogFocus } from "@/lib/catalogScroll";
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
  useEffect(() => {
    const focus = consumeCatalogFocus();
    if (!focus) return;

    const scrollToCard = () => {
      const el = document.getElementById(`catalog-product-${focus.productId}`);
      if (!el) return false;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      return true;
    };

    if (scrollToCard()) return;

    const t1 = window.setTimeout(() => {
      scrollToCard();
    }, 120);
    const t2 = window.setTimeout(() => {
      scrollToCard();
    }, 400);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [products]);

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <li key={product.id} id={`catalog-product-${product.id}`}>
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
