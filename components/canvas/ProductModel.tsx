"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { BrandingMarks } from "@/components/canvas/BrandingMarks";
import { CanvasLoader } from "@/components/canvas/CanvasLoader";
import { useColorableMaterials } from "@/components/canvas/useColorableMaterials";
import { isKnownModel, modelPath, resolveGlbUrlSync } from "@/lib/models";
import {
  attachGarmentRecolor,
  kitSplitYFromObject,
  newGarmentUniforms,
  updateGarmentRecolor,
  type GarmentRecolorUniforms,
} from "@/lib/garmentRecolor";
import {
  getGlbProductZones,
  resolveRuntimeRecolor,
} from "@/lib/glbColorZones";
import { parseColorway } from "@/lib/colorCode";
import { recolorAlbedoFromImage, recolorAlbedoZones } from "@/lib/recolorTexture";
import type { BrandingDraft } from "@/types/spec";

const albedoImageCache = new Map<string, Promise<HTMLImageElement>>();

function loadAlbedoImage(url: string): Promise<HTMLImageElement> {
  let pending = albedoImageCache.get(url);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        albedoImageCache.delete(url);
        reject(new Error(`Failed to load albedo ${url}`));
      };
      img.src = url;
    });
    albedoImageCache.set(url, pending);
  }
  return pending;
}

function isKitColorway(colorway: string | null): boolean {
  if (!colorway) return false;
  try {
    return parseColorway(colorway).kind === "kit";
  } catch {
    return colorway.includes("-");
  }
}

function sceneHasNamedColorParts(root: THREE.Object3D): boolean {
  let base = false;
  let trim = false;
  root.traverse((obj) => {
    const names: string[] = [obj.name];
    if (obj instanceof THREE.Mesh) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (mat && "name" in mat) names.push(String(mat.name ?? ""));
      }
    }
    for (const name of names) {
      const n = name.toLowerCase();
      if (n === "base" || n.startsWith("base")) base = true;
      if (n === "trim" || n.startsWith("trim")) trim = true;
    }
  });
  return base && trim;
}

function prepareStandardMaterial(
  src: THREE.MeshStandardMaterial,
): THREE.MeshStandardMaterial {
  const mat = src.clone();
  mat.userData.legeaOriginalMap = mat.map;
  mat.color.setRGB(1, 1, 1);
  mat.vertexColors = false;
  mat.metalness = 0;
  mat.metalnessMap = null;
  mat.roughnessMap = null;
  mat.emissive.setRGB(0, 0, 0);
  mat.side = THREE.DoubleSide;
  mat.envMapIntensity = 0.35;
  return mat;
}

function newUniforms(): GarmentRecolorUniforms {
  return newGarmentUniforms();
}

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
  colorway,
  branding = null,
}: ProductModelProps) {
  const glbUrl = useMemo(
    () => resolveGlbUrlSync(glbUrlProp, productId, model),
    [glbUrlProp, productId, model],
  );

  const url =
    glbUrl ?? (model && isKnownModel(model) ? modelPath(model) : null);

  if (!url) return null;

  return (
    <Suspense fallback={preserveMaterials ? null : <CanvasLoader />}>
      <GlbModel
        url={url}
        productId={productId}
        colorway={colorway}
        branding={branding}
        preserveMaterials={preserveMaterials}
      />
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
  productId,
  colorway,
  branding,
  preserveMaterials,
}: {
  url: string;
  productId: string | null;
  colorway: string | null;
  branding: BrandingDraft | null;
  preserveMaterials: boolean;
}) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const namedParts = useMemo(() => sceneHasNamedColorParts(clone), [clone]);

  if (preserveMaterials) {
    return <PreserveMaterialsClone clone={clone} branding={branding} />;
  }

  if (namedParts) {
    return (
      <NamedMeshClone clone={clone} colorway={colorway} branding={branding} />
    );
  }

  // Только костюмы AABB-CCDD (TXM1144 и т.п.). Остальные артикулы — зоны albedo.
  if (isKitColorway(colorway)) {
    return (
      <ShaderRecolorClone
        clone={clone}
        productId={productId}
        colorway={colorway}
        branding={branding}
      />
    );
  }

  return (
    <ZoneRecolorClone
      clone={clone}
      productId={productId}
      colorway={colorway}
      branding={branding}
    />
  );
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

function ShadowOnly({ clone }: { clone: THREE.Object3D }) {
  useEffect(() => {
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });
  }, [clone]);
  return <primitive object={clone} />;
}

