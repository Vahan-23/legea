"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ColorDots } from "@/components/catalog/ColorDots";
import { Link } from "@/i18n/navigation";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  collectProductPhotoUrls,
} from "@/lib/productImages";
import {
  isImageCached,
  prefetchImage,
  prefetchImagesQueued,
} from "@/lib/prefetchImages";
import { productName } from "@/types/product";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";
import type { ProductPhotos } from "@/lib/productImages";

type ProductCardProps = {
  product: Product;
  photos?: ProductPhotos;
};

function resolveDefaultFront(
  product: Product,
  photos?: ProductPhotos,
): string {
  if (!photos) return PRODUCT_IMAGE_PLACEHOLDER;
  for (const code of product.colorways) {
    const front = photos.byColorway[code]?.front;
    if (front) return front;
  }
  return photos.front ?? PRODUCT_IMAGE_PLACEHOLDER;
}

export function ProductCard({ product, photos }: ProductCardProps) {
  const t = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const name = productName(product, locale);
  const sizeFrom = product.sizes[0];
  const sizeTo = product.sizes[product.sizes.length - 1];

  const defaultSrc = useMemo(
    () => resolveDefaultFront(product, photos),
    [product, photos],
  );

  const allUrls = useMemo(() => collectProductPhotoUrls(photos), [photos]);

  const colorwaysWithPhoto = useMemo(() => {
    if (!photos) return [];
    return product.colorways.filter((code) => photos.byColorway[code]?.front);
  }, [product.colorways, photos]);

  const canPreview = colorwaysWithPhoto.length > 1;

  const [displaySrc, setDisplaySrc] = useState(defaultSrc);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  useEffect(() => {
    setDisplaySrc(defaultSrc);
    setPreviewCode(null);
  }, [defaultSrc]);

  useEffect(() => {
    if (!canPreview) return;
    return prefetchImagesQueued(allUrls.filter((url) => url !== defaultSrc), 120);
  }, [allUrls, defaultSrc, canPreview]);

  const handlePreview = useCallback(
    (code: string) => {
      const front = photos?.byColorway[code]?.front;
      if (!front) return;
      setPreviewCode(code);
      if (isImageCached(front)) {
        setDisplaySrc(front);
        return;
      }
      void prefetchImage(front).then(() => setDisplaySrc(front));
    },
    [photos],
  );

  const handlePreviewEnd = useCallback(() => {
    setPreviewCode(null);
    setDisplaySrc(defaultSrc);
  }, [defaultSrc]);

  return (
    <article
      className="group flex flex-col border border-transparent bg-white transition-all hover:-translate-y-1 hover:border-blue"
      onMouseLeave={canPreview ? handlePreviewEnd : undefined}
    >
      <Link href={`/catalog/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-off-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- hover swap, browser cache */}
          <img
            src={displaySrc}
            alt={name}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex flex-col gap-3 p-4 pb-2">
          <p className="font-mono text-lg tracking-tight text-navy">
            {product.id}
          </p>
          <h3 className="font-sans text-base font-medium normal-case tracking-normal text-graphite">
            {name}
          </h3>

          <div className="space-y-1 text-sm text-muted">
            <p>
              {product.gsm != null
                ? t("gsmValue", { gsm: product.gsm })
                : t("gsmUnknown")}
            </p>
            {sizeFrom && sizeTo ? (
              <p className="font-mono text-xs">
                {t("sizeRange", { from: sizeFrom, to: sizeTo })}
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        {canPreview ? (
          <ColorDots
            colorways={colorwaysWithPhoto}
            activeCode={previewCode}
            onPreview={handlePreview}
          />
        ) : colorwaysWithPhoto.length === 1 ? (
          <ColorDots colorways={colorwaysWithPhoto} />
        ) : (
          <ColorDots colorways={product.colorways} />
        )}

        {product.tech.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-1.5">
            {product.tech.slice(0, 4).map((tech) => (
              <li
                key={tech}
                className="border border-navy/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-navy"
              >
                {tech}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
