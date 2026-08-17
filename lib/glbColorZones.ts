/**
 * Конфиг зон перекраски 3D (генерируется `npm run glb:zones`).
 * Ручные правки — в data/glbColorZones.overrides.json (мержатся поверх).
 */

import zonesFile from "@/data/glbColorZones.json";
import overridesFile from "@/data/glbColorZones.overrides.json";
import { parseColorway } from "@/lib/colorCode";
import { colorMap, type ColorCodeKey } from "@/data/colors";

export type GlbZoneRole = "base" | "trim" | "top" | "bottom" | "accent";

export type GlbColorZoneDef = {
  /** Роль в расцветке: base/trim (XXYY) или top/bottom (kit) */
  role: GlbZoneRole;
  /** Ключ Legea XX из colorMap */
  colorKey: string;
  /** Средний цвет зоны в albedo GLB */
  bakedHex: string;
  /** Радиус совпадения в RGB (0–255), пиксели дальше не трогаем */
  matchRadius: number;
  /** Доля пикселей ткани в зоне (диагностика) */
  coverage?: number;
};

export type GlbProductZones = {
  /** Расцветка, запечённая в GLB */
  bakedColorway: string;
  /** Файл модели */
  glbFile?: string;
  /** Оценка совпадения кластеров с палитрой 0…1 */
  confidence?: number;
  zones: GlbColorZoneDef[];
  /**
   * Для kit: пиксели делить по яркости между top/bottom
   * (надёжнее, когда navy в текстуре «серый»).
   */
  splitMode?: "nearest" | "luminance";
  /** Вынутый albedo: /3D/albedo/{id}.webp — для перекраски без чтения GPU-текстуры */
  albedoUrl?: string;
  /** Предупреждения анализатора */
  warnings?: string[];
};

export type GlbColorZonesFile = {
  version: number;
  generatedAt: string;
  note?: string;
  products: Record<string, GlbProductZones>;
};

export type RuntimeColorZone = {
  bakedHex: string;
  targetHex: string;
  matchRadius: number;
  role?: GlbZoneRole;
};

export type RuntimeRecolorPlan = {
  zones: RuntimeColorZone[];
  splitMode: "nearest" | "luminance";
};

type OverridesFile = {
  products?: Record<string, Partial<GlbProductZones>>;
};

function isColorKey(v: string): v is ColorCodeKey {
  return Object.prototype.hasOwnProperty.call(colorMap, v);
}

function mergeCatalog(): Record<string, GlbProductZones> {
  const base = (zonesFile as GlbColorZonesFile).products ?? {};
  const overrides = (overridesFile as OverridesFile).products ?? {};
  const out: Record<string, GlbProductZones> = { ...base };
  for (const [id, patch] of Object.entries(overrides)) {
    const prev = out[id];
    if (!prev) {
      if (patch.bakedColorway && patch.zones) {
        out[id] = patch as GlbProductZones;
      }
      continue;
    }
    out[id] = {
      ...prev,
      ...patch,
      zones: patch.zones ?? prev.zones,
    };
  }
  return out;
}

const CATALOG = mergeCatalog();

export function getGlbProductZones(
  productId: string | null,
): GlbProductZones | null {
  if (!productId) return null;
  return CATALOG[productId] ?? null;
}

export function getGlbBakedColorwayFromZones(
  productId: string | null,
): string | null {
  return getGlbProductZones(productId)?.bakedColorway ?? null;
}

/**
 * Зоны baked→target для выбранной расцветки.
 * Роли: base/trim/top/bottom/accent → hex из parseColorway(target).
 */
export function resolveRuntimeZones(
  productId: string | null,
  targetColorway: string | null,
): RuntimeColorZone[] {
  return resolveRuntimeRecolor(productId, targetColorway).zones;
}

export function resolveRuntimeRecolor(
  productId: string | null,
  targetColorway: string | null,
): RuntimeRecolorPlan {
  const empty: RuntimeRecolorPlan = { zones: [], splitMode: "nearest" };
  const def = getGlbProductZones(productId);
  if (!def || !targetColorway || def.zones.length === 0) return empty;

  // Если текстура плохо совпадает с «запечённой» расцветкой (низкий conf),
  // всё равно перекрашиваем — иначе B302/0204 остаётся оранжевым вместо синего.
  const conf = def.confidence ?? 0;
  const trustBaked = conf >= 0.7;
  if (trustBaked && targetColorway === def.bakedColorway) return empty;

  let target: ReturnType<typeof parseColorway>;
  try {
    target = parseColorway(targetColorway);
  } catch {
    return empty;
  }

  const hexForRole = (role: GlbZoneRole, zoneKey: string): string | null => {
    if (target.kind === "kit") {
      if (role === "top" || role === "base") return target.top.base;
      if (role === "bottom") return target.bottom.base;
      if (role === "trim") return target.top.trim;
      if (role === "accent") return target.bottom.trim;
    } else {
      if (role === "base" || role === "top") return target.base;
      if (role === "trim" || role === "bottom" || role === "accent") {
        return target.trim;
      }
    }
    if (isColorKey(zoneKey)) return colorMap[zoneKey].hex;
    return null;
  };

  const zones: RuntimeColorZone[] = [];
  for (const zone of def.zones) {
    const targetHex = hexForRole(zone.role, zone.colorKey);
    if (!targetHex) continue;
    const same =
      targetHex.toLowerCase() === zone.bakedHex.toLowerCase();
    // Для kit top/bottom оставляем зону даже при same hex —
    // иначе luminance-split теряет одну сторону и верх/низ ломаются.
    const keepForSplit =
      zone.role === "top" || zone.role === "bottom";
    if (same && !keepForSplit) continue;
    zones.push({
      bakedHex: zone.bakedHex,
      targetHex,
      matchRadius: Math.max(zone.matchRadius, keepForSplit ? 70 : 50),
      role: zone.role,
    });
  }

  const hasKitPair =
    zones.some((z) => z.role === "top") &&
    zones.some((z) => z.role === "bottom");
  const splitMode =
    def.splitMode ?? (hasKitPair ? "luminance" : "nearest");

  return { zones, splitMode };
}
