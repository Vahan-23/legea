import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  Anton,
  Inter,
  JetBrains_Mono,
  Noto_Sans_Armenian,
} from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { isLocale, locales, type Locale } from "@/i18n/routing";
import "../globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-anton",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-jetbrains",
  display: "swap",
});

/** Armenian glyphs — Anton/Inter их не покрывают */
const notoArmenian = Noto_Sans_Armenian({
  subsets: ["armenian"],
  variable: "--font-armenian",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: raw } = params;

  if (!isLocale(raw)) {
    notFound();
  }

  const locale: Locale = raw;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${anton.variable} ${inter.variable} ${jetbrains.variable} ${notoArmenian.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
