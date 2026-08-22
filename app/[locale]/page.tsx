import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HomeCategories } from "@/components/home/HomeCategories";
import { HomeClients } from "@/components/home/HomeClients";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeQuickLead } from "@/components/home/HomeQuickLead";
import { HomeWorkflow } from "@/components/home/HomeWorkflow";
import { StatsStrip } from "@/components/home/StatsStrip";
import { JsonLd } from "@/components/seo/JsonLd";
import { company } from "@/data/company";
import { getCatalogStats } from "@/lib/catalogProducts.server";
import { isLocale, type Locale } from "@/i18n/routing";
import { organizationJsonLd, pageMetadata } from "@/lib/seo";

type HomePageProps = {
  params: { locale: string };
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = await getTranslations({
    locale: params.locale,
    namespace: "meta",
  });
  return pageMetadata({
    locale: params.locale as Locale,
    path: "",
    title: t("homeTitle"),
    description: t("homeDescription"),
  });
}

export default async function HomePage({ params }: HomePageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }
  setRequestLocale(params.locale);

  const stats = getCatalogStats();

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <HomeHero />
      <StatsStrip
        productCount={stats.productCount}
        colorwayCount={stats.colorwayCount}
        deliveryDays={company.stats.deliveryDays}
        moq={company.stats.moq}
      />
      <HomeCategories />
      {/* Pinned-технологии — отложено (decisions 14.1) */}
      <HomeWorkflow />
      <HomeClients />
      <HomeQuickLead />
      <div id="analytics-slot" hidden aria-hidden="true" />
    </>
  );
}
