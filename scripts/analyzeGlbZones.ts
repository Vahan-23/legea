/**
 * Анализ albedo в public/3D/*.glb → data/glbColorZones.json
 *
 * Usage:
 *   npm run glb:zones              # все модели
 *   npm run glb:zones -- B303 M1176
 *   npm run glb:zones -- --force   # перезаписать даже с overrides
 *
 * Алгоритм:
 * 1. Достаёт albedo из GLB
 * 2. Кластеризует цвета ткани (без логотипов)
 * 3. Сопоставляет кластеры с ключами Legea из colorways товара
 * 4. Выбирает лучшую «запечённую» расцветку и роли зон
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { colorMap, type ColorCodeKey } from "../data/colors";
import productsFile from "../data/products.json";
import type {
  GlbColorZoneDef,
  GlbColorZonesFile,
  GlbProductZones,
  GlbZoneRole,
} from "../lib/glbColorZones";
import { parseColorway } from "../lib/colorCode";

type Rgb = { r: number; g: number; b: number };

type ProductRow = {
  id: string;
  colorways: string[];
  colorwayFormat?: string;
};

const ROOT = process.cwd();
const GLB_DIR = path.join(ROOT, "public", "3D");
const OUT_PATH = path.join(ROOT, "data", "glbColorZones.json");
const OVERRIDES_PATH = path.join(ROOT, "data", "glbColorZones.overrides.json");

const SAMPLE_SIZE = 256;
const MAX_CLUSTERS = 5;
const MIN_COVERAGE = 0.012;
const KEEP_DARK_LUMA = 32;
const LOGO_SAT_MAX = 0.2;
const LOGO_LUMA_MIN = 175;

function isColorKey(v: string): v is ColorCodeKey {
  return Object.prototype.hasOwnProperty.call(colorMap, v);
}

function parseHex(hex: string): Rgb {
  const n = hex.replace("#", "");
  return {
    r: Number.parseInt(n.slice(0, 2), 16),
    g: Number.parseInt(n.slice(2, 4), 16),
    b: Number.parseInt(n.slice(4, 6), 16),
  };
}

function toHex(c: Rgb): string {
  const ch = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(c.r)}${ch(c.g)}${ch(c.b)}`.toUpperCase();
}

function dist(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function productIdFromGlbName(file: string): string | null {
  const base = file.replace(/\.glb$/i, "");
  if (/^logo/i.test(base) || /_3D1$/i.test(base)) return null;
  const named = /^([A-Za-z0-9]+)_3D$/i.exec(base);
  if (named?.[1]) return named[1];
  const optimized = /^([A-Za-z0-9]+)-optimized$/i.exec(base);
  if (optimized?.[1]) return optimized[1];
  if (/^[A-Za-z0-9]+$/.test(base)) return base;
  return null;
}

function glbFilePriority(file: string): number {
  if (/_3D\.glb$/i.test(file)) return 3;
  if (/-optimized\.glb$/i.test(file)) return 2;
  return 1;
}

function extractKeysFromColorway(code: string): ColorCodeKey[] {
  try {
    const parsed = parseColorway(code);
    if (parsed.kind === "kit") {
      return [parsed.top.baseKey, parsed.top.trimKey, parsed.bottom.baseKey, parsed.bottom.trimKey];
    }
    return [parsed.baseKey, parsed.trimKey];
  } catch {
    return [];
  }
}

function uniqueKeys(codes: string[]): ColorCodeKey[] {
  const set = new Set<ColorCodeKey>();
  for (const code of codes) {
    for (const k of extractKeysFromColorway(code)) set.add(k);
  }
  return Array.from(set);
}

type GlbJson = {
  images?: Array<{
    name?: string;
    bufferView?: number;
    mimeType?: string;
    uri?: string;
  }>;
  textures?: Array<{
    source?: number;
    extensions?: { EXT_texture_webp?: { source?: number } };
  }>;
  materials?: Array<{
    pbrMetallicRoughness?: { baseColorTexture?: { index?: number } };
  }>;
  bufferViews?: Array<{
    buffer: number;
    byteOffset?: number;
    byteLength: number;
  }>;
};

function parseGlbJsonBin(buf: Buffer): { json: GlbJson; bin: Buffer } | null {
  if (buf.toString("utf8", 0, 4) !== "glTF") return null;
  const jsonLen = buf.readUInt32LE(12);
  const jsonStart = 20;
  const json = JSON.parse(
    buf.slice(jsonStart, jsonStart + jsonLen).toString("utf8"),
  ) as GlbJson;

  let binOffset = jsonStart + jsonLen;
  while (binOffset % 4 !== 0) binOffset += 1;
  if (binOffset + 8 > buf.length) return null;
  const binChunkLen = buf.readUInt32LE(binOffset);
  const binStart = binOffset + 8;
  return { json, bin: buf.slice(binStart, binStart + binChunkLen) };
}

function imageBytesFromIndex(
  json: GlbJson,
  bin: Buffer,
  imageIndex: number,
): Buffer | null {
  const img = json.images?.[imageIndex];
  const views = json.bufferViews ?? [];
  if (!img) return null;
  if (img.uri?.startsWith("data:")) {
    const comma = img.uri.indexOf(",");
    if (comma < 0) return null;
    return Buffer.from(img.uri.slice(comma + 1), "base64");
  }
  if (img.bufferView == null) return null;
  const view = views[img.bufferView];
  if (!view) return null;
  const start = view.byteOffset ?? 0;
  return bin.slice(start, start + view.byteLength);
}

function textureImageIndex(
  json: GlbJson,
  textureIndex: number | undefined,
): number | null {
  if (textureIndex == null) return null;
  const tex = json.textures?.[textureIndex];
  if (!tex) return null;
  const webp = tex.extensions?.EXT_texture_webp?.source;
  if (typeof webp === "number") return webp;
  if (typeof tex.source === "number") return tex.source;
  return null;
}

/**
 * Albedo: baseColorTexture, иначе image name base_color, иначе самая крупная.
 * (у B302 largest = orange metallic_roughness, albedo реально тёмно-зелёный)
 */
