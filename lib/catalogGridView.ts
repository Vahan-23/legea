export type CatalogGridColumns = 2 | 3 | 4;

export const CATALOG_GRID_STORAGE_KEY = "legea-catalog-grid";

export const DEFAULT_GRID_COLUMNS: CatalogGridColumns = 2;

export function parseGridColumns(value: string | null): CatalogGridColumns {
  if (value === "3") return 3;
  if (value === "4") return 4;
  return 2;
}

export function gridClassName(columns: CatalogGridColumns): string {
  const base =
    "grid grid-cols-1 gap-y-0 md:gap-x-8 md:gap-y-12 xl:gap-x-10 xl:gap-y-14";
  switch (columns) {
    case 4:
      return `${base} md:grid-cols-4 md:gap-x-5 xl:gap-x-6`;
    case 3:
      return `${base} md:grid-cols-3 md:gap-x-6`;
    default:
      return `${base} md:grid-cols-2 md:gap-x-10`;
  }
}
