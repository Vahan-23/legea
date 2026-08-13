"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { CanvasLoader } from "@/components/canvas/CanvasLoader";
import {
  IdleOrbitControls,
  DEFAULT_CAMERA_POSITION,
} from "@/components/canvas/IdleOrbitControls";
import { Lighting } from "@/components/canvas/Lighting";
import { ProductModel } from "@/components/canvas/ProductModel";
import { colors } from "@/data/colors";
import { useCanvasCaptureStore } from "@/store/useCanvasCaptureStore";
import type { BrandingDraft } from "@/types/spec";

export type SceneProps = {
  productId?: string | null;
  glbUrl?: string | null;
  preserveMaterials?: boolean;
  model: string | null;
  colorway: string | null;
  branding?: BrandingDraft | null;
  mobile?: boolean;
  /** Прозрачный фон canvas */
  transparent?: boolean;
  /** Без orbit/zoom/drag — только автоповорот модели */
  interactive?: boolean;
  /** Масштаб модели в сцене */
  modelScale?: number;
};

function AutoSpin({
  enabled,
  scale = 1,
  children,
}: {
  enabled: boolean;
  scale?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!enabled || !ref.current) return;
    ref.current.rotation.y += delta * 0.35;
  });

  return (
    <group ref={ref} scale={scale}>
      {children}
    </group>
  );
}

export function Scene({
  productId = null,
  glbUrl = null,
  preserveMaterials = false,
  model,
  colorway,
  branding = null,
  mobile = false,
  transparent = false,
  interactive = true,
  modelScale = 1,
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
    if (!interactive) return;
    return () => setRenderer(null);
  }, [interactive, setRenderer]);

  const spin = !interactive && !reducedMotion;

  // Display-only: дальше камера — модель целиком в кадре
  const cameraPosition = interactive
    ? DEFAULT_CAMERA_POSITION
    : ([
        DEFAULT_CAMERA_POSITION[0] * 1.2,
        DEFAULT_CAMERA_POSITION[1] * 1.2,
        DEFAULT_CAMERA_POSITION[2] * 1.2,
      ] as [number, number, number]);

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: 35 }}
      dpr={mobile ? 1 : [1, 1.5]}
      gl={{
        preserveDrawingBuffer: interactive,
        antialias: true,
        alpha: true,
      }}
      style={{
        width: "100%",
        height: "100%",
        background: transparent ? "transparent" : colors.offWhite,
        pointerEvents: interactive ? "auto" : "none",
        touchAction: interactive && !mobile ? "none" : undefined,
      }}
      onCreated={({ gl }) => {
        // Не чёрный clear — иначе alpha=1 заливает canvas чёрным поверх CSS
        if (transparent) {
          gl.setClearColor(0x000000, 0);
        } else {
          gl.setClearColor(colors.offWhite, 1);
        }
        if (interactive) setRenderer(gl);
      }}
    >
      <Suspense fallback={interactive ? <CanvasLoader /> : null}>
        <Lighting mobile={mobile} showFloorShadow={interactive && !transparent} />
        <AutoSpin enabled={spin} scale={modelScale}>
          <ProductModel
            productId={productId}
            glbUrl={glbUrl}
            preserveMaterials={preserveMaterials}
            model={model}
            colorway={colorway}
            branding={branding}
          />
        </AutoSpin>
        {interactive ? (
          <IdleOrbitControls
            enableZoom={!mobile}
            disableAutoRotate={reducedMotion || mobile}
          />
        ) : null}
      </Suspense>
    </Canvas>
  );
}
