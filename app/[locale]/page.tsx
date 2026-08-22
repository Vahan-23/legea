import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HomeCategories } from "@/components/home/HomeCategories";
import { HomeClients } from "@/components/home/HomeClients";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeQuickLead } from "@/components/home/HomeQuickLead";
import { HomeWorkflow } from "@/components/home/HomeWorkflow";
import { StatsStrip } from "@/components/home/StatsStrip";
import { company } from "@/data/company";
import { getCatalogStats } from "@/lib/catalogProducts.server";
import { isLocale } from "@/i18n/routing";

type HomePageProps = {
  params: { locale: string };
};

export default async function HomePage({ params }: HomePageProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }
  setRequestLocale(params.locale);

  const stats = getCatalogStats();

  return (
    <>
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