function extractAlbedoImageBytes(buf: Buffer): Buffer | null {
  const parsed = parseGlbJsonBin(buf);
  if (!parsed) return null;
  const { json, bin } = parsed;

  const matTex =
    json.materials?.[0]?.pbrMetallicRoughness?.baseColorTexture?.index;
  const fromMat = textureImageIndex(json, matTex);
  if (fromMat != null) {
    const bytes = imageBytesFromIndex(json, bin, fromMat);
    if (bytes) return bytes;
  }

  const named = (json.images ?? []).findIndex((img) =>
    /base.?color|albedo|diffuse/i.test(img.name ?? ""),
  );
  if (named >= 0) {
    const bytes = imageBytesFromIndex(json, bin, named);
    if (bytes) return bytes;
  }

  let best: Buffer | null = null;
  for (let i = 0; i < (json.images ?? []).length; i += 1) {
    const slice = imageBytesFromIndex(json, bin, i);
    if (slice && (!best || slice.length > best.length)) best = slice;
  }
  return best;
}

type Pixel = Rgb & { luma: number; sat: number; y: number };

function sampleFabricPixels(
  raw: Buffer,
  width: number,
  height: number,
  channels: number,
): Pixel[] {
  const pixels: Pixel[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      const r = raw[i] ?? 0;
      const g = raw[i + 1] ?? 0;
      const b = raw[i + 2] ?? 0;
      const a = channels > 3 ? (raw[i + 3] ?? 255) : 255;
      if (a < 16) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = max === 0 ? 0 : (max - min) / max;
      if (luma < KEEP_DARK_LUMA) continue;
      if (sat < LOGO_SAT_MAX && luma >= LOGO_LUMA_MIN) continue;
      pixels.push({ r, g, b, luma, sat, y });
    }
  }
  return pixels;
}

