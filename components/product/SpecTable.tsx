"use client";

import { useTranslations } from "next-intl";
import type { Product } from "@/types/product";

type SpecTableProps = {
  product: Product;
};

export function SpecTable({ product }: SpecTableProps) {
  const t = useTranslations("product");
  const tCatalog = useTranslations("catalog");

  const rows: Array<{ label: string; value: string }> = [
    {
      label: t("composition"),
      value: product.composition,
    },
    {
      label: tCatalog("gsm"),
      value:
        product.gsm != null
          ? tCatalog("gsmValue", { gsm: product.gsm })
          : tCatalog("gsmUnknown"),
    },
    {
      label: tCatalog("type"),
      value: tCatalog(`types.${product.type}`),
    },
    {
      label: tCatalog("sport"),
      value: tCatalog(`categories.${product.category}`),
    },
    {
      label: t("moq"),
      value: String(product.moq),
    },
  ];

  if (product.dimensions) {
    rows.push({ label: t("dimensions"), value: product.dimensions });
  }

  if (product.components) {
    rows.push({
      label: t("kitComponents"),
      value: product.components.join(" + "),
    });
  }

  return (
    <div className="space-y-4">
      <dl>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between gap-6 border-b border-navy/10 py-2.5 text-sm"
          >
            <dt className="text-muted">{row.label}</dt>
            <dd className="max-w-[60%] text-right text-graphite">{row.value}</dd>
          </div>
        ))}
      </dl>

      {product.features.length > 0 ? (
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted">
            {t("features")}
          </p>
          <ul className="space-y-1 text-sm text-graphite">
            {product.features.map((feature) => (
              <li key={feature} className="border-l-2 border-blue pl-3">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
