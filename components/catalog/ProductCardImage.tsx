"use client";

import Image from "next/image";
import { useState } from "react";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImages";

type ProductCardImageProps = {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
  /** Первый кадр видимой карточки — без lazy, с приоритетом */
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function ProductCardImage({
  src,
  alt,
  fit = "contain",
  priority = false,
  sizes = "(max-width: 767px) 100vw, 50vw",
  className = "",
}: ProductCardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const resolved = src || PRODUCT_IMAGE_PLACEHOLDER;

  return (
    <>
      {!loaded ? (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-off-white"
        />
      ) : null}
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={
          fit === "cover"
            ? `pointer-events-none object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`
            : `pointer-events-none object-contain p-3 sm:p-4 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`
        }
      />
    </>
  );
}
