import type { Metadata } from "next";
import { company } from "@/data/company";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? company.siteUrl,
  ),
  title: {
    default: "Legea",
    template: "%s · Legea",
  },
  description:
    "Official Legea distributor — kit for clubs and sports schools",
};

/** Корневой layout только прокидывает детей — html/body в [locale]/layout */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
