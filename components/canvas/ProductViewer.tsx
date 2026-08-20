"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
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
import type { SceneProps } from "@/components/canvas/Scene";
import { preserveGlbMaterials } from "@/lib/models";
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
 * Одно фото в DOM + 3D только по клику (three.js не грузится заранее).
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

  const [mode, setMode] = useState<ViewMode>(hasFront ? "front" : "3d");
  const [mobile3d, setMobile3d] = useState(false);
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [SceneComp, setSceneComp] = useState<ComponentType<SceneProps> | null>(
    null,
  );
  const [sceneLoading, setSceneLoading] = useState(false);

  useEffect(() => {
    if (mode === "back" && !hasBack) {
      setMode(hasFront ? "front" : "3d");
    } else if (mode === "front" && !hasFront) {
      setMode(hasBack ? "back" : "3d");
    } else if (mode !== "3d" && !hasPhotos) {
      setMode("3d");
    }
    setMobile3d(false);
  }, [colorway, hasFront, hasBack, hasPhotos, mode]);

  const showFashion =
    Boolean(fashionSrc) && fashionActive && mode !== "3d";

  const activePhoto = showFashion
    ? fashionSrc
    : mode === "back"
      ? active.back
      : mode === "front"
        ? active.front
        : null;

  const show3d = hasPhotos ? mode === "3d" : !mobile || mobile3d;

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

  const swatchColorways = useMemo(() => {
    const fromPhotos = colorways.filter(
      (code) => photos?.byColorway[code]?.front,
    );
    return fromPhotos.length > 1 ? fromPhotos : colorways;
  }, [colorways, photos]);

  /** Fashion + расцветки — для стрелок */
  const arrowSteps = useMemo(() => {
    const steps: Array<"fashion" | string> = [];
    if (fashionSrc) steps.push("fashion");
    steps.push(...swatchColorways);
    return steps;
  }, [fashionSrc, swatchColorways]);

  const goColorway = (delta: number) => {
    if (arrowSteps.length < 2) return;
    const current: "fashion" | string =
      fashionActive && fashionSrc
        ? "fashion"
        : colorway && arrowSteps.includes(colorway)
          ? colorway
          : (arrowSteps.find((s) => s !== "fashion") ?? arrowSteps[0]!);
    const idx = arrowSteps.indexOf(current);
    const base = idx >= 0 ? idx : 0;
    const next =
      arrowSteps[(base + delta + arrowSteps.length) % arrowSteps.length];
    if (!next) return;
    if (next === "fashion") {
      onFashionOn?.();
      setMode("front");
      return;
    }
    onFashionOff?.();
    onColorwayChange?.(next);
  };

  const selectMode = (next: ViewMode) => {
    if (next === "front" || next === "back") onFashionOff?.();
    setMode(next);
  };

  // Подгружаем R3F/three только когда реально нужен 3D
  useEffect(() => {
    if (!show3d || SceneComp) return;
    let cancelled = false;
    setSceneLoading(true);
    void import("@/components/canvas/Scene")
      .then((m) => {
        if (!cancelled) {
          // Updater form: state is a component (function), not a lazy initializer.
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
  }, [activePhoto]);

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
        ) : (
          <>
            {displaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- прямой cache, без 16× /_next/image
              <img
                src={displaySrc}
                alt={alt}
                decoding="async"
                className={
                  showFashion
                    ? "absolute inset-0 h-full w-full object-cover"
                    : "absolute inset-0 h-full w-full object-contain p-3 sm:p-4"
                }
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
            {!hasPhotos && mobile ? (
              <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 sm:p-4">
                <Button type="button" onClick={() => setMobile3d(true)}>
                  {t("view3d")}
                </Button>
              </div>
            ) : null}
          </>
        )}

        {arrowSteps.length > 1 ? (
          <>
            <button
              type="button"
              aria-label={t("photoPrev")}
              onClick={() => goColorway(-1)}
              className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm ring-1 ring-navy/10 transition hover:bg-white sm:left-3 sm:h-11 sm:w-11"
            >
              <span aria-hidden className="text-lg leading-none sm:text-xl">
                ‹
              </span>
            </button>
            <button
              type="button"
              aria-label={t("photoNext")}
              onClick={() => goColorway(1)}
              className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm ring-1 ring-navy/10 transition hover:bg-white sm:right-3 sm:h-11 sm:w-11"
            >
              <span aria-hidden className="text-lg leading-none sm:text-xl">
                ›
              </span>
            </button>
          </>
        ) : null}
      </div>

      {hasPhotos && !fashionActive ? (
        <div className="flex flex-wrap gap-2">
          {hasFront ? (
            <Button
              type="button"
              variant={mode === "front" ? "primary" : "secondary"}
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
          <Button
            type="button"
            variant={mode === "3d" ? "primary" : "secondary"}
            className="px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm"
            onClick={() => selectMode("3d")}
          >
            {t("view3d")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
