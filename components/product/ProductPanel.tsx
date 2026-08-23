"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  catalogHrefFromFocus,
  peekCatalogFocus,
} from "@/lib/catalogScroll";
import {
  getMatrixSizes,
  partitionQuantitiesBySku,
} from "@/lib/products";
import { useCanvasCaptureStore } from "@/store/useCanvasCaptureStore";
import { useProductStore } from "@/store/useProductStore";
import { useSpecStore } from "@/store/useSpecStore";
import { totalPieces } from "@/types/spec";
import type { Locale } from "@/i18n/routing";
import type { ProductPhotos } from "@/lib/productImages";
import { prefetchImage } from "@/lib/prefetchImages";
import type { Product } from "@/types/product";
import { productName } from "@/types/product";

type ProductPanelProps = {
  product: Product;
  locale: Locale;
  photos?: ProductPhotos;
  fashionSrc?: string | null;
};

export function ProductPanel({
  product,
  locale,
  photos,
  fashionSrc = null,
}: ProductPanelProps) {
  const t = useTranslations("product");
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
  const [fashionActive, setFashionActive] = useState(Boolean(fashionSrc));
  const [catalogHref, setCatalogHref] = useState("/catalog");

  useEffect(() => {
    setCatalogHref(catalogHrefFromFocus(peekCatalogFocus()));
  }, []);

  useEffect(() => {
    initProduct({
      productId: product.id,
      colorways: product.colorways,
      sizes,
    });
  }, [product.id, product.colorways, sizes, initProduct]);

  useEffect(() => {
    setFashionActive(Boolean(fashionSrc));
  }, [product.id, fashionSrc]);

  const pieces = totalPieces(quantities);
  const canAdd = pieces > 0 && colorway != null;

  const previewColorway = useCallback(
    (code: string) => {
      const entry = photos?.byColorway[code];
      if (!entry) return;
      if (entry.front) void prefetchImage(entry.front);
      if (entry.back) void prefetchImage(entry.back);
    },
    [photos],
  );

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
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={catalogHref}
        className="mb-6 inline-flex items-center text-sm text-muted transition-colors hover:text-navy sm:mb-8"
      >
        {t("backToCatalog")}
      </Link>

      <div className="grid gap-8 sm:gap-10 lg:grid-cols-2">
        <div className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <ProductViewer
            productId={product.id}
            model={product.model}
            colorway={colorway}
            colorways={product.colorways}
            onColorwayChange={(code) => {
              setFashionActive(false);
              setColorway(code);
            }}
            alt={name}
            photos={photos}
            fashionSrc={fashionSrc}
            fashionActive={fashionActive}
            onFashionOff={() => setFashionActive(false)}
            onFashionOn={() => setFashionActive(true)}
          />
        </div>

        <div className="min-w-0 space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <p className="font-mono text-2xl tracking-tight text-navy sm:text-3xl">
              {product.id}
            </p>
            <h1 className="break-words text-display-sm normal-case tracking-display">
              {name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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

          <div className="space-y-3">
            <ColorSwatches
              colorways={product.colorways}
              value={colorway}
              fashionSrc={fashionSrc}
              fashionActive={fashionActive}
              onSelectFashion={() => setFashionActive(true)}
              onChange={(code) => {
                setFashionActive(false);
                setColorway(code);
              }}
              onPreview={previewColorway}
            />
          </div>

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

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
    </div>
  );
}
