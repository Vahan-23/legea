"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CatalogFilterFields } from "@/components/catalog/FilterSidebar";
import { Button } from "@/components/ui/Button";
import {
  countActiveCatalogFacets,
  emptyCatalogFilters,
  filterProducts,
} from "@/lib/catalogFilters";
import type { Locale } from "@/i18n/routing";
import type { ColorCodeKey } from "@/data/colors";
import type { CatalogFilters, Product } from "@/types/product";

type MobileFilterSheetProps = {
  open: boolean;
  onClose: () => void;
  filters: CatalogFilters;
  colorKeys: ColorCodeKey[];
  products: Product[];
  onApply: (next: CatalogFilters) => void;
};

export function MobileFilterSheet({
  open,
  onClose,
  filters,
  colorKeys,
  products,
  onApply,
}: MobileFilterSheetProps) {
  const t = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const titleId = useId();
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const previewCount = useMemo(
    () => filterProducts(products, draft, locale).length,
    [products, draft, locale],
  );

  const facetCount = countActiveCatalogFacets(draft);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button
        type="button"
        aria-label={t("filtersClose")}
        className="absolute inset-0 bg-navy/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white shadow-2xl"
      >
        <div className="flex shrink-0 justify-center pt-3" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-navy/20" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-navy/10 px-4 pb-3 pt-2">
          <div className="flex items-center gap-2">
            <h2
              id={titleId}
              className="font-display text-lg uppercase tracking-display text-navy"
            >
              {t("filters")}
            </h2>
            {facetCount > 0 ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue px-1.5 font-mono text-[11px] text-white">
                {facetCount}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center text-2xl leading-none text-muted hover:text-navy"
            aria-label={t("filtersClose")}
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          <CatalogFilterFields
            filters={draft}
            colorKeys={colorKeys}
            onChange={setDraft}
            compact
          />
        </div>

        <div className="shrink-0 border-t border-navy/10 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 px-3 py-3.5 text-xs"
              onClick={() =>
                setDraft({
                  ...emptyCatalogFilters(),
                  q: draft.q,
                  sort: draft.sort,
                })
              }
            >
              {t("filtersClear")}
            </Button>
            <Button
              type="button"
              className="flex-[1.4] px-3 py-3.5 text-xs"
              onClick={() => {
                onApply(draft);
                onClose();
              }}
            >
              {t("filtersShow", { count: previewCount })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