function kMeans(
  pixels: Pixel[],
  k: number,
  seeds?: Rgb[],
  iters = 12,
): Array<{ center: Rgb; members: Pixel[] }> {
  if (pixels.length === 0 || k <= 0) return [];
  const kUse = Math.min(k, pixels.length);
  const centers: Rgb[] = [];

  if (seeds && seeds.length > 0) {
    for (let i = 0; i < kUse; i += 1) {
      const s = seeds[i % seeds.length]!;
      centers.push({ r: s.r, g: s.g, b: s.b });
    }
  } else {
    const step = Math.max(1, Math.floor(pixels.length / kUse));
    for (let i = 0; i < kUse; i += 1) {
      const p = pixels[Math.min(i * step, pixels.length - 1)]!;
      centers.push({ r: p.r, g: p.g, b: p.b });
    }
  }

  let assign = new Int16Array(pixels.length);
  for (let iter = 0; iter < iters; iter += 1) {
    for (let i = 0; i < pixels.length; i += 1) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centers.length; c += 1) {
        const d = dist(pixels[i]!, centers[c]!);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assign[i] = best;
    }
    const sums = centers.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (let i = 0; i < pixels.length; i += 1) {
      const c = assign[i]!;
      const p = pixels[i]!;
      const s = sums[c]!;
      s.r += p.r;
      s.g += p.g;
      s.b += p.b;
      s.n += 1;
    }
    for (let c = 0; c < centers.length; c += 1) {
      const s = sums[c]!;
      if (s.n > 0) {
        centers[c] = { r: s.r / s.n, g: s.g / s.n, b: s.b / s.n };
      }
    }
  }

  const members: Pixel[][] = centers.map(() => []);
  for (let i = 0; i < pixels.length; i += 1) {
    members[assign[i]!]!.push(pixels[i]!);
  }
  return centers.map((center, i) => ({ center, members: members[i]! }));
}

function clusterRadius(members: Pixel[], center: Rgb): number {
  if (members.length === 0) return 70;
  const dists = members.map((p) => dist(p, center)).sort((a, b) => a - b);
  const p90 = dists[Math.floor(dists.length * 0.9)] ?? 70;
  return Math.max(45, Math.min(120, Math.round(p90 * 1.25)));
}

function scoreColorway(
  code: string,
  clusters: Array<{ center: Rgb; coverage: number; meanY: number }>,
): { score: number; mapping: Array<{ cluster: number; key: ColorCodeKey; d: number }> } {
  const keys = Array.from(new Set(extractKeysFromColorway(code)));
  if (keys.length === 0) return { score: 0, mapping: [] };

  const mapping: Array<{ cluster: number; key: ColorCodeKey; d: number }> = [];
  const usedKeys = new Set<string>();

  const order = clusters
    .map((c, i) => ({ i, coverage: c.coverage, center: c.center, meanY: c.meanY }))
    .sort((a, b) => b.coverage - a.coverage);

  for (const item of order) {
    let bestKey: ColorCodeKey | null = null;
    let bestD = Infinity;
    for (const key of keys) {
      if (usedKeys.has(key)) continue;
      const d = dist(item.center, parseHex(colorMap[key].hex));
      if (d < bestD) {
        bestD = d;
        bestKey = key;
      }
    }
    // Мягкий порог: далекие цвета всё равно маппим, но штраф в score
    if (!bestKey) continue;
    usedKeys.add(bestKey);
    mapping.push({ cluster: item.i, key: bestKey, d: bestD });
  }

  if (mapping.length === 0) return { score: 0, mapping: [] };

  const avgDist =
    mapping.reduce((s, m) => s + m.d, 0) / Math.max(1, mapping.length);
  const coverageHit = mapping.reduce(
    (s, m) => s + (clusters[m.cluster]?.coverage ?? 0),
    0,
  );
  const keyHit = mapping.length / keys.length;
  let score =
    coverageHit * 0.5 + keyHit * 0.25 + Math.max(0, 1 - avgDist / 140) * 0.25;

  // Kit: бонус, если top-ключ выше в текстуре (меньший Y), чем bottom
  try {
    const parsed = parseColorway(code);
    if (parsed.kind === "kit") {
      const topM = mapping.find((m) => m.key === parsed.top.baseKey);
      const botM = mapping.find((m) => m.key === parsed.bottom.baseKey);
      if (topM && botM) {
        const topY = clusters[topM.cluster]?.meanY ?? 0;
        const botY = clusters[botM.cluster]?.meanY ?? 0;
        if (topY < botY) score += 0.12;
        else score -= 0.08;
      }
    }
  } catch {
    /* ignore */
  }

  return { score, mapping };
}

