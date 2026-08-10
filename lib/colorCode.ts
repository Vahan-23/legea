import { colorMap, type ColorCodeKey } from "@/data/colors";

/** LUXIOM-пары с переливающимся паттерном (каталог Legea). */
const IRIDESCENT_CODES = new Set(["1075", "2324", "0476"]);

export type ParsedColorCode = {
  /** Исходный 4-символьный код XXYY */
  code: string;
  /** Hex основного цвета */
  base: string;
  /** Hex отделки (для solid — затемнённый base) */
  trim: string;
  /** Ключ основного цвета в colorMap */
  baseKey: ColorCodeKey;
  /** Ключ отделки в colorMap (для solid совпадает с baseKey) */
  trimKey: ColorCodeKey;
  isSolid: boolean;
  isIridescent: boolean;
};

export type ParsedKitColorway = {
  kind: "kit";
  code: string;
  top: ParsedColorCode;
  bottom: ParsedColorCode;
};

export type ParsedSingleColorway = {
  kind: "single";
} & ParsedColorCode;

export type ParsedColorway = ParsedSingleColorway | ParsedKitColorway;

function isColorCodeKey(value: string): value is ColorCodeKey {
  return Object.prototype.hasOwnProperty.call(colorMap, value);
}

function resolveHex(key: string): { key: ColorCodeKey; hex: string } {
  if (!isColorCodeKey(key)) {
    throw new Error(`Unknown Legea color key: ${key}`);
  }
  return { key, hex: colorMap[key].hex };
}

/**
 * Затемняет hex на долю amount (0…1), напр. 0.12 = −12% к каналам RGB.
 */
export function darkenHex(hex: string, amount = 0.12): string {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const factor = 1 - amount;
  const toChannel = (start: number): string => {
    const value = Math.round(
      Number.parseInt(normalized.slice(start, start + 2), 16) * factor,
    );
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  };

  return `#${toChannel(0)}${toChannel(2)}${toChannel(4)}`.toUpperCase();
}

/**
 * Разбор одиночного кода XXYY.
 *
 * Верное правило (products.json meta.colorwayFormat):
 * — XX = основной цвет, YY = отделка
 * — префикс 00 → однотонный: цвет = YY
 * — XX === YY → однотонный, trim = darken(base, 12%)
 * — 1075 / 2324 / 0476 → isIridescent
 *
 * Устаревшее правило из prompt.txt (isSolid только при base===trim
 * без учёта 00) — не использовать.
 */
export function parseColorCode(code: string): ParsedColorCode {
  if (!/^\d{4}$/.test(code)) {
    throw new Error(`Invalid color code (expected XXYY): ${code}`);
  }

  const xx = code.slice(0, 2);
  const yy = code.slice(2, 4);
  const isIridescent = IRIDESCENT_CODES.has(code);
  const isSolidPrefix = xx === "00";
  const isSamePair = xx === yy;
  const isSolid = isSolidPrefix || isSamePair;

  // При 00YY фактический цвет — YY; ключ "00" в карте отсутствует
  const baseResolved = resolveHex(isSolidPrefix ? yy : xx);
  const trimResolved = isSolid
    ? { key: baseResolved.key, hex: darkenHex(baseResolved.hex, 0.12) }
    : resolveHex(yy);

  return {
    code,
    base: baseResolved.hex.toUpperCase(),
    trim: trimResolved.hex.toUpperCase(),
    baseKey: baseResolved.key,
    trimKey: trimResolved.key,
    isSolid,
    isIridescent,
  };
}

/**
 * Разбор расцветки товара: XXYY или AABB-CCDD (костюмы type: tute).
 */
export function parseColorway(code: string): ParsedColorway {
  if (code.includes("-")) {
    const parts = code.split("-");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid kit colorway: ${code}`);
    }
    return {
      kind: "kit",
      code,
      top: parseColorCode(parts[0]),
      bottom: parseColorCode(parts[1]),
    };
  }

  return { kind: "single", ...parseColorCode(code) };
}

/** CSS для свотча: solid — заливка; иначе conic-gradient пополам. */
export function swatchBackground(code: string): string {
  const parsed = parseColorway(code);
  if (parsed.kind === "kit") {
    // Для комплекта показываем верх (майка/куртка) как основной свотч
    return swatchBackgroundFromParsed(parsed.top);
  }
  return swatchBackgroundFromParsed(parsed);
}

function swatchBackgroundFromParsed(parsed: ParsedColorCode): string {
  if (parsed.isSolid) {
    return parsed.base;
  }
  return `conic-gradient(from 90deg, ${parsed.base} 0 50%, ${parsed.trim} 50% 100%)`;
}
