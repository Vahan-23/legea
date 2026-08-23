"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSpecStore } from "@/store/useSpecStore";

/** Кнопка спецификации в шапке. */
export function SpecNavButton() {
  const t = useTranslations("spec");
  const items = useSpecStore((s) => s.items);
  const setDrawerOpen = useSpecStore((s) => s.setDrawerOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const positions = hydrated ? items.length : 0;
  const pieces = hydrated
    ? items.reduce(
        (sum, item) =>
          sum + Object.values(item.quantities).reduce((a, b) => a + b, 0),
        0,
      )
    : 0;

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="relative inline-flex items-center gap-2 border border-navy/20 bg-white px-3 py-2 font-sans text-xs font-medium uppercase tracking-wide text-navy transition-colors hover:border-blue hover:text-blue md:border-transparent md:bg-transparent md:px-0 md:py-0 md:text-left md:normal-case md:tracking-wide md:hover:bg-transparent"
      aria-label={t("navCounter", { count: positions })}
    >
      <span className="md:block">{t("title")}</span>
      {positions > 0 ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1 font-mono text-[10px] text-white md:hidden">
          {positions}
        </span>
      ) : null}
      <span className="hidden md:block">
        {t("navCounter", { count: positions })}
      </span>
      {pieces > 0 ? (
        <span className="hidden font-mono text-[10px] normal-case tracking-normal text-muted md:block">
          {t("navPieces", { count: pieces })}
        </span>
      ) : null}
    </button>
  );
}
