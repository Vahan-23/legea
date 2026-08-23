"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { PeekCarousel, type PeekCarouselSlide } from "@/components/ui/PeekCarousel";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  collectProductPhotoUrls,
  resolveColorwayPhotos,
  type ProductPhotos,
} from "@/lib/productImages";
import {
  isImageCached,
  prefetchImage,
  prefetchImagesQueued,
} from "@/lib/prefetchImages";
import { prefetchProduct3d, prefetchSceneModule } from "@/lib/prefetchGlb";
import type { SceneProps } from "@/components/canvas/Scene";
import { preserveGlbMaterials, productHasViewer3d } from "@/lib/models";
import { useProductStore } from "@/store/useProductStore";

type ViewMode = "front" | "back" | "3d";

type ProductViewerProps = {
  productId?: string;
  model: string | null;
  colorway: string | null;
  colorways?: string[];
  onColorwayChange?: (code: string) => void;
  alt: string;
  photos?: ProductPhotos;
  /** AI fashion — если задан и fashionActive, показывается вместо front/back */
  fashionSrc?: string | null;
  fashionActive?: boolean;
  onFashionOff?: () => void;
  onFashionOn?: () => void;
};

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}

/**
 * Сразу fashion/фото; если есть 3D — всегда видна кнопка (не прячется).
 */
