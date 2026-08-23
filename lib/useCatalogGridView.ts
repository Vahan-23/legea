"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CATALOG_GRID_STORAGE_KEY,
  DEFAULT_GRID_COLUMNS,
  parseGridColumns,
  type CatalogGridColumns,
} from "@/lib/catalogGridView";

export function useCatalogGridView(): [
  CatalogGridColumns,
  (value: CatalogGridColumns) => void,
] {
  const [columns, setColumns] = useState<CatalogGridColumns>(
    DEFAULT_GRID_COLUMNS,
  );

  useEffect(() => {
    setColumns(
      parseGridColumns(localStorage.getItem(CATALOG_GRID_STORAGE_KEY)),
    );
  }, []);

  const setGridColumns = useCallback((value: CatalogGridColumns) => {
    setColumns(value);
    localStorage.setItem(CATALOG_GRID_STORAGE_KEY, String(value));
  }, []);

  return [columns, setGridColumns];
}
