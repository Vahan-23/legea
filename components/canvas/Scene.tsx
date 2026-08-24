"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
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
  /** Витринный режим на карточке товара — мягкий автоповорот и подиум */
  presentation?: boolean;
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

function PresentationPedestal() {
  return (
    <group position={[0, -0.86, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[0.55, 0.72, 64]} />
        <meshStandardMaterial
          color="#d8dde6"
          metalness={0.15}
          roughness={0.85}
          transparent
          opacity={0.55}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <circleGeometry args={[0.78, 64]} />
        <meshStandardMaterial
          color="#eef1f6"
          metalness={0}
          roughness={1}
          transparent
          opacity={0.35}
        />
      </mesh>
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
  modelScale = 0.85,
  presentation = false,
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

  const cameraPosition = interactive
    ? DEFAULT_CAMERA_POSITION
    : ([
        DEFAULT_CAMERA_POSITION[0] * 1.2,
        DEFAULT_CAMERA_POSITION[1] * 1.2,
        DEFAULT_CAMERA_POSITION[2] * 1.2,
      ] as [number, number, number]);

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: presentation ? 32 : 35 }}
      dpr={mobile ? 1 : [1, 1.5]}
      gl={{
        preserveDrawingBuffer: interactive,
        antialias: true,
        alpha: true,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      flat
      style={{
        width: "100%",
        height: "100%",
        background: transparent ? "transparent" : colors.offWhite,
        pointerEvents: interactive ? "auto" : "none",
        touchAction: interactive && !mobile ? "none" : undefined,
      }}
      onCreated={({ gl }) => {
        if (transparent) {
          gl.setClearColor(0x000000, 0);
        } else {
          gl.setClearColor(colors.offWhite, 1);
        }
        if (interactive) setRenderer(gl);
      }}
    >
      <Suspense fallback={interactive ? <CanvasLoader /> : null}>
        <Lighting
          mobile={mobile}
          showFloorShadow={interactive && !transparent}
          presentation={presentation}
        />
        {presentation ? <PresentationPedestal /> : null}
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
            disableAutoRotate={reducedMotion}
            idleMs={presentation ? 1200 : 3000}
            autoRotateSpeed={presentation ? 1.1 : 0.8}
          />
        ) : null}
      </Suspense>
    </Canvas>
  );
}
