"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { useColorableMaterials } from "@/components/canvas/useColorableMaterials";
import { BrandingMarks } from "@/components/canvas/BrandingMarks";
import type { BrandingDraft } from "@/types/spec";

type PlaceholderModelProps = {
  model: string | null;
  colorway: string | null;
  branding?: BrandingDraft | null;
};

/**
 * Параметрическая геометрия с материалами Base / Trim / Logo.
 * Масштаб торса ~0.7 unit (docs/models-spec.md).
 */
export function PlaceholderModel({
  model,
  colorway,
  branding = null,
}: PlaceholderModelProps) {
  const group = useRef<THREE.Group>(null);
  const materials = useColorableMaterials(colorway);
  const kind = resolveKind(model);

  const parts = useMemo(() => buildParts(kind), [kind]);

  useLayoutEffect(() => {
    if (!group.current) return;
    const el = group.current;
    el.scale.set(0.01, 0.01, 0.01);
    gsap.to(el.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.5,
      ease: "back.out(1.4)",
    });
  }, [kind]);

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      {parts.map((part) => (
        <mesh
          key={part.name + part.role}
          name={part.role}
          geometry={part.geometry}
          material={
            part.role === "Base"
              ? materials.base
              : part.role === "Trim"
                ? materials.trim
                : materials.logo
          }
          position={part.position}
          rotation={part.rotation}
          castShadow
          receiveShadow
        />
      ))}
      {branding ? <BrandingMarks branding={branding} /> : null}
    </group>
  );
}

type Kind =
  | "jersey"
  | "jersey_ls"
  | "shorts"
  | "socks"
  | "pants"
  | "jacket"
  | "ball"
  | "backpack";

type PartRole = "Base" | "Trim" | "Logo";

type Part = {
  name: string;
  role: PartRole;
  geometry: THREE.BufferGeometry;
  position: [number, number, number];
  rotation: [number, number, number];
};

function resolveKind(model: string | null): Kind {
  switch (model) {
    case "jersey_ls":
      return "jersey_ls";
    case "shorts":
      return "shorts";
    case "socks":
      return "socks";
    case "pants":
      return "pants";
    case "jacket":
    case "hoodie":
    case "gk_kit":
      return "jacket";
    case "ball":
      return "ball";
    case "backpack":
      return "backpack";
    case "volley_top":
    case "basket_top":
    case "jersey_ss":
    default:
      return "jersey";
  }
}

function buildParts(kind: Kind): Part[] {
  switch (kind) {
    case "shorts":
      return [
        part("shorts-base", "Base", new THREE.BoxGeometry(0.42, 0.28, 0.22), [0, 0.05, 0]),
        part("shorts-trim", "Trim", new THREE.BoxGeometry(0.44, 0.04, 0.24), [0, -0.08, 0]),
        part("logo", "Logo", new THREE.PlaneGeometry(0.08, 0.08), [0.12, 0.1, 0.12]),
      ];
    case "socks":
      return [
        part("sock-l", "Base", new THREE.CylinderGeometry(0.06, 0.07, 0.45, 16), [-0.1, 0, 0]),
        part("sock-r", "Base", new THREE.CylinderGeometry(0.06, 0.07, 0.45, 16), [0.1, 0, 0]),
        part("cuff-l", "Trim", new THREE.TorusGeometry(0.065, 0.015, 8, 16), [-0.1, 0.2, 0], [Math.PI / 2, 0, 0]),
        part("cuff-r", "Trim", new THREE.TorusGeometry(0.065, 0.015, 8, 16), [0.1, 0.2, 0], [Math.PI / 2, 0, 0]),
        part("logo", "Logo", new THREE.PlaneGeometry(0.05, 0.05), [0.1, 0.05, 0.07]),
      ];
    case "pants":
      return [
        part("pants", "Base", new THREE.BoxGeometry(0.4, 0.7, 0.2), [0, 0, 0]),
        part("stripe", "Trim", new THREE.BoxGeometry(0.05, 0.65, 0.22), [0.18, 0, 0]),
        part("logo", "Logo", new THREE.PlaneGeometry(0.07, 0.07), [0.12, 0.25, 0.11]),
      ];
    case "ball":
      return [
        part("ball", "Base", new THREE.SphereGeometry(0.28, 32, 32), [0, 0.1, 0]),
        part("panel", "Trim", new THREE.TorusGeometry(0.2, 0.02, 8, 32), [0, 0.1, 0], [Math.PI / 2, 0, 0]),
        part("logo", "Logo", new THREE.PlaneGeometry(0.1, 0.1), [0, 0.1, 0.29]),
      ];
    case "backpack":
      return [
        part("bag", "Base", new THREE.BoxGeometry(0.4, 0.5, 0.22), [0, 0.1, 0]),
        part("trim", "Trim", new THREE.BoxGeometry(0.42, 0.06, 0.24), [0, -0.1, 0]),
        part("logo", "Logo", new THREE.PlaneGeometry(0.12, 0.12), [0, 0.15, 0.12]),
      ];
    case "jacket":
      return jerseyParts(true, true);
    case "jersey_ls":
      return jerseyParts(true, false);
    case "jersey":
    default:
      return jerseyParts(false, false);
  }
}

function jerseyParts(longSleeve: boolean, thick: boolean): Part[] {
  const torsoH = 0.7;
  const sleeveLen = longSleeve ? 0.42 : 0.22;
  const depth = thick ? 0.24 : 0.2;

  return [
    part(
      "torso",
      "Base",
      new THREE.CylinderGeometry(0.22, 0.24, torsoH, 24, 1, false),
      [0, 0.05, 0],
    ),
    part(
      "collar",
      "Trim",
      new THREE.TorusGeometry(0.12, 0.03, 8, 24),
      [0, 0.38, 0],
      [Math.PI / 2, 0, 0],
    ),
    part(
      "sleeve-l",
      "Base",
      new THREE.CylinderGeometry(0.07, 0.08, sleeveLen, 12),
      [-0.28, 0.22, 0],
      [0, 0, Math.PI / 2.4],
    ),
    part(
      "sleeve-r",
      "Base",
      new THREE.CylinderGeometry(0.07, 0.08, sleeveLen, 12),
      [0.28, 0.22, 0],
      [0, 0, -Math.PI / 2.4],
    ),
    part(
      "cuff-l",
      "Trim",
      new THREE.TorusGeometry(0.075, 0.015, 8, 16),
      longSleeve ? [-0.42, 0.05, 0] : [-0.36, 0.15, 0],
      [0, 0, Math.PI / 2],
    ),
    part(
      "cuff-r",
      "Trim",
      new THREE.TorusGeometry(0.075, 0.015, 8, 16),
      longSleeve ? [0.42, 0.05, 0] : [0.36, 0.15, 0],
      [0, 0, Math.PI / 2],
    ),
    part(
      "hem",
      "Trim",
      new THREE.TorusGeometry(0.24, 0.02, 8, 24),
      [0, -0.28, 0],
      [Math.PI / 2, 0, 0],
    ),
    part(
      "logo",
      "Logo",
      new THREE.PlaneGeometry(0.1, 0.1),
      [0, 0.15, depth / 2 + 0.01],
    ),
  ];
}

function part(
  name: string,
  role: PartRole,
  geometry: THREE.BufferGeometry,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): Part {
  return { name, role, geometry, position, rotation };
}
