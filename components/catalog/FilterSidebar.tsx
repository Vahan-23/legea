"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { colorMap, colors, type ColorCodeKey } from "@/data/colors";
import {
  CATALOG_TECH_FILTERS,
  GSM_BANDS,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  type CatalogFilters,
  type CatalogTechFilter,
  type GsmBand,
  type ProductCategory,
  type ProductType,
} from "@/types/product";

type FilterSidebarProps = {
  filters: CatalogFilters;
  colorKeys: ColorCodeKey[];
  onChange: (next: CatalogFilters) => void;
};

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function FilterSidebar({
  filters,
  colorKeys,
  onChange,
}: FilterSidebarProps) {
  const t = useTranslations("catalog");

  return (
    <aside className="space-y-8 border-b border-blue/20 pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
      <h2 className="font-display text-lg uppercase tracking-display text-navy">
        {t("filters")}
      </h2>

      <FilterGroup title={t("sport")}>
        {PRODUCT_CATEGORIES.map((category) => (
          <CheckboxRow
            key={category}
            checked={filters.category.includes(category)}
            label={t(`categories.${category}`)}
            onChange={() =>
              onChange({
                ...filters,
                category: toggleInList<ProductCategory>(
                  filters.category,
                  category,
                ),
              })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t("type")}>
        {PRODUCT_TYPES.map((type) => (
          <CheckboxRow
            key={type}
            checked={filters.type.includes(type)}
            label={t(`types.${type}`)}
            onChange={() =>
              onChange({
                ...filters,
                type: toggleInList<ProductType>(filters.type, type),
              })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t("color")}>
        <div className="flex flex-wrap gap-2">
          {colorKeys.map((key) => {
            const active = filters.color.includes(key);
            const hex = colorMap[key].hex;
            const n = hex.replace("#", "");
            const r = Number.parseInt(n.slice(0, 2), 16);
            const g = Number.parseInt(n.slice(2, 4), 16);
            const b = Number.parseInt(n.slice(4, 6), 16);
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            const edge = luma < 70 || luma > 220;
            return (
              <button
                key={key}
                type="button"
                title={colorMap[key].name}
                aria-pressed={active}
                onClick={() =>
                  onChange({
                    ...filters,
                    color: toggleInList<ColorCodeKey>(filters.color, key),
                  })
                }
                className={
                  active
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-white p-[2px] ring-2 ring-blue ring-offset-2"
                    : "flex h-7 w-7 items-center justify-center rounded-full bg-white p-[2px] ring-1 ring-navy/30"
                }
              >
                <span
                  className="block h-full w-full rounded-full"
                  style={{
                    backgroundColor: hex,
                    boxShadow: edge
                      ? `inset 0 0 0 1px ${colors.muted}`
                      : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title={t("sizes")}>
        <CheckboxRow
          checked={filters.has3xs}
          label={t("has3xs")}
          onChange={() => onChange({ ...filters, has3xs: !filters.has3xs })}
        />
        <CheckboxRow
          checked={filters.hasOversize}
          label={t("hasOversize")}
          onChange={() =>
            onChange({ ...filters, hasOversize: !filters.hasOversize })
          }
        />
      </FilterGroup>

      <FilterGroup title={t("gsm")}>
        {GSM_BANDS.map((band) => (
          <CheckboxRow
            key={band}
            checked={filters.gsm.includes(band)}
            label={`${t(`gsmBands.${band}`)} ${t("gsmUnit")}`}
            onChange={() =>
              onChange({
                ...filters,
                gsm: toggleInList<GsmBand>(filters.gsm, band),
              })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup title={t("tech")}>
        {CATALOG_TECH_FILTERS.map((tech) => (
          <CheckboxRow
            key={tech}
            checked={filters.tech.includes(tech)}
            label={tech}
            onChange={() =>
              onChange({
                ...filters,
                tech: toggleInList<CatalogTechFilter>(filters.tech, tech),
              })
            }
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-graphite">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-blue"
      />
      <span>{label}</span>
    </label>
  );
}
