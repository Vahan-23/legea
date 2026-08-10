"use client";

import { useLocale, useTranslations } from "next-intl";
import { ColorDots } from "@/components/catalog/ColorDots";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { useSpecStore } from "@/store/useSpecStore";
import { totalPieces } from "@/types/spec";
import type { Locale } from "@/i18n/routing";

/** Черновик страницы /spec — форма и PDF на этапе 7. */
export function SpecSummary() {
  const t = useTranslations("spec");
  const locale = useLocale() as Locale;
  const items = useSpecStore((s) => s.items);
  const removeItem = useSpecStore((s) => s.removeItem);
  const updateQuantities = useSpecStore((s) => s.updateQuantities);
  const updateComment = useSpecStore((s) => s.updateComment);
  const clear = useSpecStore((s) => s.clear);

  if (items.length === 0) {
    return (
      <div className="border border-blue/20 bg-off-white px-6 py-16 text-center">
        <p className="text-lg text-graphite">{t("empty")}</p>
        <div className="mt-6">
          <Button href="/catalog">{t("backToCatalog")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-4">
        {items.map((item) => {
          const sizes = Object.keys(item.quantities);
          return (
            <li key={item.key} className="border border-navy/15 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="font-mono text-xl text-navy">{item.productId}</p>
                  <p className="text-graphite">
                    {item.name[locale] || item.name.ru}
                  </p>
                  <div className="flex items-center gap-3">
                    <ColorDots colorways={[item.colorway]} limit={1} />
                    <span className="font-mono text-xs text-muted">
                      {item.colorway}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/catalog/${item.catalogId ?? item.productId}`}
                    className="text-xs uppercase tracking-wide text-blue hover:text-navy"
                  >
                    {t("editOnProduct")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-xs uppercase text-muted hover:text-navy"
                  >
                    {t("remove")}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {sizes.map((size) => (
                  <label key={size} className="text-center text-xs text-muted">
                    <span className="mb-1 block font-mono">{size}</span>
                    <input
                      type="number"
                      min={0}
                      value={item.quantities[size] ?? 0}
                      onChange={(event) => {
                        const next = {
                          ...item.quantities,
                          [size]: Math.max(
                            0,
                            Number.parseInt(event.target.value, 10) || 0,
                          ),
                        };
                        updateQuantities(item.key, next);
                      }}
                      className="w-14 border border-navy/20 px-1 py-1.5 text-center font-mono text-sm outline-none focus:border-blue"
                    />
                  </label>
                ))}
              </div>

              <p className="mt-3 font-mono text-sm text-graphite">
                {totalPieces(item.quantities)} {t("pcs")}
              </p>

              {item.branding?.method || item.branding?.zones?.length ? (
                <p className="mt-2 text-xs text-muted">
                  {item.branding.method ? `${item.branding.method} · ` : null}
                  {item.branding.zones?.join(", ")}
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted">{t("pdf.noBranding")}</p>
              )}

              {item.previewDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewDataUrl}
                  alt=""
                  className="mt-3 h-24 w-24 border border-navy/10 object-contain"
                />
              ) : null}

              <label className="mt-3 block text-xs text-muted">
                <span className="mb-1 block">{t("itemComment")}</span>
                <input
                  type="text"
                  value={item.comment}
                  onChange={(event) =>
                    updateComment(item.key, event.target.value)
                  }
                  className="field-input"
                />
              </label>
            </li>
          );
        })}
      </ul>

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
