"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSpecStore } from "@/store/useSpecStore";

/** Счётчик спецификации в шапке (позиции + штуки). */
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
      className="text-left text-sm uppercase tracking-wide text-graphite hover:text-blue"
    >
      <span className="block">
        {t("navCounter", { count: positions })}
      </span>
      {pieces > 0 ? (
        <span className="block font-mono text-[10px] normal-case tracking-normal text-muted">
          {t("navPieces", { count: pieces })}
        </span>
      ) : null}
    </button>
  );
}
