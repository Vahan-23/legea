import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SpecCheckout } from "@/components/spec/SpecCheckout";
import { isLocale } from "@/i18n/routing";

type PageProps = {
  params: { locale: string };
};

export default async function SpecPage({ params }: PageProps) {
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const t = await getTranslations("spec");

  return (
    <div className="hex-bg-muted min-h-screen">
      <header className="border-b border-blue bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h1 className="text-display-sm text-navy">{t("pageTitle")}</h1>
          <p className="mt-3 max-w-2xl text-muted">{t("pageSubtitle")}</p>
        </div>
        <div className="section-rule" />
      </header>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <SpecCheckout />
      </div>
    </div>
  );
}
