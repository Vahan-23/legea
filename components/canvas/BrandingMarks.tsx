"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  isBrandingZoneKey,
  ZONE_LAYOUT,
  type BrandingZoneKey,
} from "@/lib/brandingZones";
import { createNumberNameTexture } from "@/lib/logo";
import { colorMap } from "@/data/colors";
import type { BrandingDraft } from "@/types/spec";

type BrandingMarksProps = {
  branding: BrandingDraft;
};

/**
 * Плоскости-декали логотипа и номера на зонах PlaceholderModel.
 */
export function BrandingMarks({ branding }: BrandingMarksProps) {
  const logoTexture = useDataTexture(branding.logoDataUrl);
  const numberTexture = useMemo(() => {
    if (!branding.playerNumber && !branding.playerName) return null;
    const hex =
      colorMap[branding.numberColorKey as keyof typeof colorMap]?.hex ??
      "#111111";
    const url = createNumberNameTexture({
      number: branding.playerNumber,
      name: branding.playerName,
      colorHex: hex,
    });
    if (!url) return null;
    const tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [
    branding.playerNumber,
    branding.playerName,
    branding.numberColorKey,
  ]);

  useEffect(() => {
    return () => {
      numberTexture?.dispose();
    };
  }, [numberTexture]);

  const logoZones = branding.zones.filter(
    (z) => z !== "back-number" && isBrandingZoneKey(z),
  ) as BrandingZoneKey[];

  const showNumber =
    branding.zones.includes("back-number") &&
    Boolean(branding.playerNumber || branding.playerName);

  return (
    <group>
      {logoTexture
        ? logoZones.map((zone) => (
            <ZonePlane
              key={zone}
              zone={zone}
              texture={logoTexture}
              branding={branding}
            />
          ))
        : null}
      {showNumber && numberTexture ? (
        <ZonePlane
          zone="back-number"
          texture={numberTexture}
          branding={branding}
        />
      ) : null}
    </group>
  );
}

function ZonePlane({
  zone,
  texture,
  branding,
}: {
  zone: BrandingZoneKey;
  texture: THREE.Texture;
  branding: BrandingDraft;
  active?: boolean;
}) {
  const layout = ZONE_LAYOUT[zone];
  const useTransform = branding.selectedZone === zone;
  const scale = useTransform ? branding.scale : 1;
  const rotationZ = useTransform
    ? (branding.rotation * Math.PI) / 180
    : 0;
  const offsetY = useTransform ? branding.offsetY : 0;

  const size = layout.size * scale;

  return (
    <mesh
      position={[
        layout.position[0],
        layout.position[1] + offsetY,
        layout.position[2],
      ]}
      rotation={[
        layout.rotation[0],
        layout.rotation[1],
        layout.rotation[2] + rotationZ,
      ]}
      renderOrder={2}
    >
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function useDataTexture(dataUrl: string | null): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      setTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    let disposed = false;
    loader.load(dataUrl, (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    });

    return () => {
      disposed = true;
      setTexture((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, [dataUrl]);

  return texture;
}
