"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { BrandingMarks } from "@/components/canvas/BrandingMarks";
import { PlaceholderModel } from "@/components/canvas/PlaceholderModel";
import { useColorableMaterials } from "@/components/canvas/useColorableMaterials";
import { isKnownModel, modelPath } from "@/lib/models";
import type { BrandingDraft } from "@/types/spec";

type ProductModelProps = {
  model: string | null;
  colorway: string | null;
  branding?: BrandingDraft | null;
};

/**
 * Пробует GLB из /public/models/, иначе PlaceholderModel.
 */
export function ProductModel({
  model,
  colorway,
  branding = null,
}: ProductModelProps) {
  const [useGlb, setUseGlb] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!model || !isKnownModel(model)) {
        if (!cancelled) {
          setUseGlb(false);
          setChecked(true);
        }
        return;
      }

      try {
        const res = await fetch(modelPath(model), { method: "HEAD" });
        if (!cancelled) {
          setUseGlb(res.ok);
          setChecked(true);
        }
      } catch {
        if (!cancelled) {
          setUseGlb(false);
          setChecked(true);
        }
      }
    }

    setChecked(false);
    void check();
    return () => {
      cancelled = true;
    };
  }, [model]);

  if (!checked) return null;

  if (useGlb && model) {
    return (
      <Suspense
        fallback={
          <PlaceholderModel
            model={model}
            colorway={colorway}
            branding={branding}
          />
        }
      >
        <GlbModel
          url={modelPath(model)}
          colorway={colorway}
          branding={branding}
        />
      </Suspense>
    );
  }

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
}: {
  url: string;
  colorway: string | null;
  branding: BrandingDraft | null;
}) {
  const { scene } = useGLTF(url);
  const materials = useColorableMaterials(colorway);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = obj.name.toLowerCase();
      if (name.includes("base")) {
        obj.material = materials.base;
      } else if (name.includes("trim")) {
        obj.material = materials.trim;
      } else if (name.includes("logo")) {
        obj.material = materials.logo;
      }
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  }, [clone, materials]);

  return (
    <group>
      <primitive object={clone} />
      {branding ? (
        <group position={[0, -0.15, 0]}>
          <BrandingMarks branding={branding} />
        </group>
      ) : null}
    </group>
  );
}
