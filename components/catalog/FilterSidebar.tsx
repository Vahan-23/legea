"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { colorMap, type ColorCodeKey } from "@/data/colors";
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
                    ? "h-7 w-7 rounded-full ring-2 ring-blue ring-offset-2"
                    : "h-7 w-7 rounded-full border border-graphite/20"
                }
                style={{ backgroundColor: hex }}
              />
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
