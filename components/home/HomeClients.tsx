"use client";

import { useTranslations } from "next-intl";

export function HomeClients() {
  const t = useTranslations("home.clients");

  return (
    <section className="hex-bg-muted">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-display-sm text-navy">{t("title")}</h2>
        <p className="mt-3 max-w-xl text-muted">{t("subtitle")}</p>
        <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <li
              key={i}
              className="flex aspect-[4/3] items-center justify-center bg-graphite/10 grayscale transition hover:bg-navy/10 hover:grayscale-0"
            >
              {/* TODO: заменить логотипами клубов */}
              <span className="font-mono text-xs uppercase text-muted">
                {t("placeholder", { n: i + 1 })}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="section-rule" />
    </section>
  );
}
