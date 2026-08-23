"use client";

import { useLocale, useTranslations } from "next-intl";
import { ColorDots } from "@/components/catalog/ColorDots";
import { Link } from "@/i18n/navigation";
import { useSpecStore } from "@/store/useSpecStore";
import { totalPieces } from "@/types/spec";
import type { Locale } from "@/i18n/routing";

type SpecItemListProps = {
  onEditClick?: () => void;
};

/** Список позиций спецификации — drawer и страница /spec. */
export function SpecItemList({ onEditClick }: SpecItemListProps) {
  const t = useTranslations("spec");
  const locale = useLocale() as Locale;
  const items = useSpecStore((s) => s.items);
  const removeItem = useSpecStore((s) => s.removeItem);
  const updateQuantities = useSpecStore((s) => s.updateQuantities);

  if (items.length === 0) return null;

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const sizes = Object.keys(item.quantities);
        const pieces = totalPieces(item.quantities);

        return (
          <li
            key={item.key}
            className="border border-navy/15 bg-white p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-base text-navy sm:text-lg">
                  {item.productId}
                </p>
                <p className="text-sm text-graphite">
                  {item.name[locale] || item.name.ru}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                className="shrink-0 rounded border border-navy/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted hover:border-blue hover:text-blue"
                aria-label={t("remove")}
              >
                {t("remove")}
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <ColorDots colorways={[item.colorway]} limit={1} />
              <span className="font-mono text-xs text-muted">{item.colorway}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((size) => (
                <label
                  key={size}
                  className="text-center text-xs text-muted"
                >
                  <span className="mb-1 block font-mono text-[11px]">{size}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
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
                    className="w-12 border border-navy/20 px-1 py-2 text-center font-mono text-sm outline-none focus:border-blue sm:w-14"
                  />
                </label>
              ))}
            </div>

            <p className="mt-3 font-mono text-sm text-graphite">
              {pieces} {t("pcs")}
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
                className="mt-3 h-20 w-20 border border-navy/10 object-contain"
              />
            ) : null}

            <Link
              href={`/catalog/${item.catalogId ?? item.productId}`}
              onClick={onEditClick}
              className="mt-3 inline-block text-xs uppercase tracking-wide text-blue hover:text-navy"
            >
              {t("editOnProduct")} →
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
