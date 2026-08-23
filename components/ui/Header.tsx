import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";
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
      <header className="border-b border-blue/30 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="shrink-0" aria-label="Legea">
            <BrandLogo
              height={40}
              priority
              className="h-10 w-auto object-contain"
            />
          </Link>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            {navKeys.map((key) => (
              <Link
                key={key}
                href={navHrefs[key]}
                className="text-sm uppercase tracking-wide text-graphite hover:text-blue"
              >
                {t(key)}
              </Link>
            ))}
            <SpecNavButton />
          </nav>
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <SpecNavButton />
            </div>
            <LangSwitcher />
          </div>
        </div>
        <div className="section-rule" />
      </header>
      <SpecDrawer />
    </>
  );
}
