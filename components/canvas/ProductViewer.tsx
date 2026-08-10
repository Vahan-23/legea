"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
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

type ProductViewerProps = {
  model: string | null;
  colorway: string | null;
  alt: string;
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
 * 3D-вьюер карточки: на мобильных — статичное превью + кнопка «Посмотреть в 3D».
 */
export function ProductViewer({ model, colorway, alt }: ProductViewerProps) {
  const t = useTranslations("product");
  const branding = useProductStore((s) => s.branding);
  const mobile = useIsMobile();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (mobile) setEnabled(false);
  }, [model, mobile]);

  const show3d = !mobile || enabled;

  return (
    <div className="relative aspect-[3/4] overflow-hidden bg-off-white">
      {show3d ? (
        <Scene
          model={model}
          colorway={colorway}
          branding={branding}
          mobile={mobile}
        />
      ) : (
        <>
          <Image
            src="/images/product-placeholder.svg"
            alt={alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 50vw"
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
            <Button type="button" onClick={() => setEnabled(true)}>
              {t("view3d")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
