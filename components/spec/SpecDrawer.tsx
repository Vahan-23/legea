"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { SpecItemList } from "@/components/spec/SpecItemList";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { useSpecStore } from "@/store/useSpecStore";
import { totalPieces } from "@/types/spec";

const ContactForm = dynamic(
  () =>
    import("@/components/spec/ContactForm").then((m) => ({
      default: m.ContactForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4 py-2">
        <div className="h-5 w-40 rounded bg-navy/10" />
        <div className="h-11 rounded bg-navy/10" />
        <div className="h-11 rounded bg-navy/10" />
        <div className="h-11 rounded bg-navy/10" />
      </div>
    ),
  },
);

type DrawerView = "list" | "checkout" | "success";

export function SpecDrawer() {
  const t = useTranslations("spec");
  const open = useSpecStore((s) => s.drawerOpen);
  const items = useSpecStore((s) => s.items);
  const setDrawerOpen = useSpecStore((s) => s.setDrawerOpen);
  const clear = useSpecStore((s) => s.clear);

  const [view, setView] = useState<DrawerView>("list");
  const [successNumber, setSuccessNumber] = useState<string | null>(null);

  const close = useCallback(() => {
    setDrawerOpen(false);
    window.setTimeout(() => {
      setView("list");
      setSuccessNumber(null);
    }, 200);
  }, [setDrawerOpen]);

  useEffect(() => {
    if (open && items.length > 0) {
      void import("@/components/spec/ContactForm");
    }
  }, [open, items.length]);

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
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const pieces = items.reduce(
    (sum, item) => sum + totalPieces(item.quantities),
    0,
  );

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40"
        aria-label={t("closeDrawer")}
        onClick={close}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="spec-drawer-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-full md:max-w-md md:rounded-none"
      >
        <div className="flex shrink-0 justify-center pt-3 md:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-navy/20" />
        </div>

        <header className="flex shrink-0 items-start justify-between border-b border-navy/10 px-4 pb-3 pt-2 md:px-5 md:py-4">
          <div className="min-w-0 pr-4">
            {view === "checkout" ? (
              <button
                type="button"
                onClick={() => setView("list")}
                className="font-mono text-xs uppercase tracking-widest text-blue hover:text-navy"
              >
                ← {t("title")}
              </button>
            ) : (
              <h2
                id="spec-drawer-title"
                className="font-display text-lg uppercase tracking-display text-navy md:text-xl"
              >
                {t("title")}
              </h2>
            )}
            {view === "list" && items.length > 0 ? (
              <p className="mt-1 font-mono text-xs text-muted">
                {t("summary", { positions: items.length, pieces })}
              </p>
            ) : view === "checkout" ? (
              <p className="mt-1 text-sm text-muted">{t("form.title")}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-xl text-muted hover:text-navy"
            aria-label={t("closeDrawer")}
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5">
          {view === "success" ? (
            <div className="py-8 text-center">
              <p className="font-display text-xl uppercase tracking-display text-navy">
                {t("success.title")}
              </p>
              <p className="mt-3 text-sm text-graphite">{t("success.body")}</p>
              <p className="mt-4 font-mono text-lg text-blue">{successNumber}</p>
            </div>
          ) : view === "checkout" ? (
            <ContactForm
              compact
              onSuccess={(number) => {
                setSuccessNumber(number);
                setView("success");
              }}
            />
          ) : items.length === 0 ? (
            <div className="space-y-6 py-8 text-center">
              <p className="text-base text-graphite">{t("empty")}</p>
              <Link
                href="/catalog"
                onClick={close}
                className="inline-flex w-full items-center justify-center bg-navy px-6 py-3.5 font-sans text-sm font-medium uppercase tracking-wide text-white hover:bg-blue"
              >
                {t("openCatalog")}
              </Link>
            </div>
          ) : (
            <SpecItemList onEditClick={close} />
          )}
        </div>

        {view === "list" && items.length > 0 ? (
          <footer className="shrink-0 space-y-2 border-t border-navy/10 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:px-5">
            <Button
              type="button"
              className="w-full py-3.5 text-sm"
              onClick={() => setView("checkout")}
            >
              {t("checkout")} · {pieces} {t("pcs")}
            </Button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t("clearConfirm"))) clear();
              }}
              className="w-full py-2 text-center text-xs uppercase tracking-wide text-muted hover:text-navy"
            >
              {t("clear")}
            </button>
          </footer>
        ) : null}

        {view === "success" ? (
          <footer className="shrink-0 border-t border-navy/10 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:px-5">
            <Button type="button" className="w-full py-3.5" onClick={close}>
              {t("closeDrawer")}
            </Button>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
