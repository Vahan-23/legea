import type { Metadata } from "next";
import { company } from "@/data/company";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? company.siteUrl,
  ),
  title: {
    default: company.brandName,
    template: `%s · ${company.brandName}`,
  },
  description:
    "Official Legea distributor — kit for clubs and sports schools",
  openGraph: {
    type: "website",
    siteName: company.brandName,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** Корневой layout только прокидывает детей — html/body в [locale]/layout */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
