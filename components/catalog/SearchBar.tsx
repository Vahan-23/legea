"use client";

import { useTranslations } from "next-intl";
import type { CatalogFilters } from "@/types/product";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  const t = useTranslations("catalog");

  return (
    <label className="block w-full max-w-md">
      <span className="sr-only">{t("searchPlaceholder")}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full border border-navy/20 bg-white px-4 py-2.5 font-sans text-sm text-graphite outline-none transition-colors placeholder:text-muted focus:border-blue"
      />
    </label>
  );
}

type SortSelectProps = {
  value: CatalogFilters["sort"];
  onChange: (value: CatalogFilters["sort"]) => void;
};

export function SortSelect({ value, onChange }: SortSelectProps) {
  const t = useTranslations("catalog");

  return (
    <label className="flex w-full min-w-0 items-center justify-end gap-2 text-sm text-muted sm:w-auto sm:flex-none">
      <span className="shrink-0">{t("sort")}</span>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value === "name" ? "name" : "id")
        }
        className="min-w-0 flex-1 border border-navy/20 bg-white px-3 py-2.5 text-graphite outline-none focus:border-blue sm:max-w-[11rem] sm:flex-none"
      >
        <option value="id">{t("sortId")}</option>
        <option value="name">{t("sortName")}</option>
      </select>
    </label>
  );
}
