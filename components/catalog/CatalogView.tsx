"use client";

import { useCallback, useMemo, useTransition } from "react";
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
import type { CatalogFilters, Product } from "@/types/product";

type CatalogViewProps = {
  products: Product[];
  cardImages?: Record<string, string>;
};

export function CatalogView({ products, cardImages }: CatalogViewProps) {
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

  const colorKeys = useMemo(
    () => collectCatalogColorKeys(products),
    [products],
  );

  const filtered = useMemo(
    () => filterProducts(products, filters, locale),
    [products, filters, locale],
  );

  const pushFilters = useCallback(
    (next: CatalogFilters) => {
      const query = serializeCatalogFilters(next);
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router],
  );

  const reset = useCallback(() => {
    pushFilters(emptyCatalogFilters());
  }, [pushFilters]);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[240px_1fr]">
      <FilterSidebar
        filters={filters}
        colorKeys={colorKeys}
        onChange={pushFilters}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            value={filters.q}
            onChange={(q) => pushFilters({ ...filters, q })}
          />
          <SortSelect
            value={filters.sort}
            onChange={(sort) => pushFilters({ ...filters, sort })}
          />
        </div>

        <ActiveFilters
          filters={filters}
          onChange={pushFilters}
          onReset={reset}
        />

        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          {t("results", { count: filtered.length })}
        </p>

        {filtered.length === 0 ? (
          <div className="border border-blue/20 bg-off-white px-6 py-16 text-center">
            <p className="text-lg text-graphite">{t("empty")}</p>
            <div className="mt-6">
              <Button onClick={reset}>{t("reset")}</Button>
            </div>
          </div>
        ) : (
          <ProductGrid products={filtered} cardImages={cardImages} />
        )}
      </div>
    </div>
  );
}