function rolesForColorway(
  code: string,
  mapping: Array<{ cluster: number; key: ColorCodeKey }>,
): Array<{ cluster: number; role: GlbZoneRole; key: ColorCodeKey }> {
  const parsed = parseColorway(code);
  const result: Array<{ cluster: number; role: GlbZoneRole; key: ColorCodeKey }> =
    [];

  const take = (role: GlbZoneRole, key: ColorCodeKey) => {
    const hit = mapping.find((m) => m.key === key && !result.some((r) => r.cluster === m.cluster));
    if (hit) result.push({ cluster: hit.cluster, role, key });
  };

  if (parsed.kind === "kit") {
    take("top", parsed.top.baseKey);
    if (parsed.top.trimKey !== parsed.top.baseKey) take("trim", parsed.top.trimKey);
    take("bottom", parsed.bottom.baseKey);
    if (
      parsed.bottom.trimKey !== parsed.bottom.baseKey &&
      parsed.bottom.trimKey !== parsed.top.trimKey
    ) {
      take("accent", parsed.bottom.trimKey);
    }
  } else {
    take("base", parsed.baseKey);
    if (!parsed.isSolid && parsed.trimKey !== parsed.baseKey) {
      take("trim", parsed.trimKey);
    }
  }

  // leftover mapped clusters → accent
  for (const m of mapping) {
    if (result.some((r) => r.cluster === m.cluster)) continue;
    result.push({ cluster: m.cluster, role: "accent", key: m.key });
  }

  return result;
}

const MAX_KEY_DIST = 85; // пиксель/кластер дальше — не считаем этим ключом
const PIXEL_MATCH_DIST = 70;

type RoleSlot = { role: GlbZoneRole; key: ColorCodeKey };

function roleSlotsForColorway(code: string): RoleSlot[] {
  const parsed = parseColorway(code);
  const slots: RoleSlot[] = [];
  const seenKeys = new Set<string>();
  const push = (role: GlbZoneRole, key: ColorCodeKey) => {
    if (slots.some((s) => s.role === role && s.key === key)) return;
    // Kit: 1204-0004 → trim куртки и корпус штанов оба «04», но роли разные.
    if (parsed.kind !== "kit" && seenKeys.has(key)) return;
    seenKeys.add(key);
    slots.push({ role, key });
  };
  if (parsed.kind === "kit") {
    push("top", parsed.top.baseKey);
    if (!parsed.top.isSolid) push("trim", parsed.top.trimKey);
    push("bottom", parsed.bottom.baseKey);
    if (!parsed.bottom.isSolid) push("accent", parsed.bottom.trimKey);
  } else {
    push("base", parsed.baseKey);
    if (!parsed.isSolid) push("trim", parsed.trimKey);
  }
  return slots;
}

function medianRgb(members: Rgb[]): Rgb {
  if (members.length === 0) return { r: 128, g: 128, b: 128 };
  const rs = members.map((m) => m.r).sort((a, b) => a - b);
  const gs = members.map((m) => m.g).sort((a, b) => a - b);
  const bs = members.map((m) => m.b).sort((a, b) => a - b);
  const mid = Math.floor(members.length / 2);
  return { r: rs[mid]!, g: gs[mid]!, b: bs[mid]! };
}

/**
 * Зоны: k-means по числу ролей в baked-расцветке (первая в каталоге / hint).
 * bakedHex = реальный цвет в текстуре (не colorMap), чтобы перекраска
 * попадала в пиксели. Роли назначаются по близости к colorMap[key].
 */
