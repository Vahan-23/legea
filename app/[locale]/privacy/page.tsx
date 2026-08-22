import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { StaticPage } from "@/components/ui/StaticPage";
import { isLocale, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

type PageProps = { params: { locale: string } };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = await getTranslations({
    locale: params.locale,
    namespace: "meta",
  });
  return pageMetadata({
    locale: params.locale as Locale,
    path: "/privacy",
    title: t("privacyTitle"),
    description: t("privacyDescription"),
  });
}

export default async function PrivacyPage({ params }: PageProps) {
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const t = await getTranslations("pages.privacy");
  return <StaticPage title={t("title")} lead={t("lead")} body={t("body")} />;
}
