"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ColorDots } from "@/components/catalog/ColorDots";
import { PeekCarousel, type PeekCarouselSlide } from "@/components/ui/PeekCarousel";
import { Link } from "@/i18n/navigation";
import { saveCatalogFocus } from "@/lib/catalogScroll";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImages";
import { prefetchImage, prefetchImagesQueued } from "@/lib/prefetchImages";
import { useIsMobile } from "@/lib/useIsMobile";
import { productName } from "@/types/product";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";
import type { ProductPhotos } from "@/lib/productImages";

type ProductCardProps = {
  product: Product;
  photos?: ProductPhotos;
  /** AI fashion — показывается по умолчанию; hover → реальное фото */
  fashionSrc?: string | null;
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

function ProductCardInner({
  product,
  photos,
  fashionSrc = null,
}: ProductCardProps) {
  const t = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const mobile = useIsMobile();
  const name = productName(product, locale);
  const sizeFrom = product.sizes[0];
  const sizeTo = product.sizes[product.sizes.length - 1];

  const productSrc = useMemo(
    () => resolveDefaultFront(product, photos),
    [product, photos],
  );

  const hasFashion = Boolean(fashionSrc);

  const colorwaysWithPhoto = useMemo(() => {
    if (!photos) return [];
    return product.colorways.filter((code) => photos.byColorway[code]?.front);
  }, [product.colorways, photos]);

  const slides = useMemo((): PeekCarouselSlide[] => {
    const items: PeekCarouselSlide[] = [];
    if (hasFashion && fashionSrc) {
      items.push({
        key: "fashion",
        src: fashionSrc,
        alt: name,
        fit: "cover",
      });
    }
    for (const code of colorwaysWithPhoto) {
      const front = photos?.byColorway[code]?.front;
      if (front) {
        items.push({
          key: code,
          src: front,
          alt: name,
          fit: "contain",
        });
      }
    }
    if (items.length === 0) {
      items.push({
        key: "default",
        src: productSrc,
        alt: name,
        fit: "contain",
      });
    }
    return items;
  }, [colorwaysWithPhoto, fashionSrc, hasFashion, name, photos, productSrc]);

  const canSlide = slides.length > 1;
  const [slideIndex, setSlideIndex] = useState(0);
  const swipedRef = useRef(false);

  useEffect(() => {
    setSlideIndex(0);
  }, [product.id, fashionSrc, slides.length]);

  useEffect(() => {
    const urls = slides.map((slide) => slide.src);
    return prefetchImagesQueued(urls, 200);
  }, [slides]);

  const activeSlide = slides[slideIndex];
  const fashionActive = activeSlide?.key === "fashion";
  const activeCode = fashionActive ? null : activeSlide?.key ?? null;

  const defaultIndex = 0;

  const selectIndex = useCallback(
    (index: number) => {
      setSlideIndex(index);
      const slide = slides[index];
      if (slide?.src) void prefetchImage(slide.src);
    },
    [slides],
  );

  const restoreMain = useCallback(() => {
    if (mobile) return;
    selectIndex(defaultIndex);
  }, [mobile, selectIndex]);

  const handleSelectFashion = useCallback(() => {
    const idx = slides.findIndex((slide) => slide.key === "fashion");
    if (idx >= 0) selectIndex(idx);
  }, [selectIndex, slides]);

  const handlePreview = useCallback(
    (code: string) => {
      const idx = slides.findIndex((slide) => slide.key === code);
      if (idx >= 0) selectIndex(idx);
    },
    [selectIndex, slides],
  );

  const handleLinkClick = useCallback(
    (event: React.MouseEvent) => {
      if (swipedRef.current) {
        event.preventDefault();
        swipedRef.current = false;
        return;
      }
      const search = window.location.search.replace(/^\?/, "");
      saveCatalogFocus(product.id, search);
    },
    [product.id],
  );

  return (
    <article className="group flex flex-col border border-transparent bg-white transition-all hover:-translate-y-1 hover:border-blue">
      <Link
        href={`/catalog/${product.id}`}
        className="block"
        onClick={handleLinkClick}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-off-white touch-pan-y">
          {canSlide ? (
            <PeekCarousel
              slides={slides}
              index={slideIndex}
              onIndexChange={selectIndex}
              onSwipe={() => {
                swipedRef.current = true;
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slides[0]?.src ?? PRODUCT_IMAGE_PLACEHOLDER}
              alt={name}
              decoding="async"
              loading="lazy"
              draggable={false}
              className={
                slides[0]?.fit === "cover"
                  ? "pointer-events-none absolute inset-0 h-full w-full object-cover"
                  : "pointer-events-none absolute inset-0 h-full w-full object-contain p-4"
              }
            />
          )}
        </div>
      </Link>

      <div className="px-4 pt-2">
        {colorwaysWithPhoto.length > 0 || hasFashion ? (
          <ColorDots
            colorways={colorwaysWithPhoto}
            activeCode={activeCode}
            fashionSrc={fashionSrc}
            fashionActive={fashionActive}
            onSelectFashion={hasFashion ? handleSelectFashion : undefined}
            onPreviewFashion={hasFashion ? handleSelectFashion : undefined}
            onPreview={canSlide ? handlePreview : undefined}
            onPreviewEnd={canSlide ? restoreMain : undefined}
          />
        ) : (
          <ColorDots colorways={product.colorways} />
        )}
      </div>

      <Link href={`/catalog/${product.id}`} className="block">
        <div className="flex flex-col gap-2 p-4 pt-3 pb-2">
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

      {product.tech.length > 0 ? (
        <ul className="mt-auto flex flex-wrap gap-1.5 px-4 pb-4">
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
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
