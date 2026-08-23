"use client";

import { useTranslations } from "next-intl";
import { SpecItemList } from "@/components/spec/SpecItemList";
import { Link } from "@/i18n/navigation";
import { useSpecStore } from "@/store/useSpecStore";

/** Список позиций на странице /spec. */
export function SpecSummary() {
  const t = useTranslations("spec");
  const items = useSpecStore((s) => s.items);
  const clear = useSpecStore((s) => s.clear);

  if (items.length === 0) {
    return (
      <div className="border border-blue/20 bg-off-white px-6 py-16 text-center">
        <p className="text-lg text-graphite">{t("empty")}</p>
        <Link
          href="/catalog"
          className="mt-6 inline-block text-sm uppercase tracking-wide text-blue hover:text-navy"
        >
          {t("openCatalog")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SpecItemList />

      <button
        type="button"
        onClick={() => {
          if (window.confirm(t("clearConfirm"))) clear();
        }}
        className="text-xs uppercase tracking-wide text-muted hover:text-navy"
      >
        {t("clear")}
      </button>
    </div>
  );
}
