import type { MetadataRoute } from "next";
import { getVisibleCatalogProducts } from "@/lib/catalogProducts.server";
import { locales, type Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo";

const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/catalog", changeFrequency: "daily", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/delivery", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contacts", changeFrequency: "monthly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/spec", changeFrequency: "monthly", priority: 0.5 },
];

function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = absoluteUrl(locale, path);
  }
  languages["x-default"] = absoluteUrl("ru", path);
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getVisibleCatalogProducts();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of STATIC_PATHS) {
      entries.push({
        url: absoluteUrl(locale as Locale, page.path),
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: languageAlternates(page.path),
        },
      });
    }

    for (const product of products) {
      const path = `/catalog/${product.id}`;
      entries.push({
        url: absoluteUrl(locale as Locale, path),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: languageAlternates(path),
        },
      });
    }
  }

  return entries;
}
