"use client";

import { useTranslations } from "next-intl";
import { colorMap } from "@/data/colors";
import { Button } from "@/components/ui/Button";
import {
  hasActiveCatalogFilters,
} from "@/lib/catalogFilters";
import type { CatalogFilters } from "@/types/product";

type ActiveFiltersProps = {
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
  onReset: () => void;
};

export function ActiveFilters({
  filters,
  onChange,
  onReset,
}: ActiveFiltersProps) {
  const t = useTranslations("catalog");

  if (!hasActiveCatalogFilters(filters)) return null;

  const chips: Array<{ key: string; label: string; clear: () => void }> = [];

  for (const category of filters.category) {
    chips.push({
      key: `cat-${category}`,
      label: t(`categories.${category}`),
      clear: () =>
        onChange({
          ...filters,
          category: filters.category.filter((item) => item !== category),
        }),
    });
  }

  for (const type of filters.type) {
    chips.push({
      key: `type-${type}`,
      label: t(`types.${type}`),
      clear: () =>
        onChange({
          ...filters,
          type: filters.type.filter((item) => item !== type),
        }),
    });
  }

  for (const color of filters.color) {
    chips.push({
      key: `color-${color}`,
      label: colorMap[color].name,
      clear: () =>
        onChange({
          ...filters,
          color: filters.color.filter((item) => item !== color),
        }),
    });
  }

  for (const band of filters.gsm) {
    chips.push({
      key: `gsm-${band}`,
      label: `${t(`gsmBands.${band}`)} ${t("gsmUnit")}`,
      clear: () =>
        onChange({
          ...filters,
          gsm: filters.gsm.filter((item) => item !== band),
        }),
    });
  }

  for (const tech of filters.tech) {
    chips.push({
      key: `tech-${tech}`,
      label: tech,
      clear: () =>
        onChange({
          ...filters,
          tech: filters.tech.filter((item) => item !== tech),
        }),
    });
  }

  if (filters.has3xs) {
    chips.push({
      key: "has3xs",
      label: t("has3xs"),
      clear: () => onChange({ ...filters, has3xs: false }),
    });
  }

  if (filters.hasOversize) {
    chips.push({
      key: "hasOversize",
      label: t("hasOversize"),
      clear: () => onChange({ ...filters, hasOversize: false }),
    });
  }

  if (filters.q) {
    chips.push({
      key: "q",
      label: `«${filters.q}»`,
      clear: () => onChange({ ...filters, q: "" }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={t("activeFilters")}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.clear}
          className="border border-blue/40 bg-off-white px-2.5 py-1 text-xs uppercase tracking-wide text-navy hover:border-blue hover:text-blue"
        >
          {chip.label} ×
        </button>
      ))}
      <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={onReset}>
        {t("reset")}
      </Button>
    </div>
  );
}
