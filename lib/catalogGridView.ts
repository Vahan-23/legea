export type CatalogGridColumns = 2 | 3 | 4;

export const CATALOG_GRID_STORAGE_KEY = "legea-catalog-grid";

export const DEFAULT_GRID_COLUMNS: CatalogGridColumns = 2;

export function parseGridColumns(value: string | null): CatalogGridColumns {
  if (value === "3") return 3;
  if (value === "4") return 4;
  return 2;
}

export function gridClassName(columns: CatalogGridColumns): string {
  const base = "grid grid-cols-1 gap-y-8 md:gap-x-5 md:gap-y-10";
  switch (columns) {
    case 4:
      return `${base} md:grid-cols-3 lg:grid-cols-4`;
    case 3:
      return `${base} md:grid-cols-3`;
    default:
      return `${base} md:grid-cols-2 md:gap-x-6 md:gap-y-12`;
  }
}
