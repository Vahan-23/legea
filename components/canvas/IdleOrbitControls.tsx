"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type IdleOrbitControlsProps = {
  /** На мобильных — без зума (pinch конфликтует со скроллом) */
  enableZoom?: boolean;
  /** Отключить autoRotate (prefers-reduced-motion) */
  disableAutoRotate?: boolean;
};

const IDLE_MS = 3000;
const AUTO_SPEED = 0.8;
/**
 * Зум: стартуем на maxDistance = минимальный зум (максимальное отдаление).
 * Камера Scene должна совпадать с DEFAULT_DISTANCE.
 */
export const MIN_DISTANCE = 1.2;
export const MAX_DISTANCE = 3.6;
export const DEFAULT_DISTANCE = MAX_DISTANCE;

/** Начальная позиция камеры на DEFAULT_DISTANCE (тот же ракурс, что [0, 0.35, 2.2]) */
export const DEFAULT_CAMERA_POSITION: [number, number, number] = (() => {
  const ref = new THREE.Vector3(0, 0.35, 2.2);
  ref.setLength(DEFAULT_DISTANCE);
  return [ref.x, ref.y, ref.z];
})();

/**
 * OrbitControls: pan off, polar clamp, autoRotate после 3 с бездействия.
 * По умолчанию — мин. зум (maxDistance).
 */
export function IdleOrbitControls({
  enableZoom = true,
  disableAutoRotate = false,
}: IdleOrbitControlsProps) {
  const controls = useRef<OrbitControlsImpl>(null);
  const idleSince = useRef(performance.now());
  const { gl, camera } = useThree();

  useEffect(() => {
    const dir = new THREE.Vector3(0, 0.35, 2.2).normalize();
    camera.position.copy(dir.multiplyScalar(DEFAULT_DISTANCE));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const c = controls.current;
    if (c) {
      c.target.set(0, 0, 0);
      c.minDistance = MIN_DISTANCE;
      c.maxDistance = MAX_DISTANCE;
      c.update();
    }
  }, [camera]);

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
      minPolarAngle={Math.PI * 0.12}
      maxPolarAngle={Math.PI * 0.88}
      autoRotate={false}
      autoRotateSpeed={AUTO_SPEED}
      makeDefault
    />
  );
}
