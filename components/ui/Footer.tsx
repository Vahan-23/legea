import { getTranslations, setRequestLocale } from "next-intl/server";
import { company } from "@/data/company";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";

type FooterProps = {
  locale: string;
};

export async function Footer({ locale }: FooterProps) {
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="hex-bg-muted mt-auto border-t border-blue">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <Link href="/" className="inline-block" aria-label="Legea">
            <BrandLogo height={44} className="h-11 w-auto object-contain" />
          </Link>
          <p className="mt-2 text-sm text-muted">{t("distributor")}</p>
          {/* TODO: заменить реквизиты */}
          <p className="mt-4 font-mono text-xs text-muted">
            {company.legalName}
          </p>
        </div>
        <div className="space-y-2 text-sm text-graphite">
          {/* TODO: заменить контакты */}
          <p>{company.officeAddress}</p>
          {company.phones.map((phone) => (
            <p key={phone}>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="hover:text-blue"
              >
                {phone}
              </a>
            </p>
          ))}
          <p>
            <a
              href={`mailto:${company.publicEmail}`}
              className="hover:text-blue"
            >
              {company.publicEmail}
            </a>
          </p>
          {company.telegram ? (
            <p>
              <a
                href={company.telegram}
                className="hover:text-blue"
                target="_blank"
                rel="noreferrer"
              >
                Telegram
              </a>
            </p>
          ) : null}
          {company.whatsapp ? (
            <p>
              <a
                href={company.whatsapp}
                className="hover:text-blue"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </p>
          ) : null}
        </div>
        <div className="space-y-2 text-sm">
          <Link href="/privacy" className="block text-graphite hover:text-blue">
            {tNav("privacy")}
          </Link>
          <Link href="/contacts" className="block text-graphite hover:text-blue">
            {tNav("contacts")}
          </Link>
        </div>
      </div>
      <div className="section-rule" />
      <p className="px-6 py-4 text-center text-xs text-muted">
        © {year} {company.legalName}. {t("rights")}
      </p>
    </footer>
  );
}