export function ProductViewer({
  productId,
  model,
  colorway,
  colorways = [],
  onColorwayChange,
  alt,
  photos,
  fashionSrc = null,
  fashionActive = false,
  onFashionOff,
  onFashionOn,
}: ProductViewerProps) {
  const t = useTranslations("product");
  const mobile = useIsMobile();

  const active = useMemo(
    () => resolveColorwayPhotos(photos, colorway),
    [photos, colorway],
  );

  const allPhotoUrls = useMemo(
    () => collectProductPhotoUrls(photos),
    [photos],
  );

  const hasFront = Boolean(active.front);
  const hasBack = Boolean(active.back);
  const hasPhotos = hasFront || hasBack;
  const has3d = productHasViewer3d(productId, model);

  const [mode, setMode] = useState<ViewMode>("front");
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [SceneComp, setSceneComp] = useState<ComponentType<SceneProps> | null>(
    null,
  );
  const [sceneLoading, setSceneLoading] = useState(false);

  useEffect(() => {
    setMode(hasPhotos || fashionSrc ? "front" : has3d ? "3d" : "front");
    setSceneComp(null);
  }, [productId, has3d, hasPhotos, fashionSrc]);

  useEffect(() => {
    if (mode === "back" && !hasBack) {
      setMode(hasFront ? "front" : has3d ? "3d" : "front");
    } else if (mode === "front" && !hasFront && !fashionActive && !fashionSrc) {
      setMode(hasBack ? "back" : has3d ? "3d" : "front");
    } else if (mode === "3d" && !has3d) {
      setMode(hasFront ? "front" : hasBack ? "back" : "front");
    } else if (!hasPhotos && !fashionSrc && has3d) {
      setMode("3d");
    }
  }, [
    colorway,
    hasFront,
    hasBack,
    hasPhotos,
    has3d,
    mode,
    fashionActive,
    fashionSrc,
  ]);

  const swatchColorways = useMemo(() => {
    const fromPhotos = colorways.filter(
      (code) => photos?.byColorway[code]?.front,
    );
    return fromPhotos.length > 1 ? fromPhotos : colorways;
  }, [colorways, photos]);

  const carouselSlides = useMemo((): PeekCarouselSlide[] => {
    const items: PeekCarouselSlide[] = [];
    if (fashionSrc) {
      items.push({
        key: "fashion",
        src: fashionSrc,
        alt,
        fit: "cover",
      });
    }
    for (const code of swatchColorways) {
      const front = photos?.byColorway[code]?.front;
      if (front) {
        items.push({ key: code, src: front, alt, fit: "contain" });
      }
    }
    return items;
  }, [alt, fashionSrc, photos, swatchColorways]);

  const carouselIndex = useMemo(() => {
    if (carouselSlides.length === 0) return 0;
    if (fashionActive && fashionSrc) {
      const fashionIdx = carouselSlides.findIndex(
        (slide) => slide.key === "fashion",
      );
      if (fashionIdx >= 0) return fashionIdx;
    }
    if (colorway) {
      const idx = carouselSlides.findIndex((slide) => slide.key === colorway);
      if (idx >= 0) return idx;
    }
    return carouselSlides.findIndex((slide) => slide.key !== "fashion") >= 0
      ? carouselSlides.findIndex((slide) => slide.key !== "fashion")
      : 0;
  }, [carouselSlides, colorway, fashionActive, fashionSrc]);

  const showCarousel =
    mode !== "3d" && mode !== "back" && carouselSlides.length > 1;

  const activePhoto = showCarousel
    ? carouselSlides[carouselIndex]?.src ?? null
    : mode === "back"
      ? active.back
      : mode === "front"
        ? active.front
        : null;

  const show3d = has3d && mode === "3d";

  const branding = useProductStore((s) => (show3d ? s.branding : null));
  const preserveMaterials = preserveGlbMaterials(productId);

  useEffect(() => {
    if (fashionSrc) void prefetchImage(fashionSrc);
  }, [fashionSrc]);

  useEffect(() => {
    if (fashionActive && fashionSrc) {
      setMode((m) => (m === "3d" ? "front" : m));
    }
  }, [fashionActive, fashionSrc]);

  const handleCarouselIndexChange = useCallback(
    (index: number) => {
      const slide = carouselSlides[index];
      if (!slide) return;
      if (slide.key === "fashion") {
        onFashionOn?.();
        setMode("front");
        return;
      }
      onFashionOff?.();
      onColorwayChange?.(slide.key);
      setMode("front");
    },
    [carouselSlides, onColorwayChange, onFashionOff, onFashionOn],
  );

  const selectMode = (next: ViewMode) => {
    if (next === "3d") onFashionOff?.();
    if (next === "front" || next === "back") onFashionOff?.();
    setMode(next);
  };

  const open3d = () => {
    onFashionOff?.();
    setMode("3d");
  };

  useEffect(() => {
    if (!has3d || !productId) return;
    return prefetchProduct3d(productId, model);
  }, [has3d, productId, model]);

  useEffect(() => {
    if (!show3d || SceneComp) return;
    let cancelled = false;
    setSceneLoading(true);
    void prefetchSceneModule()
      .then((m) => {
        if (!cancelled) {
          setSceneComp((_prev: ComponentType<SceneProps> | null) => m.Scene);
        }
      })
      .finally(() => {
        if (!cancelled) setSceneLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [show3d, SceneComp]);

  useEffect(() => {
    if (!colorway || !photos?.byColorway[colorway]) return;
    const entry = photos.byColorway[colorway];
    if (entry.front) void prefetchImage(entry.front);
    if (entry.back) void prefetchImage(entry.back);
  }, [colorway, photos]);

  useEffect(() => {
    const rest = allPhotoUrls.filter((url) => url !== activePhoto);
    return prefetchImagesQueued(rest, 300);
  }, [allPhotoUrls, activePhoto]);

  useEffect(() => {
    const urls = carouselSlides.map((slide) => slide.src);
    return prefetchImagesQueued(urls, 200);
  }, [carouselSlides]);

  useEffect(() => {
    if (showCarousel) {
      setDisplaySrc(activePhoto);
      setLoading(false);
      return;
    }

    if (!activePhoto) {
      setDisplaySrc(null);
      setLoading(false);
      return;
    }

    if (isImageCached(activePhoto)) {
      setDisplaySrc(activePhoto);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void prefetchImage(activePhoto).then(() => {
      if (!cancelled) {
        setDisplaySrc(activePhoto);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activePhoto, showCarousel]);

  return (
    <div className="w-full max-w-full space-y-3">
      <div className="relative aspect-[3/4] w-full max-w-full overflow-hidden bg-off-white">
        {show3d ? (
          <div className="absolute inset-0 touch-none">
            {SceneComp ? (
              <SceneComp
                productId={productId}
                model={model}
                colorway={colorway}
                branding={branding}
                mobile={mobile}
                preserveMaterials={preserveMaterials}
              />
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-widest text-muted">
                {sceneLoading ? "…" : "3D"}
              </div>
            )}
          </div>
        ) : showCarousel ? (
          <PeekCarousel
            slides={carouselSlides}
            index={carouselIndex}
            onIndexChange={handleCarouselIndexChange}
            showArrows
            prevLabel={t("photoPrev")}
            nextLabel={t("photoNext")}
            overlay={
              loading ? (
                <div
                  className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center sm:top-4"
                  aria-hidden
                >
                  <span className="rounded bg-white/90 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted shadow-sm">
                    …
                  </span>
                </div>
              ) : null
            }
          />
        ) : (
          <>
            {displaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displaySrc}
                alt={alt}
                decoding="async"
                className="absolute inset-0 h-full w-full object-contain p-3 sm:p-4"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={PRODUCT_IMAGE_PLACEHOLDER}
                alt={alt}
                className="absolute inset-0 h-full w-full object-contain p-3 sm:p-4"
              />
            )}
            {loading ? (
              <div
                className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center sm:top-4"
                aria-hidden
              >
                <span className="rounded bg-white/90 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted shadow-sm">
                  …
                </span>
              </div>
            ) : null}
          </>
        )}
      </div>

      {hasPhotos || has3d ? (
        <div className="flex flex-wrap gap-2">
          {hasFront ? (
            <Button
              type="button"
              variant={
                mode === "front" && !fashionActive ? "primary" : "secondary"
              }
              className="px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm"
              onClick={() => selectMode("front")}
            >
              {t("photoFront")}
            </Button>
          ) : null}
          {hasBack ? (
            <Button
              type="button"
              variant={mode === "back" ? "primary" : "secondary"}
              className="px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm"
              onClick={() => selectMode("back")}
            >
              {t("photoBack")}
            </Button>
          ) : null}
          {has3d ? (
            <Button
              type="button"
              variant={mode === "3d" ? "primary" : "secondary"}
              className="px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm"
              onClick={open3d}
            >
              3D
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
