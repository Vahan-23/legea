"use client";

import type { ComponentType } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

function FlagRu({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 16"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="16" fill="#fff" />
      <rect y="5.33" width="24" height="5.34" fill="#0039A6" />
      <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
    </svg>
  );
}

function FlagHy({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 16"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="5.34" fill="#D90012" />
      <rect y="5.33" width="24" height="5.34" fill="#0033A0" />
      <rect y="10.67" width="24" height="5.33" fill="#F2A800" />
    </svg>
  );
}

function FlagEn({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 16"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M12 0 V16 M0 8 H24" stroke="#fff" strokeWidth="5" />
      <path d="M12 0 V16 M0 8 H24" stroke="#C8102E" strokeWidth="2.6" />
    </svg>
  );
}

const langMeta: Record<
  Locale,
  { label: string; Flag: ComponentType<{ className?: string }> }
> = {
  ru: { label: "RU", Flag: FlagRu },
  hy: { label: "HY", Flag: FlagHy },
  en: { label: "EN", Flag: FlagEn },
};

export function LangSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="flex items-center gap-0.5"
      role="group"
      aria-label={t("language")}
    >
      {locales.map((code) => {
        const active = code === locale;
        const { label, Flag } = langMeta[code];
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              router.replace(pathname, { locale: code });
            }}
            className={
              active
                ? "inline-flex min-w-[3.25rem] flex-col items-center justify-center gap-0.5 px-1.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-blue sm:min-w-[3.5rem]"
                : "inline-flex min-w-[3.25rem] flex-col items-center justify-center gap-0.5 px-1.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted transition-colors hover:text-navy sm:min-w-[3.5rem]"
            }
            aria-current={active ? "true" : undefined}
            aria-label={label}
            title={label}
          >
            <Flag className="h-3.5 w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-navy/15" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
