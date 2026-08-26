"use client";

import { useTranslations } from "next-intl";
import { QuickLeadForm } from "@/components/contact/QuickLeadForm";
import { company } from "@/data/company";

export function HomeQuickLead() {
  const t = useTranslations("home.lead");

  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2">
        <div>
          <h2 className="text-display-sm text-navy">{t("title")}</h2>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
          <div className="mt-8 space-y-2 text-sm text-graphite">
            <p>{company.officeAddress}</p>
            {company.phones.map((phone) => (
              <p key={phone}>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-blue">
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
          </div>
          <a
            href={company.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 block aspect-[16/10] bg-off-white"
          >
            {/* TODO: заменить статичной картой */}
            <div className="flex h-full items-center justify-center border border-navy/10 font-mono text-xs uppercase tracking-widest text-muted">
              {t("map")}
            </div>
          </a>
        </div>

        <div className="border border-navy/15 p-6">
          <QuickLeadForm source="Главная" />
        </div>
      </div>
    </section>
  );
}
