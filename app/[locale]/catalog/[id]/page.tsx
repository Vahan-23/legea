import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductPanel } from "@/components/product/ProductPanel";
import {
  getVisibleCatalogProducts,
  isProductVisibleInCatalog,
} from "@/lib/catalogProducts.server";
import { resolveFashionForProduct } from "@/lib/fashionModels.server";
import { getProductIdsWithGlb } from "@/lib/models.server";
import { getAllProductPhotos, getProductPhotos } from "@/lib/productImages.server";
import { getProductById } from "@/lib/products";
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
  const name = productName(product, params.locale);
  const photos = getProductPhotos(product.id);
  return {
    title: `${product.id} · ${name}`,
    description: product.composition,
    openGraph: photos.front
      ? { images: [{ url: photos.front }] }
      : undefined,
  };
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

  const t = await getTranslations("product");
  const fashionSrc = resolveFashionForProduct(product);

  return (
    <div className="hex-bg min-h-screen overflow-x-hidden">
      <ProductPanel
        product={product}
        locale={params.locale as Locale}
        photos={photos}
        fashionSrc={fashionSrc}
      />
      <p className="sr-only">{t("pageLabel")}</p>
    </div>
  );
}
