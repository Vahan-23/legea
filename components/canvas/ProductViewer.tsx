"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  PRODUCT_IMAGE_PLACEHOLDER,
  resolveColorwayPhotos,
  type ProductPhotos,
} from "@/lib/productImages";
import { useProductStore } from "@/store/useProductStore";

const Scene = dynamic(
  () => import("@/components/canvas/Scene").then((m) => m.Scene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-widest text-muted">
        …
      </div>
    ),
  },
);

type ViewMode = "front" | "back" | "3d";

type ProductViewerProps = {
  productId?: string;
  model: string | null;
  colorway: string | null;
  alt: string;
  photos?: ProductPhotos;
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
 * Превью карточки: фото front/back по расцветке; иначе 3D / mobile CTA.
 */
export function ProductViewer({
  productId,
  model,
  colorway,
  alt,
  photos,
}: ProductViewerProps) {
  const t = useTranslations("product");
  const branding = useProductStore((s) => s.branding);
  const mobile = useIsMobile();

  const active = useMemo(
    () => resolveColorwayPhotos(photos, colorway),
    [photos, colorway],
  );

  const hasFront = Boolean(active.front);
  const hasBack = Boolean(active.back);
  const hasPhotos = hasFront || hasBack;

  const [mode, setMode] = useState<ViewMode>(hasFront ? "front" : "3d");
  const [mobile3d, setMobile3d] = useState(false);

  useEffect(() => {
    if (mode === "back" && !hasBack) {
      setMode(hasFront ? "front" : "3d");
    } else if (mode === "front" && !hasFront) {
      setMode(hasBack ? "back" : "3d");
    } else if (mode !== "3d" && !hasPhotos) {
      setMode("3d");
    }
    setMobile3d(false);
  }, [model, colorway, hasFront, hasBack, hasPhotos, mode]);

  const activePhoto =
    mode === "back" ? active.back : mode === "front" ? active.front : null;

  const show3d = hasPhotos ? mode === "3d" : !mobile || mobile3d;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] overflow-visible bg-off-white">
        {show3d ? (
          <Scene
            productId={productId}
            model={model}
            colorway={colorway}
            branding={branding}
            mobile={mobile}
          />
        ) : (
          <>
            <Image
              src={
                hasPhotos
                  ? (activePhoto ?? PRODUCT_IMAGE_PLACEHOLDER)
                  : PRODUCT_IMAGE_PLACEHOLDER
              }
              alt={alt}
              fill
              priority
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {!hasPhotos && mobile ? (
              <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
                <Button type="button" onClick={() => setMobile3d(true)}>
                  {t("view3d")}
                </Button>
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
              variant={mode === "front" ? "primary" : "secondary"}
              onClick={() => setMode("front")}
            >
              {t("photoFront")}
            </Button>
          ) : null}
          {hasBack ? (
            <Button
              type="button"
              variant={mode === "back" ? "primary" : "secondary"}
              onClick={() => setMode("back")}
            >
              {t("photoBack")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={mode === "3d" ? "primary" : "secondary"}
            onClick={() => setMode("3d")}
          >
            {t("view3d")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
