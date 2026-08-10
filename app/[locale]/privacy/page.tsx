import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { StaticPage } from "@/components/ui/StaticPage";
import { isLocale } from "@/i18n/routing";

type PageProps = { params: { locale: string } };

export default async function PrivacyPage({ params }: PageProps) {
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const t = await getTranslations("pages.privacy");
  return <StaticPage title={t("title")} lead={t("lead")} body={t("body")} />;
}
