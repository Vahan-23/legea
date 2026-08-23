"use client";

import { useEffect, useRef } from "react";
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
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    const focus = consumeCatalogFocus();
    if (!focus) {
      restoredRef.current = true;
      return;
    }

    const scrollToCard = () => {
      const el = document.getElementById(`catalog-product-${focus.productId}`);
      if (!el) return false;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      restoredRef.current = true;
      return true;
    };

    if (scrollToCard()) return;

    const t1 = window.setTimeout(() => {
      scrollToCard();
    }, 120);
    const t2 = window.setTimeout(() => {
      scrollToCard();
      restoredRef.current = true;
    }, 400);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4">
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
