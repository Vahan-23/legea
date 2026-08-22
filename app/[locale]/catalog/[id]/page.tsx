import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductPanel } from "@/components/product/ProductPanel";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getVisibleCatalogProducts,
  isProductVisibleInCatalog,
} from "@/lib/catalogProducts.server";
import { resolveFashionForProduct } from "@/lib/fashionModels.server";
import { getProductIdsWithGlb } from "@/lib/models.server";
import { getAllProductPhotos } from "@/lib/productImages.server";
import { getProductById } from "@/lib/products";
import { absoluteUrl, pageMetadata, productJsonLd, getSiteUrl } from "@/lib/seo";
import { isLocale, type Locale } from "@/i18n/routing";
import { productName } from "@/types/product";

export const revalidate = 3600;

type PageProps = {
  params: { locale: string; id: string };
};

export function generateStaticParams() {
  const products = getVisibleCatalogProducts();
  const locales = ["ru", "hy", "en"] as const;
  return locales.flatMap((locale) =>
    products.map((product) => ({ locale, id: product.id })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const product = getProductById(params.id);
  if (!product) return {};

  const locale = params.locale as Locale;
  const name = productName(product, locale);
  const tCat = await getTranslations({
    locale,
    namespace: "catalog",
  });
  const categoryLabel = tCat(`categories.${product.category}`);
  const description = [name, categoryLabel, product.composition]
    .filter(Boolean)
    .join(" — ");

  return pageMetadata({
    locale,
    path: `/catalog/${product.id}`,
    title: `${product.id} · ${name}`,
    description,
  });
}

export default async function ProductPage({ params }: PageProps) {
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);

  const product = getProductById(params.id);
  if (!product) notFound();

  const photos = getAllProductPhotos()[product.id];
  const with3d = getProductIdsWithGlb();
  if (!isProductVisibleInCatalog(product, photos, with3d)) {
    notFound();
  }

  const locale = params.locale as Locale;
  const t = await getTranslations("product");
  const tCat = await getTranslations("catalog");
  const fashionSrc = resolveFashionForProduct(product);
  const name = productName(product, locale);
  const site = getSiteUrl();

  const imageUrls = [
    photos?.front,
    photos?.back,
    fashionSrc,
  ]
    .filter((src): src is string => Boolean(src))
    .map((src) => (src.startsWith("http") ? src : `${site}${src}`));

  return (
    <div className="hex-bg min-h-screen overflow-x-hidden">
      <JsonLd
        data={productJsonLd({
          name,
          sku: product.id,
          description: product.composition || name,
          image: imageUrls,
          category: tCat(`categories.${product.category}`),
          url: absoluteUrl(locale, `/catalog/${product.id}`),
        })}
      />
      <ProductPanel
        product={product}
        locale={locale}
        photos={photos}
        fashionSrc={fashionSrc}
      />
      <p className="sr-only">{t("pageLabel")}</p>
    </div>
  );
}
