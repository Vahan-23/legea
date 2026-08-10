"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CanvasLoader } from "@/components/canvas/CanvasLoader";
import { IdleOrbitControls } from "@/components/canvas/IdleOrbitControls";
import { Lighting } from "@/components/canvas/Lighting";
import { ProductModel } from "@/components/canvas/ProductModel";
import { colors } from "@/data/colors";
import { useCanvasCaptureStore } from "@/store/useCanvasCaptureStore";
import type { BrandingDraft } from "@/types/spec";

export type SceneProps = {
  model: string | null;
  colorway: string | null;
  branding?: BrandingDraft | null;
  mobile?: boolean;
};

export function Scene({
  model,
  colorway,
  branding = null,
  mobile = false,
}: SceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const setRenderer = useCanvasCaptureStore((s) => s.setRenderer);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    return () => setRenderer(null);
  }, [setRenderer]);

  return (
    <Canvas
      camera={{ position: [0, 0.35, 2.2], fov: 35 }}
      dpr={[1, 2]}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        alpha: true,
      }}
      style={{ background: colors.offWhite }}
      onCreated={({ gl }) => {
        setRenderer(gl);
      }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <Lighting mobile={mobile} />
        <ProductModel
          model={model}
          colorway={colorway}
          branding={branding}
        />
        <IdleOrbitControls
          enableZoom={!mobile}
          disableAutoRotate={reducedMotion || mobile}
        />
      </Suspense>
    </Canvas>
  );
}
