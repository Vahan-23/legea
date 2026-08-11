"use client";

import { ContactShadows, Environment } from "@react-three/drei";

type LightingProps = {
  /** На мобильных — более лёгкие тени */
  mobile?: boolean;
  /** Контактная тень под моделью (выкл. на прозрачном hero) */
  showFloorShadow?: boolean;
};

/**
 * Мягкий «комнатный» свет — без studio HDR и жёстких rim/key.
 */
export function Lighting({
  mobile = false,
  showFloorShadow = true,
}: LightingProps) {
  return (
    <>
      <Environment preset="apartment" environmentIntensity={0.7} />
      <hemisphereLight color="#f3efe8" groundColor="#9a958c" intensity={0.5} />
      {/* Слабый потолочный fill */}
      <directionalLight
        position={[1.2, 4.5, 1.5]}
        intensity={0.28}
        castShadow={!mobile && showFloorShadow}
      />
      <ambientLight intensity={0.4} />
      {showFloorShadow ? (
        <ContactShadows
          position={[0, -0.85, 0]}
          opacity={0.12}
          scale={8}
          blur={4}
          far={3}
          resolution={mobile ? 256 : 512}
        />
      ) : null}
    </>
  );
}
