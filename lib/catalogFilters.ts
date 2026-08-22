import { colorMap, type ColorCodeKey } from "@/data/colors";
import { parseColorway } from "@/lib/colorCode";
import type { Locale } from "@/i18n/routing";
import type {
  CatalogFilters,
  CatalogSort,
  GsmBand,
  Product,
  ProductCategory,
  ProductType,
} from "@/types/product";
import {
  CATALOG_TECH_FILTERS,
  GSM_BANDS,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from "@/types/product";

const OVERSIZE_SIZES = new Set(["3XL", "4XL", "5XL", "6XL"]);

function isColorCodeKey(value: string): value is ColorCodeKey {
  return Object.prototype.hasOwnProperty.call(colorMap, value);
}

function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}

function isProductType(value: string): value is ProductType {
  return (PRODUCT_TYPES as readonly string[]).includes(value);
}

function isGsmBand(value: string): value is GsmBand {
  return (GSM_BANDS as readonly string[]).includes(value);
}

function isCatalogTech(
  value: string,
): value is (typeof CATALOG_TECH_FILTERS)[number] {
  return (CATALOG_TECH_FILTERS as readonly string[]).includes(value);
}

function splitParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Разбор searchParams → фильтры каталога. */
export function parseCatalogFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): CatalogFilters {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const raw = params[key];
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw ?? null;
  };

  const sortRaw = get("sort");
  const sort: CatalogSort = sortRaw === "name" ? "name" : "id";

  return {
    category: splitParam(get("category")).filter(isProductCategory),
    type: splitParam(get("type")).filter(isProductType),
    color: splitParam(get("color")).filter(isColorCodeKey),
    has3xs: get("has3xs") === "1",
    hasOversize: get("hasOversize") === "1",
    gsm: splitParam(get("gsm")).filter(isGsmBand),
    tech: splitParam(get("tech")).filter(isCatalogTech),
    q: (get("q") ?? "").trim(),
    sort,
  };
}

/** Сериализация фильтров в query-string (без пустых). */
export function serializeCatalogFilters(filters: CatalogFilters): string {
  const params = new URLSearchParams();

  if (filters.category.length) {
    params.set("category", filters.category.join(","));
  }
  if (filters.type.length) {
    params.set("type", filters.type.join(","));
  }
  if (filters.color.length) {
    params.set("color", filters.color.join(","));
  }
  if (filters.has3xs) params.set("has3xs", "1");
  if (filters.hasOversize) params.set("hasOversize", "1");
  if (filters.gsm.length) params.set("gsm", filters.gsm.join(","));
  if (filters.tech.length) params.set("tech", filters.tech.join(","));
  if (filters.q) params.set("q", filters.q);
  if (filters.sort !== "id") params.set("sort", filters.sort);

  return params.toString();
}

export function emptyCatalogFilters(): CatalogFilters {
  return {
    category: [],
    type: [],
    color: [],
    has3xs: false,
    hasOversize: false,
    gsm: [],
    tech: [],
    q: "",
    sort: "id",
  };
}

export function hasActiveCatalogFilters(filters: CatalogFilters): boolean {
  return countActiveCatalogFacets(filters) > 0 || filters.q.length > 0;
}

/** Активные фасеты без строки поиска — для бейджа на кнопке «Фильтры». */
export function countActiveCatalogFacets(filters: CatalogFilters): number {
  return (
    filters.category.length +
    filters.type.length +
    filters.color.length +
    filters.gsm.length +
    filters.tech.length +
    (filters.has3xs ? 1 : 0) +
    (filters.hasOversize ? 1 : 0)
  );
}

/** Ключи цветов, встречающиеся в colorways (безопасно для неизвестных кодов). */
export function colorKeysInProduct(product: Product): Set<ColorCodeKey> {
  const keys = new Set<ColorCodeKey>();

  for (const colorway of product.colorways) {
    try {
      const parsed = parseColorway(colorway);
      if (parsed.kind === "kit") {
        keys.add(parsed.top.baseKey);
        keys.add(parsed.top.trimKey);
        keys.add(parsed.bottom.baseKey);
        keys.add(parsed.bottom.trimKey);
      } else {
        keys.add(parsed.baseKey);
        keys.add(parsed.trimKey);
      }
    } catch {
      // Неизвестный код (напр. 71) — пропускаем до уточнения палитры
    }
  }

  return keys;
}

function matchesGsm(gsm: number | null, bands: GsmBand[]): boolean {
  if (bands.length === 0) return true;
  if (gsm === null) return false;

  return bands.some((band) => {
    if (band === "130-145") return gsm >= 130 && gsm <= 145;
    if (band === "200-245") return gsm >= 200 && gsm <= 245;
    return gsm >= 290;
  });
}

function has3xsSize(product: Product): boolean {
  return product.sizes.includes("3XS") || Boolean(product.juniorId);
}

function hasOversize(product: Product): boolean {
  if (product.oversizeId) return true;
  return product.sizes.some((size) => OVERSIZE_SIZES.has(size));
}

function matchesQuery(
  product: Product,
  query: string,
  locale: Locale,
): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  if (product.id.toLowerCase().includes(needle)) return true;
  const name = (product.name[locale] || product.name.ru).toLowerCase();
  if (name.includes(needle)) return true;
  // Также en/ru имена — чтобы поиск не зависел только от локали
  if (locale !== "ru" && product.name.ru.toLowerCase().includes(needle)) {
    return true;
  }
  if (locale !== "en" && product.name.en.toLowerCase().includes(needle)) {
    return true;
  }
  return false;
}

export function filterProducts(
  products: Product[],
  filters: CatalogFilters,
  locale: Locale,
): Product[] {
  let result = products.filter((product) => {
    if (
      filters.category.length > 0 &&
      !filters.category.includes(product.category)
    ) {
      return false;
    }
    if (filters.type.length > 0 && !filters.type.includes(product.type)) {
      return false;
    }
    if (filters.color.length > 0) {
      const keys = colorKeysInProduct(product);
      if (!filters.color.some((key) => keys.has(key))) return false;
    }
    if (filters.has3xs && !has3xsSize(product)) return false;
    if (filters.hasOversize && !hasOversize(product)) return false;
    if (!matchesGsm(product.gsm, filters.gsm)) return false;
    if (
      filters.tech.length > 0 &&
      !filters.tech.some((tech) => product.tech.includes(tech))
    ) {
      return false;
    }
    if (!matchesQuery(product, filters.q, locale)) return false;
    return true;
  });

  result = [...result].sort((a, b) => {
    if (filters.sort === "name") {
      const nameA = a.name[locale] || a.name.ru;
      const nameB = b.name[locale] || b.name.ru;
      return nameA.localeCompare(nameB, locale);
    }
    return a.id.localeCompare(b.id);
  });

  return result;
}

/** Уникальные ключи цветов по всему каталогу — для фильтра-палитры. */
export function collectCatalogColorKeys(products: Product[]): ColorCodeKey[] {
  const keys = new Set<ColorCodeKey>();
  for (const product of products) {
    for (const key of Array.from(colorKeysInProduct(product))) {
      keys.add(key);
    }
  }
  return Array.from(keys).sort();
}
