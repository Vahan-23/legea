"use client";

import { useTranslations } from "next-intl";

const STEP_KEYS = [
  "specification",
  "sampleAndMockup",
  "production",
  "delivery",
] as const;

export function HomeWorkflow() {
  const t = useTranslations("home.workflow");

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-display-sm text-navy">{t("title")}</h2>
        <p className="mt-3 max-w-xl text-muted">{t("subtitle")}</p>
        <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {STEP_KEYS.map((key, index) => (
            <li key={key} className="border-t-2 border-blue pt-6">
              <p className="font-mono text-sm text-blue">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-xl uppercase tracking-display text-navy">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {t(`steps.${key}.text`)}
              </p>
              <p className="mt-4 font-mono text-xs uppercase tracking-widest text-graphite">
                {/* Сроки дублируют company.leadTimes.workflow — TODO синхронизировать */}
                {t(`steps.${key}.duration`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
      <div className="section-rule" />
    </section>
  );
}
