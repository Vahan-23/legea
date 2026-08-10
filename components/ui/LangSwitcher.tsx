"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

const labels: Record<Locale, string> = {
  ru: "RU",
  hy: "HY",
  en: "EN",
};

export function LangSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={t("language")}
    >
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              router.replace(pathname, { locale: code });
            }}
            className={
              active
                ? "px-2 py-1 font-mono text-xs uppercase text-blue"
                : "px-2 py-1 font-mono text-xs uppercase text-muted hover:text-navy"
            }
            aria-current={active ? "true" : undefined}
          >
            {labels[code]}
          </button>
        );
      })}
    </div>
  );
}
