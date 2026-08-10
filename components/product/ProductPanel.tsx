"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductViewer } from "@/components/canvas/ProductViewer";
import { BrandingPanel } from "@/components/product/BrandingPanel";
import { ColorSwatches } from "@/components/product/ColorSwatches";
import { PriceLevel } from "@/components/product/PriceLevel";
import { SizeMatrix } from "@/components/product/SizeMatrix";
import { SpecTable } from "@/components/product/SpecTable";
import { TechBadges } from "@/components/product/TechBadges";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import {
  getMatrixSizes,
  partitionQuantitiesBySku,
} from "@/lib/products";
import { useCanvasCaptureStore } from "@/store/useCanvasCaptureStore";
import { useProductStore } from "@/store/useProductStore";
import { useSpecStore } from "@/store/useSpecStore";
import { totalPieces } from "@/types/spec";
import type { Locale } from "@/i18n/routing";
import type { Product } from "@/types/product";
import { productName } from "@/types/product";

type ProductPanelProps = {
  product: Product;
  locale: Locale;
};

export function ProductPanel({ product, locale }: ProductPanelProps) {
  const t = useTranslations("product");
  const tNav = useTranslations("nav");
  const name = productName(product, locale);
  const sizes = useMemo(() => getMatrixSizes(product), [product]);

  const colorway = useProductStore((s) => s.colorway);
  const quantities = useProductStore((s) => s.quantities);
  const branding = useProductStore((s) => s.branding);
  const initProduct = useProductStore((s) => s.initProduct);
  const setColorway = useProductStore((s) => s.setColorway);
  const setQuantity = useProductStore((s) => s.setQuantity);
  const applyPreset = useProductStore((s) => s.applyPreset);
  const addItem = useSpecStore((s) => s.addItem);
  const capture = useCanvasCaptureStore((s) => s.capture);

  const [addedFlash, setAddedFlash] = useState(false);

  useEffect(() => {
    initProduct({
      productId: product.id,
      colorways: product.colorways,
      sizes,
    });
  }, [product.id, product.colorways, sizes, initProduct]);

  const pieces = totalPieces(quantities);
  const canAdd = pieces > 0 && colorway != null;

  const handleAdd = () => {
    if (!colorway || !canAdd) return;

    const previewDataUrl = capture(branding.exportWhiteBg) ?? undefined;
    const partitions = partitionQuantitiesBySku(product, quantities);
    for (const part of partitions) {
      addItem({
        productId: part.productId,
        catalogId: product.id,
        name: product.name,
        colorway,
        quantities: part.quantities,
        branding,
        previewDataUrl,
      });
    }

    setAddedFlash(true);
    window.setTimeout(() => setAddedFlash(false), 2000);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-2">
      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <ProductViewer
          model={product.model}
          colorway={colorway}
          alt={name}
        />
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <Link
            href="/catalog"
            className="inline-block font-mono text-xs uppercase tracking-widest text-blue hover:text-navy"
          >
            ← {tNav("catalog")}
          </Link>

          <p className="font-mono text-3xl tracking-tight text-navy">
            {product.id}
          </p>
          <h1 className="text-display-sm normal-case tracking-display">{name}</h1>

          <div className="flex flex-wrap items-center gap-4">
            <PriceLevel level={product.priceLevel} />
            {product.oversizeId ? (
              <span className="border border-navy/20 px-2 py-1 font-mono text-[10px] uppercase text-navy">
                {t("badgeOversize")}
              </span>
            ) : null}
            {product.juniorId ? (
              <span className="border border-navy/20 px-2 py-1 font-mono text-[10px] uppercase text-navy">
                {t("badgeJunior")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="section-rule" />

        <TechBadges tech={product.tech} />

        <ColorSwatches
          colorways={product.colorways}
          value={colorway}
          onChange={setColorway}
        />

        <SizeMatrix
          sizes={sizes}
          quantities={quantities}
          moq={product.moq}
          onChange={setQuantity}
          onApplyPreset={(preset) => applyPreset(preset, sizes)}
        />

        {product.brandable && product.brandingZones.length > 0 ? (
          <BrandingPanel zones={product.brandingZones} />
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={handleAdd} disabled={!canAdd}>
            {t("addToSpec")}
          </Button>
          {addedFlash ? (
            <span className="text-sm text-success">{t("added")}</span>
          ) : null}
        </div>

        <div className="section-rule" />

        <SpecTable product={product} />
      </div>
    </div>
  );
}
