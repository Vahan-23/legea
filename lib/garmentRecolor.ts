import * as THREE from "three";
import { parseColorway } from "@/lib/colorCode";
import { getGlbProductZones } from "@/lib/glbColorZones";

export type GarmentRecolorUniforms = {
  uTop: { value: THREE.Color };
  uBottom: { value: THREE.Color };
  uMid: { value: number };
  uInvert: { value: number };
  uMode: { value: number };
};

/** Яркость как в шейдере: hex sRGB → linear (после map_fragment). */
function lumaHex(hex: string): number {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

export function colorsFromColorway(colorway: string | null): {
  top: THREE.Color;
  bottom: THREE.Color;
  kit: boolean;
  solid: boolean;
} {
  const fallback = {
    top: new THREE.Color("#1E5FD0"),
    bottom: new THREE.Color("#14204A"),
    kit: false,
    solid: false,
  };
  if (!colorway) return fallback;
  try {
    const parsed = parseColorway(colorway);
    if (parsed.kind === "kit") {
      return {
        top: new THREE.Color(parsed.top.base),
        bottom: new THREE.Color(parsed.bottom.base),
        kit: true,
        solid:
          parsed.top.isSolid &&
          parsed.bottom.isSolid &&
          parsed.top.base === parsed.bottom.base,
      };
    }
    return {
      top: new THREE.Color(parsed.base),
      bottom: new THREE.Color(parsed.trim),
      kit: false,
      solid: parsed.isSolid,
    };
  } catch {
    return fallback;
  }
}

/**
 * uMode: 1 = вся модель base,
 *        2 = kit: тёмные UV = верх, светлые = низ (альбедо как маска),
 *        3 = single: тёмные = base, светлые = trim.
 */
export function attachGarmentRecolor(
  mat: THREE.MeshStandardMaterial,
  uniforms: GarmentRecolorUniforms,
): void {
  mat.userData.legeaGarment = uniforms;
  mat.customProgramCacheKey = () => "legea-garment-v6";
  mat.onBeforeCompile = (shader) => {
    const u = mat.userData.legeaGarment as GarmentRecolorUniforms;
    shader.uniforms.uTop = u.uTop;
    shader.uniforms.uBottom = u.uBottom;
    shader.uniforms.uMid = u.uMid;
    shader.uniforms.uInvert = u.uInvert;
    shader.uniforms.uMode = u.uMode;

    const inject = `{
  vec3 src = diffuseColor.rgb;
  float luma = dot(src, vec3(0.2126, 0.7152, 0.0722));
  vec3 garment = uTop;
  if (uMode > 1.5) {
    bool dark = luma < uMid;
    bool darkIsTop = uInvert < 0.5;
    garment = (dark == darkIsTop) ? uTop : uBottom;
  }
  // Белая фурнитура / принт — не перекрашивать
  if (luma < 0.9) {
    diffuseColor.rgb = garment;
  }
}`;

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uTop;
uniform vec3 uBottom;
uniform float uMid;
uniform float uInvert;
uniform float uMode;`,
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

export function updateGarmentRecolor(
  uniforms: GarmentRecolorUniforms,
  colorway: string | null,
  productId: string | null = null,
): void {
  const colors = colorsFromColorway(colorway);
  uniforms.uTop.value.copy(colors.top);
  uniforms.uBottom.value.copy(colors.bottom);
  uniforms.uMid.value = 0.18;
  uniforms.uInvert.value = 0;
  uniforms.uMode.value = 2;

  if (!colors.kit) return;

  const def = getGlbProductZones(productId);
  const topZ = def?.zones.find((z) => z.role === "top");
  const botZ = def?.zones.find((z) => z.role === "bottom");
  if (topZ && botZ) {
    const topL = lumaHex(topZ.bakedHex);
    const botL = lumaHex(botZ.bakedHex);
    uniforms.uInvert.value = topL <= botL ? 0 : 1;
    const lo = Math.min(topL, botL);
    const hi = Math.max(topL, botL);
    uniforms.uMid.value = lo + (hi - lo) * 0.45;
  }
}
