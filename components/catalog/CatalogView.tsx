"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { ActiveFilters } from "@/components/catalog/ActiveFilters";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { MobileFilterSheet } from "@/components/catalog/MobileFilterSheet";
import { GridViewToggle } from "@/components/catalog/GridViewToggle";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SearchBar, SortSelect } from "@/components/catalog/SearchBar";
import { Button } from "@/components/ui/Button";
import {
  collectCatalogColorKeys,
  countActiveCatalogFacets,
  emptyCatalogFilters,
  filterProducts,
  parseCatalogFilters,
  serializeCatalogFilters,
} from "@/lib/catalogFilters";
import { columnsWithSidebar } from "@/lib/catalogGridView";
import { useCatalogGridView } from "@/lib/useCatalogGridView";
import type { Locale } from "@/i18n/routing";
import type { ProductPhotos } from "@/lib/productImages";
import type { CatalogFilters, Product } from "@/types/product";

const SEARCH_URL_DEBOUNCE_MS = 300;

type CatalogViewProps = {
  products: Product[];
  cardPhotos?: Record<string, ProductPhotos>;
  fashionModels?: Record<string, string>;
  productIdsWith3d?: string[];
};

export function CatalogView({
  products,
  cardPhotos,
  fashionModels,
  productIdsWith3d,
}: CatalogViewProps) {
  const t = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = useMemo(
    () => parseCatalogFilters(searchParams),
    [searchParams],
  );

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const [qDraft, setQDraft] = useState(filters.q);
  /** Последнее q из URL — не затираем быстрый ввод устаревшим debounce. */
  const urlQRef = useRef(filters.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gridColumns, setGridColumns] = useCatalogGridView();

  useEffect(() => {
    if (filters.q === urlQRef.current) return;
    const previousUrlQ = urlQRef.current;
    urlQRef.current = filters.q;
    setQDraft((draft) => {
      const d = draft.trim();
      const prev = previousUrlQ.trim();
      const next = filters.q.trim();
      // Пользователь уже ушёл дальше URL (быстрый ввод) — не трогаем поле
      if (d !== prev && d !== next) return draft;
      return filters.q;
    });
  }, [filters.q]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("legea-catalog-filters-open");
      // Default: open. Only close if user previously chose closed.
      if (raw === "0") setSidebarOpen(false);
      else setSidebarOpen(true);
    } catch {
      setSidebarOpen(true);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("legea-catalog-filters-open", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const colorKeys = useMemo(
    () => collectCatalogColorKeys(products),
    [products],
  );

  const with3d = useMemo(
    () => new Set(productIdsWith3d ?? []),
    [productIdsWith3d],
  );

  const filtersLive = useMemo(
    (): CatalogFilters => ({ ...filters, q: qDraft.trim() }),
    [filters, qDraft],
  );

  const facetCount = countActiveCatalogFacets(filtersLive);

  const filtered = useMemo(() => {
    const result = filterProducts(products, filtersLive, locale);
    const q = filtersLive.q.trim();
    // При поиске оставляем порядок релевантности из filterProducts
    if (q || with3d.size === 0) return result;
    return [...result].sort((a, b) => {
      const a3d = with3d.has(a.id) ? 0 : 1;
      const b3d = with3d.has(b.id) ? 0 : 1;
      return a3d - b3d;
    });
  }, [products, filtersLive, locale, with3d]);

  const deferredFiltered = useDeferredValue(filtered);
  const listPending = deferredFiltered !== filtered;

  const pushFilters = useCallback(
    (next: CatalogFilters) => {
      const query = serializeCatalogFilters(next);
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, startTransition],
  );

  useEffect(() => {
    const nextQ = qDraft.trim();
    if (nextQ === filtersRef.current.q) return;
    const timer = window.setTimeout(() => {
      const latest = filtersRef.current;
      if (nextQ === latest.q) return;
      pushFilters({ ...latest, q: nextQ });
    }, SEARCH_URL_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [qDraft, pushFilters]);

  const reset = useCallback(() => {
    setQDraft("");
    urlQRef.current = "";
    pushFilters(emptyCatalogFilters());
  }, [pushFilters]);

  const handleFiltersChange = useCallback(
    (next: CatalogFilters) => {
      if (next.q !== qDraft) setQDraft(next.q);
      pushFilters(next);
    },
    [pushFilters, qDraft],
  );

  const handleApplySheet = useCallback(
    (next: CatalogFilters) => {
      const merged = { ...next, q: qDraft.trim(), sort: filters.sort };
      if (merged.q !== qDraft) setQDraft(merged.q);
      pushFilters(merged);
    },
    [filters.sort, pushFilters, qDraft],
  );

  return (
    <div className="w-full overflow-x-hidden py-6 sm:py-8 lg:py-10">
      <div
        className={
          sidebarOpen
            ? "lg:grid lg:grid-cols-[minmax(12rem,18%)_minmax(0,1fr)] lg:items-start"
            : "block w-full"
        }
      >
        <FilterSidebar
          filters={filtersLive}
          colorKeys={colorKeys}
          onChange={handleFiltersChange}
          open={sidebarOpen}
        />

        <div className="min-w-0 w-full space-y-5 px-4 sm:space-y-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="flex flex-col gap-3 sm:gap-4">
            <SearchBar value={qDraft} onChange={setQDraft} />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {/* Mobile sheet */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 border border-navy bg-white px-4 py-2.5 font-sans text-xs font-medium uppercase tracking-wide text-navy sm:w-auto lg:hidden"
              >
                {t("filters")}
                {facetCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1 font-mono text-[10px] text-white">
                    {facetCount}
                  </span>
                ) : null}
              </button>

              {/* Desktop: одна фиксированная кнопка открыть/закрыть */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden min-w-[9.5rem] shrink-0 items-center justify-center gap-2 border border-navy/20 bg-white px-4 py-2.5 font-sans text-xs font-medium uppercase tracking-wide text-navy transition-colors hover:border-blue hover:text-blue lg:inline-flex"
                aria-expanded={sidebarOpen}
                aria-label={sidebarOpen ? t("filtersClose") : t("filtersOpen")}
              >
                <span aria-hidden className="font-mono text-sm leading-none">
                  {sidebarOpen ? "‹" : "›"}
                </span>
                {t("filters")}
                {facetCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1 font-mono text-[10px] text-white">
                    {facetCount}
                  </span>
                ) : null}
              </button>

              <div className="flex w-full min-w-0 items-center justify-end gap-3 sm:ml-auto sm:w-auto">
                <GridViewToggle
                  value={gridColumns}
                  onChange={setGridColumns}
                  maxColumns={sidebarOpen ? 4 : 5}
                />
                <SortSelect
                  value={filters.sort}
                  onChange={(sort) =>
                    pushFilters({ ...filters, q: qDraft.trim(), sort })
                  }
                />
              </div>
            </div>
          </div>

          <ActiveFilters
            filters={filtersLive}
            onChange={handleFiltersChange}
            onReset={reset}
          />

          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {t("results", { count: deferredFiltered.length })}
            {listPending ? " …" : null}
          </p>

          {deferredFiltered.length === 0 ? (
            <div className="border border-blue/20 bg-off-white px-6 py-16 text-center">
              <p className="text-lg text-graphite">{t("empty")}</p>
              <div className="mt-6">
                <Button onClick={reset}>{t("reset")}</Button>
              </div>
            </div>
          ) : (
            <ProductGrid
              products={deferredFiltered}
              cardPhotos={cardPhotos}
              fashionModels={fashionModels}
              columns={columnsWithSidebar(gridColumns, sidebarOpen)}
            />
          )}
        </div>
      </div>

      <MobileFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filtersLive}
        colorKeys={colorKeys}
        products={products}
        onApply={handleApplySheet}
      />
    </div>
  );
}
