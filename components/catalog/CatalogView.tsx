"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
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

  const [qDraft, setQDraft] = useState(filters.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gridColumns, setGridColumns] = useCatalogGridView();

  useEffect(() => {
    setQDraft(filters.q);
  }, [filters.q]);

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
    if (with3d.size === 0) return result;
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
    if (nextQ === filters.q) return;
    const timer = window.setTimeout(() => {
      pushFilters({ ...filters, q: nextQ });
    }, SEARCH_URL_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [qDraft, filters, pushFilters]);

  const reset = useCallback(() => {
    setQDraft("");
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
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[240px_1fr] lg:gap-10">
      <FilterSidebar
        filters={filtersLive}
        colorKeys={colorKeys}
        onChange={handleFiltersChange}
      />

      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <SearchBar value={qDraft} onChange={setQDraft} />

          <div className="flex items-center gap-2 justify-between">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 border border-navy bg-white px-4 py-2.5 font-sans text-xs font-medium uppercase tracking-wide text-navy lg:hidden"
            >
              {t("filters")}
              {facetCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1 font-mono text-[10px] text-white">
                  {facetCount}
                </span>
              ) : null}
            </button>

            <div className="ml-auto flex min-w-0 items-center gap-3">
              <GridViewToggle value={gridColumns} onChange={setGridColumns} />
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
          <div
            className={
              listPending
                ? "opacity-70 transition-opacity"
                : "transition-opacity"
            }
          >
            <ProductGrid
              products={deferredFiltered}
              cardPhotos={cardPhotos}
              fashionModels={fashionModels}
              columns={gridColumns}
            />
          </div>
        )}
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
