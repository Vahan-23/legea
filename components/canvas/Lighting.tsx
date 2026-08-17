"use client";

import { ContactShadows } from "@react-three/drei";

type LightingProps = {
  /** На мобильных — более лёгкие тени */
  mobile?: boolean;
  /** Контактная тень под моделью (выкл. на прозрачном hero) */
  showFloorShadow?: boolean;
};

/**
 * Лёгкий свет без HDR Environment (apartment тянет мегабайты и сдвигает цвета).
 */
export function Lighting({
  mobile = false,
  showFloorShadow = true,
}: LightingProps) {
  return (
    <>
      <hemisphereLight color="#f5f2ec" groundColor="#b0aaa0" intensity={0.85} />
      <directionalLight
        position={[2.2, 5, 2.8]}
        intensity={0.85}
        castShadow={!mobile && showFloorShadow}
      />
      <directionalLight position={[-2.5, 2, -1.5]} intensity={0.35} />
      <ambientLight intensity={0.7} />
      {showFloorShadow ? (
        <ContactShadows
          position={[0, -0.85, 0]}
          opacity={0.1}
          scale={8}
          blur={3.5}
          far={3}
          resolution={mobile ? 128 : 256}
        />
      ) : null}
    </>
  );
}
