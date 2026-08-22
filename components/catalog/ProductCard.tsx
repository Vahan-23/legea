"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ColorDots } from "@/components/catalog/ColorDots";
import { Link } from "@/i18n/navigation";
import { saveCatalogFocus } from "@/lib/catalogScroll";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImages";
import { isImageCached, prefetchImage } from "@/lib/prefetchImages";
import { useIsMobile } from "@/lib/useIsMobile";
import { productName } from "@/types/product";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";
import type { ProductPhotos } from "@/lib/productImages";

const SWIPE_THRESHOLD_PX = 36;

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
  const defaultSrc = hasFashion ? fashionSrc! : productSrc;

  const colorwaysWithPhoto = useMemo(() => {
    if (!photos) return [];
    return product.colorways.filter((code) => photos.byColorway[code]?.front);
  }, [product.colorways, photos]);

  const canPreview = colorwaysWithPhoto.length > 1;

  const [displaySrc, setDisplaySrc] = useState(defaultSrc);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [colorIndex, setColorIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);

  useEffect(() => {
    setDisplaySrc(defaultSrc);
    setPreviewCode(null);
    setColorIndex(0);
  }, [defaultSrc]);

  const showColorPhoto = useCallback(
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

  const selectColor = useCallback(
    (code: string) => {
      const idx = colorwaysWithPhoto.indexOf(code);
      if (idx >= 0) setColorIndex(idx);
      showColorPhoto(code);
    },
    [colorwaysWithPhoto, showColorPhoto],
  );

  const handlePreview = useCallback(
    (code: string) => {
      if (mobile) {
        selectColor(code);
        return;
      }
      showColorPhoto(code);
    },
    [mobile, selectColor, showColorPhoto],
  );

  const restoreDefault = useCallback(() => {
    setPreviewCode(null);
    setDisplaySrc(defaultSrc);
  }, [defaultSrc]);

  const handlePreviewEnd = useCallback(() => {
    if (mobile) return;
    restoreDefault();
  }, [mobile, restoreDefault]);

  const handleCardEnter = useCallback(() => {
    if (mobile || !hasFashion || previewCode) return;
    if (isImageCached(productSrc)) {
      setDisplaySrc(productSrc);
      return;
    }
    void prefetchImage(productSrc).then(() => {
      setDisplaySrc(productSrc);
    });
  }, [mobile, hasFashion, previewCode, productSrc]);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!mobile || !canPreview) return;
      const touch = event.touches[0];
      if (!touch) return;
      touchStart.current = { x: touch.clientX, y: touch.clientY };
      swipedRef.current = false;
    },
    [mobile, canPreview],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!mobile || !canPreview || !touchStart.current) return;
      const touch = event.changedTouches[0];
      if (!touch) {
        touchStart.current = null;
        return;
      }

      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      touchStart.current = null;

      if (
        Math.abs(dx) < SWIPE_THRESHOLD_PX ||
        Math.abs(dx) < Math.abs(dy) * 1.2
      ) {
        return;
      }

      swipedRef.current = true;
      const count = colorwaysWithPhoto.length;
      setColorIndex((prev) => {
        const next =
          dx < 0 ? (prev + 1) % count : (prev - 1 + count) % count;
        const code = colorwaysWithPhoto[next];
        if (code) showColorPhoto(code);
        return next;
      });
    },
    [mobile, canPreview, colorwaysWithPhoto, showColorPhoto],
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

  const activeCode =
    previewCode ?? colorwaysWithPhoto[colorIndex] ?? null;

  const imageClass = hasFashion
    ? "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
    : "pointer-events-none absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]";

  const showingFashion = hasFashion && displaySrc === fashionSrc;

  return (
    <article
      className="group flex flex-col border border-transparent bg-white transition-all hover:-translate-y-1 hover:border-blue"
      onMouseEnter={hasFashion && !mobile ? handleCardEnter : undefined}
      onMouseLeave={
        (canPreview || hasFashion) && !mobile ? handlePreviewEnd : undefined
      }
    >
      <Link
        href={`/catalog/${product.id}`}
        className="block"
        onClick={handleLinkClick}
      >
        <div
          className="relative aspect-[3/4] overflow-hidden bg-off-white touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {hasFashion ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fashionSrc!}
                alt=""
                decoding="async"
                loading="lazy"
                draggable={false}
                className={`${imageClass} ${
                  showingFashion ? "opacity-100" : "opacity-0"
                }`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displaySrc === fashionSrc ? productSrc : displaySrc}
                alt={name}
                decoding="async"
                loading="lazy"
                draggable={false}
                className={`pointer-events-none absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-500 ${
                  showingFashion ? "opacity-0" : "opacity-100"
                }`}
              />
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc}
              alt={name}
              decoding="async"
              loading="lazy"
              draggable={false}
              className={imageClass}
            />
          )}
        </div>
      </Link>

      <div className="px-4 pt-2">
        {canPreview ? (
          <ColorDots
            colorways={colorwaysWithPhoto}
            activeCode={activeCode}
            onPreview={handlePreview}
          />
        ) : colorwaysWithPhoto.length === 1 ? (
          <ColorDots colorways={colorwaysWithPhoto} />
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
