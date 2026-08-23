export type CatalogGridColumns = 2 | 3 | 4 | 5;

export const CATALOG_GRID_STORAGE_KEY = "legea-catalog-grid";

export const DEFAULT_GRID_COLUMNS: CatalogGridColumns = 4;

export const GRID_COLUMN_OPTIONS: CatalogGridColumns[] = [2, 3, 4, 5];

export function parseGridColumns(value: string | null): CatalogGridColumns {
  if (value === "2") return 2;
  if (value === "3") return 3;
  if (value === "5") return 5;
  if (value === "4") return 4;
  return DEFAULT_GRID_COLUMNS;
}

export function gridClassName(columns: CatalogGridColumns): string {
  /** Широкие карточки: больше gap, без сжатия «в кашу» */
  const base = "grid grid-cols-1 gap-y-0 md:gap-y-12";
  switch (columns) {
    case 5:
      return `${base} md:grid-cols-5 md:gap-x-6 md:gap-y-12 xl:gap-x-8`;
    case 4:
      return `${base} md:grid-cols-4 md:gap-x-7 md:gap-y-12 xl:gap-x-8`;
    case 3:
      return `${base} md:grid-cols-3 md:gap-x-8 md:gap-y-14`;
    default:
      return `${base} md:grid-cols-2 md:gap-x-10 md:gap-y-14 xl:gap-x-12`;
  }
}

/**
 * Открытые фильтры (~20% ширины) — макс. 4 колонки.
 * Закрытые — выбранное число, в т.ч. 5.
 */
export function columnsWithSidebar(
  columns: CatalogGridColumns,
  sidebarOpen: boolean,
): CatalogGridColumns {
  if (sidebarOpen && columns === 5) return 4;
  return columns;
}
