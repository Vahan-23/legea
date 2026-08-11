"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { BrandingMarks } from "@/components/canvas/BrandingMarks";
import { PlaceholderModel } from "@/components/canvas/PlaceholderModel";
import { useColorableMaterials } from "@/components/canvas/useColorableMaterials";
import {
  isKnownModel,
  modelPath,
  productGlbPath,
} from "@/lib/models";
import { splitAlbedoForRecolor } from "@/lib/recolorTexture";
import type { BrandingDraft } from "@/types/spec";

type ProductModelProps = {
  productId?: string | null;
  glbUrl?: string | null;
  preserveMaterials?: boolean;
  model: string | null;
  colorway: string | null;
  branding?: BrandingDraft | null;
};

/**
 * 1) glbUrl  2) /3D/{id}_3D.glb  3) /models/{model}.glb  4) PlaceholderModel
 */
export function ProductModel({
  productId = null,
  glbUrl: glbUrlProp = null,
  preserveMaterials = false,
  model,
  colorway,
  branding = null,
}: ProductModelProps) {
  const [glbUrl, setGlbUrl] = useState<string | null>(glbUrlProp);
  const [checked, setChecked] = useState(Boolean(glbUrlProp));

  useEffect(() => {
    let cancelled = false;

    async function headOk(url: string): Promise<boolean> {
      try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok;
      } catch {
        return false;
      }
    }

    async function check() {
      if (glbUrlProp) {
        if (await headOk(glbUrlProp)) {
          if (!cancelled) {
            setGlbUrl(glbUrlProp);
            setChecked(true);
          }
          return;
        }
      }

      if (productId) {
        const productUrl = productGlbPath(productId);
        if (await headOk(productUrl)) {
          if (!cancelled) {
            setGlbUrl(productUrl);
            setChecked(true);
          }
          return;
        }
      }

      if (model && isKnownModel(model)) {
        const typeUrl = modelPath(model);
        if (await headOk(typeUrl)) {
          if (!cancelled) {
            setGlbUrl(typeUrl);
            setChecked(true);
          }
          return;
        }
      }

      if (!cancelled) {
        setGlbUrl(null);
        setChecked(true);
      }
    }

    setChecked(false);
    setGlbUrl(null);
    void check();
    return () => {
      cancelled = true;
    };
  }, [glbUrlProp, productId, model]);

  if (!checked) return null;

  if (glbUrl) {
    return (
      <Suspense
        fallback={
          preserveMaterials ? null : (
            <PlaceholderModel
              model={model}
              colorway={colorway}
              branding={branding}
            />
          )
        }
      >
        <GlbModel
          url={glbUrl}
          colorway={colorway}
          branding={branding}
          preserveMaterials={preserveMaterials}
        />
      </Suspense>
    );
  }

  if (preserveMaterials) return null;

  return (
    <PlaceholderModel
      model={model}
      colorway={colorway}
      branding={branding}
    />
  );
}

function GlbModel({
  url,
  colorway,
  branding,
  preserveMaterials,
}: {
  url: string;
  colorway: string | null;
  branding: BrandingDraft | null;
  preserveMaterials: boolean;
}) {
  const { scene } = useGLTF(url);
  const materials = useColorableMaterials(colorway);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const splitCache = useMemo(() => new Map<string, ReturnType<typeof splitAlbedoForRecolor>>(), []);

  useEffect(() => {
    if (preserveMaterials) {
      clone.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.castShadow = true;
        obj.receiveShadow = true;
      });
      return;
    }

    let zoned = false;
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;

      const name = obj.name.toLowerCase();
      const matName =
        (Array.isArray(obj.material) ? obj.material[0]?.name : obj.material?.name)
          ?.toLowerCase() ?? "";

      if (name.includes("base") || matName.includes("base")) {
        obj.material = materials.base;
        zoned = true;
      } else if (name.includes("trim") || matName.includes("trim")) {
        obj.material = materials.trim;
        zoned = true;
      } else if (name.includes("logo") || matName.includes("logo")) {
        obj.material = materials.logo;
        zoned = true;
      }
    });

    if (!zoned) {
      materials.base.side = THREE.DoubleSide;
      clone.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const original = Array.isArray(obj.material)
          ? obj.material[0]
          : obj.material;

        if (!(original instanceof THREE.MeshStandardMaterial)) {
          obj.material = materials.base;
          return;
        }

        // Keep shading maps from GLB
        if (original.normalMap) {
          materials.base.normalMap = original.normalMap;
          materials.base.normalScale =
            original.normalScale?.clone() ?? new THREE.Vector2(1, 1);
        }
        if (original.roughnessMap) {
          materials.base.roughnessMap = original.roughnessMap;
        }
        if (original.metalnessMap) {
          materials.base.metalnessMap = original.metalnessMap;
        }
        materials.base.roughness = Math.min(original.roughness || 0.85, 0.62);
        materials.base.metalness = Math.min(original.metalness || 0, 0.05);
        materials.base.envMapIntensity = 1.05;

        // Albedo → grayscale fabric + white logo mask
        if (original.map) {
          const map = original.map;
          const applySplit = () => {
            const key = `${map.uuid}:v2`;
            let split = splitCache.get(key);
            if (split === undefined) {
              split = splitAlbedoForRecolor(map);
              splitCache.set(key, split);
            }
            if (split) {
              materials.base.map = split.fabricMap;
              materials.base.emissiveMap = split.logoMap;
              materials.base.emissive = new THREE.Color("#ffffff");
              materials.base.emissiveIntensity = 1;
            } else {
              materials.base.map = null;
              materials.base.emissiveMap = null;
              materials.base.emissiveIntensity = 0;
            }
            materials.base.needsUpdate = true;
          };

          const img = map.image as
            | (CanvasImageSource & {
                width?: number;
                complete?: boolean;
                addEventListener?: (
                  type: string,
                  listener: () => void,
                  options?: { once?: boolean },
                ) => void;
              })
            | undefined;
          if (img && (img.width || img.complete)) {
            applySplit();
          } else {
            img?.addEventListener?.("load", applySplit, { once: true });
            requestAnimationFrame(applySplit);
          }
        } else {
          materials.base.map = null;
          materials.base.emissiveMap = null;
          materials.base.emissiveIntensity = 0;
        }

        materials.base.needsUpdate = true;
        obj.material = materials.base;
      });
    }
  }, [clone, materials, preserveMaterials, splitCache]);

  return (
    <group>
      <primitive object={clone} />
      {branding && !preserveMaterials ? (
        <group position={[0, -0.15, 0]}>
          <BrandingMarks branding={branding} />
        </group>
      ) : null}
    </group>
  );
}
