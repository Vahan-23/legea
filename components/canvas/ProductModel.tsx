"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { BrandingMarks } from "@/components/canvas/BrandingMarks";
import { CanvasLoader } from "@/components/canvas/CanvasLoader";
import { isKnownModel, modelPath, ORIGINAL_GLB_ONLY, resolveGlbUrlSync } from "@/lib/models";
import type { BrandingDraft } from "@/types/spec";

type ProductModelProps = {
  productId?: string | null;
  glbUrl?: string | null;
  preserveMaterials?: boolean;
  model: string | null;
  colorway: string | null;
  branding?: BrandingDraft | null;
};

export function ProductModel({
  productId = null,
  glbUrl: glbUrlProp = null,
  preserveMaterials = false,
  model,
  branding = null,
}: ProductModelProps) {
  const glbUrl = useMemo(
    () => resolveGlbUrlSync(glbUrlProp, productId, model),
    [glbUrlProp, productId, model],
  );

  const url =
    glbUrl ?? (model && isKnownModel(model) ? modelPath(model) : null);

  if (!url) return null;

  const useOriginal = preserveMaterials || ORIGINAL_GLB_ONLY;

  return (
    <Suspense fallback={useOriginal ? null : <CanvasLoader />}>
      <GlbModel url={url} branding={branding} preserveMaterials={useOriginal} />
    </Suspense>
  );
}

function ModelFrame({
  clone,
  branding,
}: {
  clone: THREE.Object3D;
  branding: BrandingDraft | null;
}) {
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

function GlbModel({
  url,
  branding,
  preserveMaterials,
}: {
  url: string;
  branding: BrandingDraft | null;
  preserveMaterials: boolean;
}) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);

  if (preserveMaterials) {
    return <PreserveMaterialsClone clone={clone} branding={branding} />;
  }

  // Legacy recolor path — отключён флагом ORIGINAL_GLB_ONLY
  return <PreserveMaterialsClone clone={clone} branding={branding} />;
}

function PreserveMaterialsClone({
  clone,
  branding,
}: {
  clone: THREE.Object3D;
  branding: BrandingDraft | null;
}) {
  useEffect(() => {
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  }, [clone]);
  return <ModelFrame clone={clone} branding={branding} />;
}
