"use client";

import { useTranslations } from "next-intl";
import { PRICING_MODE, assertPricingModeSupported } from "@/config/pricing";

type PriceLevelProps = {
  level: 1 | 2 | 3;
};

/**
 * Уровень цены в категории (●●○). Реальный прайс скрыт в режиме hidden.
 */
export function PriceLevel({ level }: PriceLevelProps) {
  assertPricingModeSupported(PRICING_MODE);
  const t = useTranslations("product");

  return (
    <div className="inline-flex items-center gap-2" title={t("priceLevelTooltip")}>
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {t("priceLevel")}
      </span>
      <span className="flex gap-1" aria-label={`${level} / 3`}>
        {[1, 2, 3].map((dot) => (
          <span
            key={dot}
            className={
              dot <= level
                ? "h-2.5 w-2.5 rounded-full bg-navy"
                : "h-2.5 w-2.5 rounded-full border border-navy/40"
            }
          />
        ))}
      </span>
    </div>
  );
}
