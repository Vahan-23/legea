import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getFashionModelMap, resolveFashionForProduct } from "@/lib/fashionModels.server";
import { getProductIdsWithGlb } from "@/lib/models.server";
import { getAllProductPhotos } from "@/lib/productImages.server";
import { getAllProducts } from "@/lib/products";
import { isLocale } from "@/i18n/routing";

export const revalidate = 3600;

type PageProps = {
  params: { locale: string };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = await getTranslations({
    locale: params.locale,
    namespace: "catalog",
  });
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function CatalogPage({ params }: PageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  setRequestLocale(params.locale);
  const t = await getTranslations("catalog");
  const cardPhotos = getAllProductPhotos();
  const fashionRaw = getFashionModelMap();
  const productIdsWith3d = getProductIdsWithGlb();
  const products = getAllProducts().filter((product) => {
    if (!productIdsWith3d.has(product.id)) return false;
    const photos = cardPhotos[product.id];
    return Boolean(photos?.front);
  });

  // Variant fashion (TXM…BP… / JP…) → родительская карточка в каталоге
  const fashionModels: Record<string, string> = { ...fashionRaw };
  for (const product of products) {
    const resolved = resolveFashionForProduct(product);
    if (resolved) fashionModels[product.id] = resolved;
  }

  return (
    <div className="hex-bg-muted min-h-screen">
      <header className="border-b border-blue bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-display-sm text-navy">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <div className="section-rule" />
      </header>

      {/* Suspense: useSearchParams в CatalogView */}
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-6 py-16 font-mono text-sm text-muted">
            …
          </div>
        }
      >
        <CatalogView
          products={products}
          cardPhotos={cardPhotos}
          fashionModels={fashionModels}
          productIdsWith3d={Array.from(productIdsWith3d)}
        />
      </Suspense>
    </div>
  );
}