function zonesFromClustersForBaked(
  pixels: Pixel[],
  slots: RoleSlot[],
): { zones: GlbColorZoneDef[]; conf: number; warnings: string[] } {
  const warnings: string[] = [];
  if (slots.length === 0 || pixels.length === 0) {
    return { zones: [], conf: 0, warnings: ["no slots or pixels"] };
  }

  const seeds = slots.map((s) => parseHex(colorMap[s.key].hex));
  const isKit =
    slots.some((s) => s.role === "top") && slots.some((s) => s.role === "bottom");
  const k = Math.min(
    MAX_CLUSTERS,
    Math.max(isKit ? 2 : 1, slots.length, isKit ? 3 : slots.length),
  );
  const clusters = kMeans(pixels, k, seeds)
    .map((c) => ({
      center: c.center,
      members: c.members,
      coverage: c.members.length / pixels.length,
      radius: clusterRadius(c.members, c.center),
      meanY:
        c.members.reduce((s, p) => s + p.y, 0) / Math.max(1, c.members.length),
      meanLuma:
        c.members.reduce((s, p) => s + p.luma, 0) / Math.max(1, c.members.length),
    }))
    // Не отбрасываем мелкие кластеры до назначения ролей — trim/шнурки часто <1.2%
    .filter((c) => c.members.length >= 8)
    .sort((a, b) => b.coverage - a.coverage);

  if (clusters.length === 0) {
    return { zones: [], conf: 0, warnings: ["no clusters"] };
  }

  const used = new Set<number>();
  const zones: GlbColorZoneDef[] = [];
  let distScore = 0;

  const isKitPair =
    slots.some((s) => s.role === "top") && slots.some((s) => s.role === "bottom");

  if (isKitPair && clusters.length >= 2) {
    // Костюм: два самых крупных / разных кластера → top/bottom по яркости ключей
    const topSlot = slots.find((s) => s.role === "top")!;
    const botSlot = slots.find((s) => s.role === "bottom")!;
    const topKeyLuma = (() => {
      const t = parseHex(colorMap[topSlot.key].hex);
      return 0.299 * t.r + 0.587 * t.g + 0.114 * t.b;
    })();
    const botKeyLuma = (() => {
      const t = parseHex(colorMap[botSlot.key].hex);
      return 0.299 * t.r + 0.587 * t.g + 0.114 * t.b;
    })();

    // Берём кластеры с наибольшим цветовым различием среди топ-3 по coverage
    const candidates = clusters.slice(0, Math.min(3, clusters.length));
    let bestPair: [number, number] = [0, 1];
    let bestSep = -1;
    for (let i = 0; i < candidates.length; i += 1) {
      for (let j = i + 1; j < candidates.length; j += 1) {
        const sep = dist(candidates[i]!.center, candidates[j]!.center);
        const area = candidates[i]!.coverage + candidates[j]!.coverage;
        const score = sep * (0.5 + area);
        if (score > bestSep) {
          bestSep = score;
          bestPair = [i, j];
        }
      }
    }
    const cA = candidates[bestPair[0]]!;
    const cB = candidates[bestPair[1]]!;
    const darker = cA.meanLuma <= cB.meanLuma ? cA : cB;
    const lighter = cA.meanLuma <= cB.meanLuma ? cB : cA;
    const topCluster = topKeyLuma <= botKeyLuma ? darker : lighter;
    const botCluster = topKeyLuma <= botKeyLuma ? lighter : darker;

    zones.push({
      role: "top",
      colorKey: topSlot.key,
      bakedHex: toHex(topCluster.center),
      matchRadius: Math.max(topCluster.radius, 55),
      coverage: Number(topCluster.coverage.toFixed(3)),
    });
    zones.push({
      role: "bottom",
      colorKey: botSlot.key,
      bakedHex: toHex(botCluster.center),
      matchRadius: Math.max(botCluster.radius, 55),
      coverage: Number(botCluster.coverage.toFixed(3)),
    });
    distScore =
      Math.max(0, 1 - dist(topCluster.center, parseHex(colorMap[topSlot.key].hex)) / 160) +
      Math.max(0, 1 - dist(botCluster.center, parseHex(colorMap[botSlot.key].hex)) / 160);

    // trim/accent если есть свободные кластеры
    for (const slot of slots) {
      if (slot.role === "top" || slot.role === "bottom") continue;
      const target = parseHex(colorMap[slot.key].hex);
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < clusters.length; i += 1) {
        const c = clusters[i]!;
        if (c === topCluster || c === botCluster) continue;
        const d = dist(c.center, target);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best < 0) continue;
      const c = clusters[best]!;
      zones.push({
        role: slot.role,
        colorKey: slot.key,
        bakedHex: toHex(c.center),
        matchRadius: c.radius,
        coverage: Number(c.coverage.toFixed(3)),
      });
    }
  } else {
    const dominant = clusters[0]!;
    const second = clusters[1];
    // Одна ткань только если второй кластер почти того же цвета
    // (оттенки/шейдинг). Контрастный trim (шнурки B303) — не mono.
    const monoFabric =
      clusters.length === 1 ||
      (second != null &&
        dominant.coverage >= 0.75 &&
        dist(dominant.center, second.center) < 42) ||
      (second != null &&
        dominant.coverage >= 0.95 &&
        second.coverage < 0.025);

    if (monoFabric) {
      // Одна ткань (B302 и т.п.): не делить на base/trim по каталогу —
      // иначе 99% оранжевого уезжает в trim и перекраска ломается.
      const baseSlot =
        slots.find((s) => s.role === "base" || s.role === "top") ?? slots[0]!;
      const target = parseHex(colorMap[baseSlot.key].hex);
      zones.push({
        role: baseSlot.role === "top" ? "top" : "base",
        colorKey: baseSlot.key,
        bakedHex: toHex(dominant.center),
        matchRadius: Math.max(dominant.radius, 70),
        coverage: Number(dominant.coverage.toFixed(3)),
      });
      distScore = Math.max(0, 1 - dist(dominant.center, target) / 160);
      warnings.push("mono fabric: only base/top zone");
    } else {
      // Тело изделия = самый большой кластер, отделка = второй.
      // Не nearest-to-catalog-hex: запечка часто зелёная, а каталог 0203 —
      // иначе корпус уезжает в trim (KITB0001).
      const byCoverage = [...clusters].sort(
        (a, b) => b.coverage - a.coverage,
      );
      const baseSlot =
        slots.find((s) => s.role === "base") ?? slots[0]!;
      const trimSlot = slots.find((s) => s.role === "trim");
      const body = byCoverage[0]!;
      const accent = byCoverage[1];

      zones.push({
        role: "base",
        colorKey: baseSlot.key,
        bakedHex: toHex(body.center),
        matchRadius: Math.max(body.radius, 70),
        coverage: Number(body.coverage.toFixed(3)),
      });
      distScore += Math.max(
        0,
        1 - dist(body.center, parseHex(colorMap[baseSlot.key].hex)) / 160,
      );
      used.add(clusters.indexOf(body));

      if (trimSlot && accent) {
        zones.push({
          role: "trim",
          colorKey: trimSlot.key,
          bakedHex: toHex(accent.center),
          matchRadius: Math.max(accent.radius, 55),
          coverage: Number(accent.coverage.toFixed(3)),
        });
        distScore += Math.max(
          0,
          1 - dist(accent.center, parseHex(colorMap[trimSlot.key].hex)) / 160,
        );
        used.add(clusters.indexOf(accent));
      }
    }
  }

  const conf = slots.length ? distScore / Math.max(1, zones.length) : 0;
  return { zones, conf, warnings };
}

