import type { ColorCodeKey } from "@/data/colors";
import type { Locale } from "@/i18n/routing";

export const PRODUCT_CATEGORIES = [
  "calcio",
  "volley",
  "basket",
  "universal",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_TYPES = [
  "maglie",
  "pantaloncini",
  "tute",
  "giacche",
  "felpe",
  "pantaloni",
  "portiere",
  "calze",
  "palloni",
  "borse",
  "accessori",
  "kit",
  "intimo",
  "polo",
  "tshirt",
  "capispalla",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const CATALOG_TECH_FILTERS = [
  "POLFRESH",
  "LUXIOM",
  "BREATHVENT",
  "FRESH WINTER FLEECE",
] as const;

export type CatalogTechFilter = (typeof CATALOG_TECH_FILTERS)[number];

export const GSM_BANDS = ["130-145", "200-245", "290+"] as const;

export type GsmBand = (typeof GSM_BANDS)[number];

export type LocalizedName = {
  ru: string;
  en: string;
  hy: string;
};

export type Product = {
  id: string;
  name: LocalizedName;
  category: ProductCategory;
  type: ProductType;
  model: string | null;
  gsm: number | null;
  composition: string;
  sizes: string[];
  features: string[];
  tech: string[];
  colorways: string[];
  priceLevel: 1 | 2 | 3;
  basePrice: number | null;
  moq: number;
  brandable: boolean;
  brandingZones: string[];
  oversizeId?: string;
  juniorId?: string;
  components?: [string, string];
  colorwayFormat?: "kit" | "single";
  dimensions?: string;
};

export type ProductsFile = {
  meta: {
    source: string;
    version: string;
    colorwayFormat: {
      single: string;
      kit: string;
    };
    note: string;
  };
  products: Product[];
  variants: Record<string, unknown>;
};

export type CatalogSort = "id" | "name";

export type CatalogFilters = {
  category: ProductCategory[];
  type: ProductType[];
  color: ColorCodeKey[];
  has3xs: boolean;
  hasOversize: boolean;
  gsm: GsmBand[];
  tech: CatalogTechFilter[];
  q: string;
  sort: CatalogSort;
};

export function productName(product: Product, locale: Locale): string {
  return product.name[locale] || product.name.ru;
}
