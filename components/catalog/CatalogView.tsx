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
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SearchBar, SortSelect } from "@/components/catalog/SearchBar";
import { Button } from "@/components/ui/Button";
import {
  collectCatalogColorKeys,
  emptyCatalogFilters,
  filterProducts,
  parseCatalogFilters,
  serializeCatalogFilters,
} from "@/lib/catalogFilters";
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

  /** Локальный текст поиска — без router на каждый символ */
  const [qDraft, setQDraft] = useState(filters.q);

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

  // URL обновляем с debounce — только для шаринга / назад
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

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[240px_1fr]">
      <FilterSidebar
        filters={filtersLive}
        colorKeys={colorKeys}
        onChange={handleFiltersChange}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar value={qDraft} onChange={setQDraft} />
          <SortSelect
            value={filters.sort}
            onChange={(sort) => pushFilters({ ...filters, q: qDraft.trim(), sort })}
          />
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
              listPending ? "opacity-70 transition-opacity" : "transition-opacity"
            }
          >
            <ProductGrid
              products={deferredFiltered}
              cardPhotos={cardPhotos}
              fashionModels={fashionModels}
            />
          </div>
        )}
      </div>
    </div>
  );
}