/** Известные запечённые расцветки (имя файла / факт), иначе первая из каталога */
const BAKED_HINTS: Record<string, string> = {
  TXM1144P188: "0404-0044",
};

async function analyzeOne(
  productId: string,
  glbFile: string,
  product: ProductRow | undefined,
): Promise<GlbProductZones | null> {
  const warnings: string[] = [];
  const buf = fs.readFileSync(path.join(GLB_DIR, glbFile));
  const imageBytes = extractAlbedoImageBytes(buf);

  const colorways = product?.colorways ?? [];
  const bakedColorway =
    BAKED_HINTS[productId] ?? colorways[0] ?? "0004";

  if (!imageBytes) {
    warnings.push("no embedded image");
    return {
      bakedColorway,
      glbFile,
      confidence: 0,
      zones: [],
      warnings,
    };
  }

  const resized = await sharp(imageBytes)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const pixels = sampleFabricPixels(
    data,
    info.width,
    info.height,
    info.channels,
  );

  if (pixels.length < 50) warnings.push("too few fabric pixels");
  if (colorways.length === 0) warnings.push("product not in catalog");

  fs.mkdirSync(GLB_DIR, { recursive: true });
  const albedoUrl = `/3D/${productId}.albedo.png`;
  await sharp(imageBytes).png().toFile(path.join(GLB_DIR, `${productId}.albedo.png`));

  let slots: RoleSlot[] = [];
  try {
    slots = roleSlotsForColorway(bakedColorway);
  } catch (err) {
    warnings.push(`bad baked colorway ${bakedColorway}: ${String(err)}`);
    return { bakedColorway, glbFile, confidence: 0, zones: [], warnings };
  }

  const built = zonesFromClustersForBaked(pixels, slots);
  warnings.push(...built.warnings);

  if (built.zones.length === 0 && pixels.length > 0 && slots[0]) {
    const clusters = kMeans(pixels, 1);
    const largest = clusters[0];
    if (largest) {
      built.zones.push({
        role: slots[0].role,
        colorKey: slots[0].key,
        bakedHex: toHex(largest.center),
        matchRadius: clusterRadius(largest.members, largest.center),
        coverage: 1,
      });
      warnings.push("fallback: single fabric zone");
    }
  }

  const topZone = built.zones.find((z) => z.role === "top");
  const botZone = built.zones.find((z) => z.role === "bottom");
  const conf = Number(Math.max(0, Math.min(1, built.conf)).toFixed(3));
  const needsWorldY =
    topZone &&
    botZone &&
    (topZone.coverage ?? 0) < 0.14 &&
    (botZone.coverage ?? 0) > 0.65;

  return {
    bakedColorway,
    glbFile,
    albedoUrl,
    confidence: conf,
    zones: built.zones,
    splitMode: needsWorldY
      ? "worldY"
      : slots.some((s) => s.role === "top") &&
          slots.some((s) => s.role === "bottom")
        ? "luminance"
        : "nearest",
    warnings: warnings.length ? warnings : undefined,
  };
}

