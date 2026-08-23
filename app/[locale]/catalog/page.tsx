import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getCatalogPageData } from "@/lib/catalogProducts.server";
import { isLocale, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

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
  return pageMetadata({
    locale: params.locale as Locale,
    path: "/catalog",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function CatalogPage({ params }: PageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  setRequestLocale(params.locale);
  const t = await getTranslations("catalog");
  const { products, cardPhotos, fashionModels, productIdsWith3d } =
    getCatalogPageData();

  return (
    <div className="hex-bg-muted min-h-screen">
      <header className="border-b border-blue bg-white">
        <div className="px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
          <h1 className="text-display-sm text-navy">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t("subtitle")}</p>
        </div>
        <div className="section-rule" />
      </header>

      {/* Suspense: useSearchParams в CatalogView */}
      <Suspense
        fallback={
          <div className="px-4 py-16 font-mono text-xs uppercase tracking-widest text-muted sm:px-6 lg:px-8">
            …
          </div>
        }
      >
        <CatalogView
          products={products}
          cardPhotos={cardPhotos}
          fashionModels={fashionModels}
          productIdsWith3d={productIdsWith3d}
        />
      </Suspense>
    </div>
  );
}
