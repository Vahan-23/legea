"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type IdleOrbitControlsProps = {
  /** На мобильных — без зума (pinch конфликтует со скроллом) */
  enableZoom?: boolean;
  /** Отключить autoRotate (prefers-reduced-motion) */
  disableAutoRotate?: boolean;
};

const IDLE_MS = 3000;
const AUTO_SPEED = 0.4;
/** Ограничение зума относительно цели (камера стартует ~2.2) */
const MIN_DISTANCE = 1.4;
const MAX_DISTANCE = 3.6;

/**
 * OrbitControls: pan off, polar clamp, autoRotate после 3 с бездействия.
 */
export function IdleOrbitControls({
  enableZoom = true,
  disableAutoRotate = false,
}: IdleOrbitControlsProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const idleSince = useRef(performance.now());
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;

    const bump = () => {
      idleSince.current = performance.now();
      if (controls.current) controls.current.autoRotate = false;
    };

    el.addEventListener("pointerdown", bump);
    el.addEventListener("wheel", bump, { passive: true });
    el.addEventListener("touchstart", bump, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", bump);
      el.removeEventListener("wheel", bump);
      el.removeEventListener("touchstart", bump);
    };
  }, [gl]);

  useFrame(() => {
    if (disableAutoRotate || !controls.current) return;
    const idle = performance.now() - idleSince.current >= IDLE_MS;
    controls.current.autoRotate = idle;
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableZoom={enableZoom}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={Math.PI * 0.25}
      maxPolarAngle={Math.PI * 0.75}
      autoRotate={false}
      autoRotateSpeed={AUTO_SPEED}
      makeDefault
    />
  );
}