function loadOverrides(): Record<string, Partial<GlbProductZones>> {
  if (!fs.existsSync(OVERRIDES_PATH)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8")) as {
      products?: Record<string, Partial<GlbProductZones>>;
    };
    return raw.products ?? {};
  } catch {
    return {};
  }
}

function mergeProduct(
  auto: GlbProductZones,
  override?: Partial<GlbProductZones>,
): GlbProductZones {
  if (!override) return auto;
  return {
    ...auto,
    ...override,
    zones: override.zones ?? auto.zones,
    warnings: override.warnings ?? auto.warnings,
  };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--force");
  const filter = new Set(args.map((a) => a.toUpperCase()));

  const products = (productsFile as { products: ProductRow[] }).products;
  const byId = new Map(products.map((p) => [p.id, p]));

  const files = fs
    .readdirSync(GLB_DIR)
    .filter((f) => f.toLowerCase().endsWith(".glb"));

  const overrides = loadOverrides();
  const out: GlbColorZonesFile = {
    version: 1,
    generatedAt: new Date().toISOString(),
    note: "Auto-generated by npm run glb:zones. Manual fixes → glbColorZones.overrides.json",
    products: {},
  };

  const report: Array<{ id: string; ok: boolean; conf: number; zones: number; warn?: string }> =
    [];

  for (const file of files) {
    const id = productIdFromGlbName(file);
    if (!id) continue;
    if (filter.size > 0 && !filter.has(id.toUpperCase()) && !filter.has(file.toUpperCase())) {
      continue;
    }

    // Один артикул — один GLB (предпочитаем _3D, затем -optimized)
    const prevFile = out.products[id]?.glbFile;
    if (prevFile && glbFilePriority(prevFile) > glbFilePriority(file)) {
      continue;
    }

    process.stdout.write(`analyze ${id} (${file})… `);
    try {
      const auto = await analyzeOne(id, file, byId.get(id));
      if (!auto) {
        process.stdout.write("skip\n");
        continue;
      }
      const merged = mergeProduct(auto, overrides[id]);
      out.products[id] = merged;
      report.push({
        id,
        ok: merged.zones.length > 0,
        conf: merged.confidence ?? 0,
        zones: merged.zones.length,
        warn: merged.warnings?.join("; "),
      });
      process.stdout.write(
        `ok zones=${merged.zones.length} baked=${merged.bakedColorway} conf=${merged.confidence}\n`,
      );
    } catch (err) {
      process.stdout.write(`FAIL ${String(err)}\n`);
      report.push({ id, ok: false, conf: 0, zones: 0, warn: String(err) });
    }
  }

  // Keep previous entries for ids not re-analyzed (partial run)
  if (filter.size > 0 && fs.existsSync(OUT_PATH)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) as GlbColorZonesFile;
      out.products = { ...prev.products, ...out.products };
    } catch {
      /* ignore */
    }
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  const weak = report.filter((r) => !r.ok || r.conf < 0.35);
  process.stdout.write(`\nWrote ${OUT_PATH} (${Object.keys(out.products).length} products)\n`);
  if (weak.length) {
    process.stdout.write("\nNeeds review:\n");
    for (const w of weak) {
      process.stdout.write(
        `  - ${w.id}: conf=${w.conf} zones=${w.zones}${w.warn ? ` (${w.warn})` : ""}\n`,
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
