"use client";

import { useCallback, useState } from "react";
import {
  CATALOG_GRID_STORAGE_KEY,
  DEFAULT_GRID_COLUMNS,
  parseGridColumns,
  type CatalogGridColumns,
} from "@/lib/catalogGridView";

function readStoredColumns(): CatalogGridColumns {
  if (typeof window === "undefined") return DEFAULT_GRID_COLUMNS;
  return parseGridColumns(localStorage.getItem(CATALOG_GRID_STORAGE_KEY));
}

export function useCatalogGridView(): [
  CatalogGridColumns,
  (value: CatalogGridColumns) => void,
] {
  const [columns, setColumns] = useState<CatalogGridColumns>(readStoredColumns);

  const setGridColumns = useCallback((value: CatalogGridColumns) => {
    setColumns(value);
    localStorage.setItem(CATALOG_GRID_STORAGE_KEY, String(value));
  }, []);

  return [columns, setGridColumns];
}
