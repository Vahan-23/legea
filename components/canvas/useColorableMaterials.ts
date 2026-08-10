"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { parseColorway } from "@/lib/colorCode";
import {
  hexToColor,
  useFabricNormalMap,
} from "@/components/canvas/fabricTexture";

const LERP_MS = 400;

type ColorTargets = {
  base: THREE.Color;
  trim: THREE.Color;
  iridescent: boolean;
};

function resolveTargets(colorway: string | null): ColorTargets {
  const fallback: ColorTargets = {
    base: new THREE.Color("#1E5FD0"),
    trim: new THREE.Color("#14204A"),
    iridescent: false,
  };

  if (!colorway) return fallback;

  try {
    const parsed = parseColorway(colorway);
    if (parsed.kind === "kit") {
      return {
        base: hexToColor(parsed.top.base),
        trim: hexToColor(parsed.top.trim),
        iridescent: parsed.top.isIridescent,
      };
    }
    return {
      base: hexToColor(parsed.base),
      trim: hexToColor(parsed.trim),
      iridescent: parsed.isIridescent,
    };
  } catch {
    return fallback;
  }
}

export type ColorableMaterials = {
  base: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
  trim: THREE.MeshStandardMaterial;
  logo: THREE.MeshStandardMaterial;
};

function createBaseMaterial(
  color: THREE.Color,
  iridescent: boolean,
  normalMap: THREE.CanvasTexture | null,
): THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial {
  if (iridescent) {
    return new THREE.MeshPhysicalMaterial({
      color: color.clone(),
      roughness: 0.55,
      metalness: 0.1,
      iridescence: 1,
      iridescenceIOR: 1.8,
      normalMap: normalMap ?? undefined,
      normalScale: new THREE.Vector2(0.4, 0.4),
    });
  }

  return new THREE.MeshStandardMaterial({
    color: color.clone(),
    roughness: 0.85,
    metalness: 0,
    normalMap: normalMap ?? undefined,
    normalScale: new THREE.Vector2(0.4, 0.4),
  });
}

/**
 * Материалы Base/Trim/Logo + lerp цвета за 400 мс в useFrame.
 */
export function useColorableMaterials(
  colorway: string | null,
): ColorableMaterials {
  const normalMap = useFabricNormalMap();
  const targets = useMemo(() => resolveTargets(colorway), [colorway]);
  const iridescent = targets.iridescent;

  const materials = useMemo(() => {
    const base = createBaseMaterial(targets.base, iridescent, normalMap);
    const trim = new THREE.MeshStandardMaterial({
      color: targets.trim.clone(),
      roughness: 0.85,
      metalness: 0,
      normalMap: normalMap ?? undefined,
      normalScale: new THREE.Vector2(0.4, 0.4),
    });
    const logo = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.6,
      metalness: 0.05,
    });
    return { base, trim, logo };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- targets применяются lerp'ом
  }, [normalMap, iridescent]);

  const current = useRef({
    base: targets.base.clone(),
    trim: targets.trim.clone(),
  });
  const goal = useRef(targets);
  const progress = useRef(1);
  const start = useRef({
    base: targets.base.clone(),
    trim: targets.trim.clone(),
  });

  useEffect(() => {
    start.current = {
      base: current.current.base.clone(),
      trim: current.current.trim.clone(),
    };
    goal.current = targets;
    progress.current = 0;
  }, [targets]);

  useFrame((_, delta) => {
    if (progress.current >= 1) return;

    progress.current = Math.min(1, progress.current + (delta * 1000) / LERP_MS);
    const t = progress.current;

    current.current.base.copy(start.current.base).lerp(goal.current.base, t);
    current.current.trim.copy(start.current.trim).lerp(goal.current.trim, t);

    materials.base.color.copy(current.current.base);
    materials.trim.color.copy(current.current.trim);
  });

  useEffect(() => {
    return () => {
      materials.base.dispose();
      materials.trim.dispose();
      materials.logo.dispose();
    };
  }, [materials]);

  return materials;
}
