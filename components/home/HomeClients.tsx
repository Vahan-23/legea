"use client";

import { useLocale, useTranslations } from "next-intl";
import { TeamsSection } from "@/components/teams/TeamsSection";
import type { TeamSectionLabels } from "@/components/teams/labels";
import { isLocale } from "@/i18n/routing";

/**
 * Блок «Нам доверяют» на главной: полная секция с фильтрами.
 * Для ленты логотипов используйте {@link TeamsMarquee}.
 */
export function HomeClients() {
  const t = useTranslations("home.clients");
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : "ru";

  const labels: TeamSectionLabels = {
    title: t("title"),
    subtitle: t("subtitle"),
    tabCurrent: t("tabCurrent"),
    tabHistory: t("tabHistory"),
    tabAll: t("tabAll"),
    countryAll: t("countryAll"),
    countryLabel: t("countryLabel"),
    found: (count) => t("found", { count }),
    empty: t("empty"),
    since: (year) => t("since", { year }),
    logoAlt: (name) => t("logoAlt", { name }),
  };

  return <TeamsSection labels={labels} locale={locale} />;
}
