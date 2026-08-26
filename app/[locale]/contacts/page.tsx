import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { QuickLeadForm } from "@/components/contact/QuickLeadForm";
import { company } from "@/data/company";
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
    path: "/contacts",
    title: t("contactsTitle"),
    description: t("contactsDescription"),
  });
}

export default async function ContactsPage({ params }: PageProps) {
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const t = await getTranslations("pages.contacts");
  const tLead = await getTranslations("home.lead");
  const paragraphs = t("body").split("\n").filter(Boolean);

  return (
    <div className="hex-bg-muted min-h-screen">
      <header className="border-b border-blue bg-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-display-sm text-navy">{t("title")}</h1>
          <p className="mt-4 text-lg text-muted">{t("lead")}</p>
        </div>
        <div className="section-rule" />
      </header>
      <div className="mx-auto grid max-w-3xl gap-8 px-6 py-12 lg:max-w-6xl lg:grid-cols-2 lg:gap-12">
        <div className="space-y-8">
          <div className="space-y-2 text-graphite">
            <p>{company.legalName}</p>
            <p>{company.officeAddress}</p>
            {company.phones.map((phone) => (
              <p key={phone}>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-blue">
                  {phone}
                </a>
              </p>
            ))}
            <p>
              <a href={`mailto:${company.publicEmail}`} className="hover:text-blue">
                {company.publicEmail}
              </a>
            </p>
          </div>
          <a
            href={company.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex aspect-[16/9] items-center justify-center border border-navy/10 bg-off-white font-mono text-xs uppercase tracking-widest text-muted"
          >
            {/* TODO: статичная карта */}
            {t("map")}
          </a>
          <div className="space-y-4 text-graphite">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="border border-navy/15 bg-white p-6">
          <h2 className="font-display text-lg uppercase tracking-display text-navy">
            {tLead("title")}
          </h2>
          <p className="mt-2 text-sm text-muted">{tLead("subtitle")}</p>
          <div className="mt-6">
            <QuickLeadForm source="Контакты" />
          </div>
        </div>
      </div>
    </div>
  );
}
