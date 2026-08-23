"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ColorDots } from "@/components/catalog/ColorDots";
import { ProductCardImage } from "@/components/catalog/ProductCardImage";
import { PeekCarousel, type PeekCarouselSlide } from "@/components/ui/PeekCarousel";
import { Link, useRouter } from "@/i18n/navigation";
import { saveCatalogFocus } from "@/lib/catalogScroll";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImages";
import { prefetchImage } from "@/lib/prefetchImages";
import { useIsMobile } from "@/lib/useIsMobile";
import { productName } from "@/types/product";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";
import type { ProductPhotos } from "@/lib/productImages";

type ProductCardProps = {
  product: Product;
  photos?: ProductPhotos;
  fashionSrc?: string | null;
  eager?: boolean;
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
  eager = false,
}: ProductCardProps) {
  const locale = useLocale() as Locale;
  const mobile = useIsMobile();
  const router = useRouter();
  const name = productName(product, locale);
  const productHref = `/catalog/${product.id}` as const;

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
    const first = slides[0]?.src;
    if (first) void prefetchImage(first);
  }, [slides]);

  const warmProductPage = useCallback(() => {
    router.prefetch(productHref);
    for (const slide of slides) {
      if (slide.src) void prefetchImage(slide.src);
    }
  }, [router, productHref, slides]);

  const activeSlide = slides[slideIndex];
  const fashionActive = activeSlide?.key === "fashion";
  const activeCode = fashionActive ? null : activeSlide?.key ?? null;

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
    selectIndex(0);
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

  const showSwatches = colorwaysWithPhoto.length > 0 || hasFashion;

  return (
    <article
      className="group flex min-w-0 flex-col overflow-hidden"
      onMouseEnter={warmProductPage}
      onTouchStart={warmProductPage}
    >
      <Link
        href={productHref}
        prefetch
        className="block min-w-0"
        onClick={handleLinkClick}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-off-white">
          {canSlide ? (
            <PeekCarousel
              slides={slides}
              index={slideIndex}
              onIndexChange={selectIndex}
              layout="slide"
              imagePriority={eager}
              onSwipe={() => {
                swipedRef.current = true;
              }}
            />
          ) : (
            <ProductCardImage
              src={slides[0]?.src ?? PRODUCT_IMAGE_PLACEHOLDER}
              alt={name}
              fit={slides[0]?.fit}
              priority={eager}
              className="transition-transform duration-500 group-hover:scale-[1.02]"
            />
          )}
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-3">
        {showSwatches ? (
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
        ) : product.colorways.length > 0 ? (
          <ColorDots colorways={product.colorways} />
        ) : null}

        <Link
          href={productHref}
          prefetch
          className="block min-w-0 space-y-1"
          onClick={handleLinkClick}
        >
          <h3 className="font-sans text-sm font-medium normal-case tracking-normal text-graphite transition-colors group-hover:text-navy sm:text-[15px]">
            {name}
          </h3>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            {product.id}
          </p>
        </Link>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);
