"use client";

import { useLocale, useTranslations } from "next-intl";
import { ColorDots } from "@/components/catalog/ColorDots";
import { Button } from "@/components/ui/Button";
import { useSpecStore } from "@/store/useSpecStore";
import { totalPieces } from "@/types/spec";
import type { Locale } from "@/i18n/routing";

export function SpecDrawer() {
  const t = useTranslations("spec");
  const locale = useLocale() as Locale;
  const open = useSpecStore((s) => s.drawerOpen);
  const items = useSpecStore((s) => s.items);
  const setDrawerOpen = useSpecStore((s) => s.setDrawerOpen);
  const removeItem = useSpecStore((s) => s.removeItem);
  const clear = useSpecStore((s) => s.clear);

  if (!open) return null;

  const pieces = items.reduce(
    (sum, item) => sum + totalPieces(item.quantities),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-graphite/40"
        aria-label={t("closeDrawer")}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-blue bg-white">
        <div className="flex items-center justify-between border-b border-blue px-5 py-4">
          <div>
            <p className="font-display text-lg uppercase tracking-display text-navy">
              {t("title")}
            </p>
            <p className="font-mono text-xs text-muted">
              {t("summary", { positions: items.length, pieces })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="font-mono text-sm text-muted hover:text-navy"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted">{t("empty")}</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.key} className="border border-navy/15 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm text-navy">
                        {item.productId}
                      </p>
                      <p className="text-sm text-graphite">
                        {item.name[locale] || item.name.ru}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {item.colorway} · {totalPieces(item.quantities)}{" "}
                        {t("pcs")}
                      </p>
                      <div className="mt-2">
                        <ColorDots colorways={[item.colorway]} limit={1} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-xs uppercase text-muted hover:text-blue"
                    >
                      {t("remove")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-blue px-5 py-4">
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("clearConfirm"))) clear();
              }}
              className="text-xs uppercase tracking-wide text-muted hover:text-navy"
            >
              {t("clear")}
            </button>
          ) : null}
          <div
            onClick={() => setDrawerOpen(false)}
            onKeyDown={undefined}
            role="presentation"
          >
            <Button href="/spec" className="w-full">
              {t("checkout")}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
