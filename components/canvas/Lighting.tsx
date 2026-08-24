"use client";

import { ContactShadows } from "@react-three/drei";

type LightingProps = {
  /** На мобильных — более лёгкие тени */
  mobile?: boolean;
  /** Контактная тень под моделью (выкл. на прозрачном hero) */
  showFloorShadow?: boolean;
  /** Витринный свет на карточке товара */
  presentation?: boolean;
};

/**
 * Лёгкий свет без HDR Environment (apartment тянет мегабайты и сдвигает цвета).
 */
export function Lighting({
  mobile = false,
  showFloorShadow = true,
  presentation = false,
}: LightingProps) {
  return (
    <>
      <hemisphereLight
        color={presentation ? "#faf8f4" : "#f5f2ec"}
        groundColor={presentation ? "#c8c2b8" : "#b0aaa0"}
        intensity={presentation ? 0.95 : 0.85}
      />
      <directionalLight
        position={presentation ? [1.8, 4.5, 3.2] : [2.2, 5, 2.8]}
        intensity={presentation ? 1 : 0.85}
        castShadow={!mobile && showFloorShadow}
      />
      <directionalLight
        position={presentation ? [-2, 2.5, -1.2] : [-2.5, 2, -1.5]}
        intensity={presentation ? 0.45 : 0.35}
      />
      {presentation ? (
        <directionalLight position={[0, 1.5, -3.5]} intensity={0.2} />
      ) : null}
      <ambientLight intensity={presentation ? 0.55 : 0.7} />
      {showFloorShadow ? (
        <ContactShadows
          position={[0, -0.85, 0]}
          opacity={presentation ? 0.16 : 0.1}
          scale={8}
          blur={presentation ? 4 : 3.5}
          far={3}
          resolution={mobile ? 128 : 256}
        />
      ) : null}
    </>
  );
}
