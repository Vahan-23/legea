import type { Metadata } from "next";
import { company } from "@/data/company";
import {
  defaultLocale,
  locales,
  type Locale,
} from "@/i18n/routing";

const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  hy: "hy_AM",
  en: "en_US",
};

/** Публичный origin без завершающего слэша. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? company.siteUrl;
  return raw.replace(/\/$/, "");
}

/**
 * Path с префиксом локали (localePrefix: always).
 * `path` — без локали, "" или "/" для главной, "/catalog" и т.д.
 */
export function localePath(locale: Locale, path = ""): string {
  const normalized =
    !path || path === "/"
      ? ""
      : path.startsWith("/")
        ? path
        : `/${path}`;
  return `/${locale}${normalized}`;
}

export function absoluteUrl(locale: Locale, path = ""): string {
  return `${getSiteUrl()}${localePath(locale, path)}`;
}

export function buildAlternates(locale: Locale, path = "") {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = absoluteUrl(loc, path);
  }
  languages["x-default"] = absoluteUrl(defaultLocale, path);

  return {
    canonical: absoluteUrl(locale, path),
    languages,
  };
}

type PageMetadataInput = {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  type?: "website" | "article";
};

export function pageMetadata({
  locale,
  path = "",
  title,
  description,
  images,
  type = "website",
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(locale, path);
  const siteName = company.brandName;

  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: {
      type,
      locale: OG_LOCALE[locale],
      url,
      siteName,
      title,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.brandName,
    legalName: company.legalName,
    url,
    email: company.publicEmail,
    telephone: company.phones[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: company.officeAddress,
      addressCountry: "AM",
      addressLocality: "Yerevan",
    },
    brand: {
      "@type": "Brand",
      name: company.brandName,
    },
    areaServed: company.region,
  };
}

export function productJsonLd(input: {
  name: string;
  sku: string;
  description: string;
  image?: string | string[];
  category?: string;
  url: string;
}) {
  const images = input.image
    ? Array.isArray(input.image)
      ? input.image
      : [input.image]
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    sku: input.sku,
    mpn: input.sku,
    description: input.description,
    url: input.url,
    ...(images && images.length > 0 ? { image: images } : {}),
    ...(input.category ? { category: input.category } : {}),
    brand: {
      "@type": "Brand",
      name: company.brandName,
    },
  };
}
