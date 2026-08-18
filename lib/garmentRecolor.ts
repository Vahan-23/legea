import * as THREE from "three";
import { parseColorway } from "@/lib/colorCode";
import { getGlbProductZones, type GlbProductZones } from "@/lib/glbColorZones";

/** LUXIOM: trim = основной цвет корпуса (2324). Остальные — base + accent на плечах. */
const IRIDESCENT_TRIM_IS_BODY = new Set(["2324"]);

export type GarmentRecolorUniforms = {
  uTop: { value: THREE.Color };
  uBottom: { value: THREE.Color };
  uAccent: { value: THREE.Color };
  /** Luma-порог (mode 2) или Y-линия талии (mode 3) */
  uMid: { value: number };
  /** Mode 2: invert; mode 3 accent-band: верхняя граница вставки на плечах */
  uInvert: { value: number };
  /** Y — низ зоны accent (плечи), mode 3 accent-band */
  uShoulder: { value: number };
  /** 0 = 2324-style; 1 = 1075-style (accent по высоте) */
  uAccentMode: { value: number };
  /** 2 = kit luma; 3 = kit worldY */
  uMode: { value: number };
};

function lumaHex(hex: string): number {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

type KitGarmentColors = {
  top: THREE.Color;
  bottom: THREE.Color;
  accent: THREE.Color;
  accentByHeight: boolean;
  kit: boolean;
  solid: boolean;
};

function kitGarmentColors(colorway: string | null): KitGarmentColors {
  const fallback = {
    top: new THREE.Color("#1E5FD0"),
    bottom: new THREE.Color("#14204A"),
    accent: new THREE.Color("#14204A"),
    accentByHeight: false,
    kit: false,
    solid: false,
  };
  if (!colorway) return fallback;
  try {
    const parsed = parseColorway(colorway);
    if (parsed.kind !== "kit") {
      return {
        ...fallback,
        top: new THREE.Color(parsed.base),
        bottom: new THREE.Color(parsed.trim),
      };
    }

    const { top, bottom } = parsed;
    if (top.isIridescent && !top.isSolid) {
      if (IRIDESCENT_TRIM_IS_BODY.has(top.code)) {
        return {
          top: new THREE.Color(top.trim),
          bottom: new THREE.Color(bottom.base),
          accent: new THREE.Color(top.base),
          accentByHeight: false,
          kit: true,
          solid:
            top.isSolid &&
            bottom.isSolid &&
            top.base === bottom.base,
        };
      }
      return {
        top: new THREE.Color(top.base),
        bottom: new THREE.Color(bottom.base),
        accent: new THREE.Color(top.trim),
        accentByHeight: true,
        kit: true,
        solid:
          top.isSolid &&
          bottom.isSolid &&
          top.base === bottom.base,
      };
    }

    return {
      top: new THREE.Color(top.base),
      bottom: new THREE.Color(bottom.base),
      accent: new THREE.Color(top.trim),
      accentByHeight: false,
      kit: true,
      solid:
        top.isSolid &&
        bottom.isSolid &&
        top.base === bottom.base,
    };
  } catch {
    return fallback;
  }
}

/** @deprecated используйте kitGarmentColors */
export function colorsFromColorway(colorway: string | null): {
  top: THREE.Color;
  bottom: THREE.Color;
  kit: boolean;
  solid: boolean;
} {
  const c = kitGarmentColors(colorway);
  return { top: c.top, bottom: c.bottom, kit: c.kit, solid: c.solid };
}

function shouldUseWorldYSplit(def: GlbProductZones | null): boolean {
  if (!def) return false;
  if (def.splitMode === "worldY") return true;
  if (def.splitMode === "luminance" && (def.confidence ?? 0) >= 0.7) {
    return false;
  }
  const top = def.zones.find((z) => z.role === "top");
  const bot = def.zones.find((z) => z.role === "bottom");
  if (!top || !bot) return false;
  const topCov = top.coverage ?? 0;
  const botCov = bot.coverage ?? 0;
  if (topCov < 0.14 && botCov > 0.65) return true;
  const conf = def.confidence ?? 0;
  return conf < 0.35 && topCov < 0.14 && botCov > 0.65;
}

export function attachGarmentRecolor(
  mat: THREE.MeshStandardMaterial,
  uniforms: GarmentRecolorUniforms,
): void {
  mat.userData.legeaGarment = uniforms;
  mat.customProgramCacheKey = () => "legea-garment-v9";
  mat.onBeforeCompile = (shader) => {
    const u = mat.userData.legeaGarment as GarmentRecolorUniforms;
    shader.uniforms.uTop = u.uTop;
    shader.uniforms.uBottom = u.uBottom;
    shader.uniforms.uAccent = u.uAccent;
    shader.uniforms.uMid = u.uMid;
    shader.uniforms.uInvert = u.uInvert;
    shader.uniforms.uShoulder = u.uShoulder;
    shader.uniforms.uAccentMode = u.uAccentMode;
    shader.uniforms.uMode = u.uMode;

    const inject = `{
  vec3 src = diffuseColor.rgb;
  float luma = dot(src, vec3(0.2126, 0.7152, 0.0722));
  vec3 garment = uTop;
  if (uMode > 2.5) {
    bool isPants = vLocalY <= uMid;
    if (isPants) {
      garment = uBottom;
    } else if (uAccentMode > 0.5) {
      if (vLocalY >= uShoulder && vLocalY <= uInvert) {
        garment = uAccent;
      } else {
        garment = uTop;
      }
    } else if (luma < uInvert) {
      garment = uBottom;
    } else {
      garment = uTop;
    }
  } else if (uMode > 1.5) {
    bool dark = luma < uMid;
    bool darkIsTop = uInvert < 0.5;
    garment = (dark == darkIsTop) ? uTop : uBottom;
  }
  if (luma < 0.9) {
    diffuseColor.rgb = garment;
  }
}`;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vLocalY;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vLocalY = transformed.y;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uAccent;
uniform float uMid;
uniform float uInvert;
uniform float uShoulder;
uniform float uAccentMode;
uniform float uMode;
varying float vLocalY;`,
      );

    if (shader.fragmentShader.includes("#include <map_fragment>")) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
${inject}`,
      );
    } else {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
${inject}`,
      );
    }
  };
  mat.needsUpdate = true;
}

export function kitSplitYFromObject(root: THREE.Object3D): {
  waist: number;
  shoulder: number;
  accentTop: number;
} {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return { waist: 0.05, shoulder: 0.5, accentTop: 0.65 };
  const h = box.max.y - box.min.y;
  return {
    waist: box.min.y + h * 0.32,
    /** Низ полосы accent (верх груди / плечо) */
    shoulder: box.min.y + h * 0.84,
    /** Верх полосы accent (ворот) */
    accentTop: box.min.y + h * 0.96,
  };
}

/** @deprecated → kitSplitYFromObject */
export function kitWaistYFromObject(root: THREE.Object3D): number {
  return kitSplitYFromObject(root).waist;
}

export function updateGarmentRecolor(
  uniforms: GarmentRecolorUniforms,
  colorway: string | null,
  productId: string | null = null,
  splitY: { waist: number; shoulder: number; accentTop: number } | null = null,
): void {
  const colors = kitGarmentColors(colorway);
  uniforms.uTop.value.copy(colors.top);
  uniforms.uBottom.value.copy(colors.bottom);
  uniforms.uAccent.value.copy(colors.accent);
  uniforms.uAccentMode.value = colors.accentByHeight ? 1 : 0;
  uniforms.uMid.value = 0.18;
  uniforms.uInvert.value = 0;
  uniforms.uShoulder.value = splitY?.shoulder ?? 0.5;
  uniforms.uMode.value = 2;

  if (!colors.kit) return;

  const def = getGlbProductZones(productId);
  const topZ = def?.zones.find((z) => z.role === "top");
  const botZ = def?.zones.find((z) => z.role === "bottom");
  const trimZ = def?.zones.find((z) => z.role === "trim");

  if (shouldUseWorldYSplit(def)) {
    uniforms.uMode.value = 3;
    uniforms.uMid.value = splitY?.waist ?? 0.05;
    if (colors.accentByHeight) {
      uniforms.uShoulder.value = splitY?.shoulder ?? 0.5;
      uniforms.uInvert.value = splitY?.accentTop ?? 0.65;
    } else if (trimZ && botZ) {
      const trimL = lumaHex(trimZ.bakedHex);
      const botL = lumaHex(botZ.bakedHex);
      uniforms.uInvert.value =
        trimL + Math.max(0.015, (botL - trimL) * 0.45);
    } else if (trimZ) {
      uniforms.uInvert.value = lumaHex(trimZ.bakedHex) + 0.015;
    } else {
      uniforms.uInvert.value = 0.06;
    }
    return;
  }

  if (topZ && botZ) {
    const topL = lumaHex(topZ.bakedHex);
    const botL = lumaHex(botZ.bakedHex);
    uniforms.uInvert.value = topL <= botL ? 0 : 1;
    const lo = Math.min(topL, botL);
    const hi = Math.max(topL, botL);
    uniforms.uMid.value = lo + (hi - lo) * 0.45;
  } else {
    uniforms.uMid.value = 0.35;
    uniforms.uInvert.value = 1;
  }
}

export function newGarmentUniforms(): GarmentRecolorUniforms {
  return {
    uTop: { value: new THREE.Color("#ffffff") },
    uBottom: { value: new THREE.Color("#ffffff") },
    uAccent: { value: new THREE.Color("#ffffff") },
    uMid: { value: 0.38 },
    uInvert: { value: 0 },
    uShoulder: { value: 0.5 },
    uAccentMode: { value: 0 },
    uMode: { value: 1 },
  };
}
