"use client";

import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImages";

type ProductCardImageProps = {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  priority?: boolean;
  className?: string;
};

/** Статичный img — без next/image, без мигания при скролле */
export function ProductCardImage({
  src,
  alt,
  fit = "contain",
  priority = false,
  className = "",
}: ProductCardImageProps) {
  const resolved = src || PRODUCT_IMAGE_PLACEHOLDER;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={
        fit === "cover"
          ? `pointer-events-none absolute inset-0 h-full w-full object-cover ${className}`
          : `pointer-events-none absolute inset-0 h-full w-full object-contain p-3 sm:p-4 ${className}`
      }
    />
  );
}
