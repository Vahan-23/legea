/**
 * Режим отображения цен.
 * Реализован только "hidden". Остальные режимы — задел без мёртвого UI.
 */
export type PricingMode = "hidden" | "tiers" | "public";

export const PRICING_MODE: PricingMode = "hidden";

export function assertPricingModeSupported(mode: PricingMode): void {
  if (mode !== "hidden") {
    throw new Error("not implemented");
  }
}
