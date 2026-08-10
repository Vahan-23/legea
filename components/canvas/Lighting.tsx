"use client";

import { ContactShadows, Environment } from "@react-three/drei";

type LightingProps = {
  /** На мобильных — более лёгкие тени */
  mobile?: boolean;
};

export function Lighting({ mobile = false }: LightingProps) {
  return (
    <>
      <Environment preset="studio" />
      {/* Key light сверху-справа */}
      <directionalLight
        position={[3.5, 5, 2]}
        intensity={1.15}
        castShadow={!mobile}
      />
      {/* Rim light сзади для контура */}
      <directionalLight position={[-2, 2, -4]} intensity={0.55} />
      <ambientLight intensity={0.25} />
      <ContactShadows
        position={[0, -0.55, 0]}
        opacity={0.45}
        scale={6}
        blur={2.5}
        far={2}
        resolution={mobile ? 256 : 512}
      />
    </>
  );
}
