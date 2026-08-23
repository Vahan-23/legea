"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSpecStore } from "@/store/useSpecStore";

function CartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 7h15l-1.4 8.4a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.6L5.2 4H3" />
      <circle cx="9.5" cy="20" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Корзина в шапке — только иконка + бейдж количества. */
export function SpecNavButton() {
  const t = useTranslations("spec");
  const items = useSpecStore((s) => s.items);
  const setDrawerOpen = useSpecStore((s) => s.setDrawerOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

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
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-navy transition-colors hover:bg-off-white hover:text-blue"
      aria-label={
        pieces > 0
          ? `${t("title")}, ${t("navPieces", { count: pieces })}`
          : t("title")
      }
    >
      <CartIcon className="h-6 w-6" />
      {pieces > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue px-1 font-mono text-[10px] font-medium leading-none text-white shadow-sm ring-2 ring-white">
          {pieces > 99 ? "99+" : pieces}
        </span>
      ) : null}
    </button>
  );
}
