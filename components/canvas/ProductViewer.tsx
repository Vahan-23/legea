"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
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
import { swatchBackground } from "@/lib/colorCode";
import type { SceneProps } from "@/components/canvas/Scene";
import { preserveGlbMaterials, productHasViewer3d } from "@/lib/models";
import { useProductStore } from "@/store/useProductStore";

type ViewMode = "front" | "back" | "3d";

export type ProductViewMode = ViewMode;

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
  /** Управление режимом снаружи (свотчи 3D / фото) */
  mode?: ProductViewMode;
  onModeChange?: (mode: ProductViewMode) => void;
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
  mode: controlledMode,
  onModeChange,
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

  const [internalMode, setInternalMode] = useState<ViewMode>("front");
  const mode = controlledMode ?? internalMode;
  const onModeChangeRef = useRef(onModeChange);
  onModeChangeRef.current = onModeChange;

  const updateMode = useCallback(
    (next: ViewMode) => {
      if (controlledMode === undefined) {
        setInternalMode(next);
      }
      onModeChangeRef.current?.(next);
    },
    [controlledMode],
  );
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [SceneComp, setSceneComp] = useState<ComponentType<SceneProps> | null>(
    null,
  );
  const [sceneLoading, setSceneLoading] = useState(false);
  const prefetchCancelRef = useRef<(() => void) | null>(null);
  const prevColorwayRef = useRef<string | null>(null);
  const prevProductIdRef = useRef(productId);
  const [colorReveal, setColorReveal] = useState<{
    key: number;
    color: string;
  } | null>(null);

  useEffect(() => {
    setSceneComp(null);
    if (controlledMode !== undefined) return;
    const initial = hasPhotos || fashionSrc ? "front" : has3d ? "3d" : "front";
    setInternalMode(initial);
  }, [productId, has3d, hasPhotos, fashionSrc, controlledMode]);

  useEffect(() => {
    if (mode === "back" && !hasBack) {
      updateMode(hasFront ? "front" : has3d ? "3d" : "front");
    } else if (mode === "3d" && !has3d) {
      updateMode(hasFront ? "front" : hasBack ? "back" : "front");
    } else if (
      mode === "front" &&
      !hasFront &&
      !fashionActive &&
      !fashionSrc &&
      !hasBack
    ) {
      updateMode(has3d ? "3d" : "front");
    } else if (!hasPhotos && !fashionSrc && has3d && mode !== "3d") {
      updateMode("3d");
    }
  }, [
    hasFront,
    hasBack,
    hasPhotos,
    has3d,
    mode,
    fashionActive,
    fashionSrc,
    updateMode,
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
    if (fashionActive && fashionSrc && mode === "3d") {
      updateMode("front");
    }
  }, [fashionActive, fashionSrc, mode, updateMode]);

  /** Смена расцветки в 3D → фото + короткая «раскрывающая» анимация */
  useEffect(() => {
    if (productId !== prevProductIdRef.current) {
      prevProductIdRef.current = productId;
      prevColorwayRef.current = colorway;
      setColorReveal(null);
      return;
    }

    if (!colorway || prevColorwayRef.current === colorway) return;

    const was3d = mode === "3d";
    prevColorwayRef.current = colorway;

    if (!was3d) return;

    if (hasFront || hasBack) {
      updateMode(hasFront ? "front" : "back");
    }

    let flashColor = "#1e7fe0";
    try {
      flashColor = swatchBackground(colorway);
    } catch {
      /* ignore */
    }

    setColorReveal((prev) => ({ key: (prev?.key ?? 0) + 1, color: flashColor }));
    const timer = window.setTimeout(() => setColorReveal(null), 900);
    return () => window.clearTimeout(timer);
  }, [
    colorway,
    productId,
    mode,
    hasFront,
    hasBack,
    updateMode,
  ]);

  const handleCarouselIndexChange = useCallback(
    (index: number) => {
      const slide = carouselSlides[index];
      if (!slide) return;
      if (slide.key === "fashion") {
        onFashionOn?.();
        updateMode("front");
        return;
      }
      onFashionOff?.();
      onColorwayChange?.(slide.key);
      updateMode("front");
    },
    [carouselSlides, onColorwayChange, onFashionOff, onFashionOn, updateMode],
  );

  const selectMode = (next: ViewMode) => {
    if (next === "3d") onFashionOff?.();
    if (next === "front" || next === "back") onFashionOff?.();
    updateMode(next);
  };

  useEffect(() => {
    if (mode !== "3d" || !productId) return;
    prefetchCancelRef.current?.();
    prefetchCancelRef.current = prefetchProduct3d(productId, model);
  }, [mode, productId, model]);

  useEffect(() => {
    return () => {
      prefetchCancelRef.current?.();
    };
  }, [productId]);

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
        {colorReveal ? (
          <div
            key={colorReveal.key}
            className="viewer-color-flash pointer-events-none absolute inset-0 z-20"
            style={{ backgroundColor: colorReveal.color }}
            aria-hidden
          />
        ) : null}
        {colorReveal ? (
          <div
            key={`toast-${colorReveal.key}`}
            className="viewer-color-toast pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4 sm:bottom-6"
            role="status"
            aria-live="polite"
          >
            <span className="rounded bg-navy px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white shadow-lg sm:text-xs">
              {t("colorwaySwitchFlash")}
            </span>
          </div>
        ) : null}
        {show3d ? (
          <div className="absolute inset-0 touch-none">
            {SceneComp ? (
              <SceneComp
                productId={productId}
                model={model}
                colorway={null}
                branding={branding}
                mobile={mobile}
                preserveMaterials={preserveMaterials}
                presentation
              />
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-widest text-muted">
                {sceneLoading ? "…" : "3D"}
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center sm:top-4"
              aria-hidden
            >
              <span className="rounded bg-navy/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white shadow-sm">
                {t("view3dOriginal")}
              </span>
            </div>
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
                key={displaySrc}
                src={displaySrc}
                alt={alt}
                decoding="async"
                className={`absolute inset-0 h-full w-full object-contain p-3 sm:p-4 ${
                  colorReveal ? "viewer-photo-reveal" : ""
                }`}
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

      {hasPhotos ? (
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
        </div>
      ) : null}
    </div>
  );
}
