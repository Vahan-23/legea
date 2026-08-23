"use client";

import { useEffect, useRef } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { consumeCatalogFocus } from "@/lib/catalogScroll";
import {
  gridClassName,
  type CatalogGridColumns,
} from "@/lib/catalogGridView";
import type { ProductPhotos } from "@/lib/productImages";
import type { Product } from "@/types/product";

type ProductGridProps = {
  products: Product[];
  cardPhotos?: Record<string, ProductPhotos>;
  /** Уже резолвнутые URL: productId → fashionSrc (включая oversize/junior). */
  fashionModels?: Record<string, string>;
  columns?: CatalogGridColumns;
};

export function ProductGrid({
  products,
  cardPhotos,
  fashionModels,
  columns = 4,
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
    <ul
      className={`${gridClassName(columns)} min-w-0 overflow-x-hidden ${
        columns === 5
          ? "md:grid-cols-5"
          : columns === 4
            ? "md:grid-cols-4"
            : columns === 3
              ? "md:grid-cols-3"
              : "md:grid-cols-2"
      }`}
    >
      {products.map((product, index) => (
        <li
          key={product.id}
          id={`catalog-product-${product.id}`}
          className="border-b border-navy/15 py-9 first:pt-0 last:border-b-0 last:pb-2 md:border-b-0 md:py-0"
        >
          <ProductCard
            product={product}
            photos={cardPhotos?.[product.id]}
            fashionSrc={fashionModels?.[product.id] ?? null}
            eager={index === 0}
          />
        </li>
      ))}
    </ul>
  );
}
