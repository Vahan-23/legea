import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
import { StickyHeader } from "@/components/ui/StickyHeader";
import { SpecNavButton } from "@/components/spec/SpecNavButton";
import { SpecDrawer } from "@/components/spec/SpecDrawer";

const navKeys = [
  "catalog",
  "builder",
  "about",
  "delivery",
  "contacts",
] as const;

const navHrefs: Record<(typeof navKeys)[number], string> = {
  catalog: "/catalog",
  // /builder отложен (decisions 14.1) — ведём в каталог майки
  builder: "/catalog?type=maglie",
  about: "/about",
  delivery: "/delivery",
  contacts: "/contacts",
};

type HeaderProps = {
  locale: string;
};

export async function Header({ locale }: HeaderProps) {
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <>
      <StickyHeader>
        <header className="border-b border-blue/30 bg-white/95 backdrop-blur-sm">
          <div className="relative flex w-full items-center gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
            <Link href="/" className="shrink-0" aria-label="Legea">
              <BrandLogo
                height={40}
                priority
                className="h-10 w-auto object-contain"
              />
            </Link>

            <nav
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex"
              aria-label="Main"
            >
              {navKeys.map((key) => (
                <Link
                  key={key}
                  href={navHrefs[key]}
                  className="text-sm font-semibold uppercase tracking-wide text-graphite hover:text-blue"
                >
                  {t(key)}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <SpecNavButton />
              <LangSwitcher />
            </div>
          </div>
          <div className="section-rule" />
        </header>
      </StickyHeader>
      <SpecDrawer />
    </>
  );
}