function NamedMeshClone({
  clone,
  colorway,
  branding,
}: {
  clone: THREE.Object3D;
  colorway: string | null;
  branding: BrandingDraft | null;
}) {
  const materials = useColorableMaterials(colorway);

  useEffect(() => {
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const n = `${obj.name} ${
        Array.isArray(obj.material) ? "" : (obj.material?.name ?? "")
      }`.toLowerCase();
      if (n.includes("logo")) obj.material = materials.logo;
      else if (n.includes("trim")) obj.material = materials.trim;
      else if (n.includes("base")) obj.material = materials.base;
    });
  }, [clone, materials]);

  return <ModelFrame clone={clone} branding={branding} />;
}

function ShaderRecolorClone({
  clone,
  productId,
  colorway,
  branding,
}: {
  clone: THREE.Object3D;
  productId: string | null;
  colorway: string | null;
  branding: BrandingDraft | null;
}) {
  const splitY = useMemo(() => kitSplitYFromObject(clone), [clone]);

  useEffect(() => {
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;

      const src = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!(src instanceof THREE.MeshStandardMaterial)) return;

      let mat = obj.material as THREE.MeshStandardMaterial;
      if (!mat.userData.legeaGarment) {
        mat = prepareStandardMaterial(src);
        attachGarmentRecolor(mat, newUniforms());
        obj.material = mat;
      }

      const uniforms = (obj.material as THREE.MeshStandardMaterial).userData
        .legeaGarment as GarmentRecolorUniforms | undefined;
      if (uniforms) {
        updateGarmentRecolor(uniforms, colorway, productId, splitY);
      }
    });
  }, [clone, colorway, productId, splitY]);

  return <ModelFrame clone={clone} branding={branding} />;
}

function ZoneRecolorClone({
  clone,
  productId,
  colorway,
  branding,
}: {
  clone: THREE.Object3D;
  productId: string | null;
  colorway: string | null;
  branding: BrandingDraft | null;
}) {
  useEffect(() => {
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const src = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!(src instanceof THREE.MeshStandardMaterial)) return;
      if (src.userData.legeaOriginalMap !== undefined) return;
      obj.material = prepareStandardMaterial(src);
    });
  }, [clone]);

  useEffect(() => {
    let cancelled = false;
    let generated: THREE.CanvasTexture | null = null;

    const restoreOriginal = () => {
      clone.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;
        const original = mat.userData.legeaOriginalMap as
          | THREE.Texture
          | null
          | undefined;
        if (original !== undefined) mat.map = original;
        mat.color.setRGB(1, 1, 1);
        mat.needsUpdate = true;
      });
    };

    const applyMap = (map: THREE.CanvasTexture) => {
      clone.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;
        const original = mat.userData.legeaOriginalMap as
          | THREE.Texture
          | null
          | undefined;
        if (original) {
          map.flipY = original.flipY;
          map.wrapS = original.wrapS;
          map.wrapT = original.wrapT;
        } else {
          map.flipY = false;
        }
        map.colorSpace = THREE.SRGBColorSpace;
        map.needsUpdate = true;
        mat.map = map;
        mat.color.setRGB(1, 1, 1);
        mat.needsUpdate = true;
      });
    };

    async function run() {
      const plan = resolveRuntimeRecolor(productId, colorway);
      if (plan.zones.length === 0) {
        restoreOriginal();
        return;
      }

      const albedoUrl = getGlbProductZones(productId)?.albedoUrl;
      let maps: { map: THREE.CanvasTexture } | null = null;

      if (albedoUrl) {
        try {
          const image = await loadAlbedoImage(albedoUrl);
          if (cancelled) return;
          maps = recolorAlbedoFromImage(image, plan.zones, plan.splitMode);
        } catch {
          maps = null;
        }
      }

      if (!maps) {
        let source: THREE.Texture | null = null;
        clone.traverse((obj) => {
          if (source || !(obj instanceof THREE.Mesh)) return;
          const mat = Array.isArray(obj.material)
            ? obj.material[0]
            : obj.material;
          if (!(mat instanceof THREE.MeshStandardMaterial)) return;
          const original = mat.userData.legeaOriginalMap as
            | THREE.Texture
            | null
            | undefined;
          source = original ?? mat.map;
        });
        if (source) {
          maps = recolorAlbedoZones(source, plan.zones, plan.splitMode);
        }
      }

      if (cancelled) return;
      generated?.dispose();
      generated = null;

      if (!maps) {
        restoreOriginal();
        return;
      }

      generated = maps.map;
      applyMap(maps.map);
    }

    void run();

    return () => {
      cancelled = true;
      generated?.dispose();
    };
  }, [clone, productId, colorway]);

  return <ModelFrame clone={clone} branding={branding} />;
}
