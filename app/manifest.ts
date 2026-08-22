import type { MetadataRoute } from "next";
import { colors } from "@/data/colors";
import { company } from "@/data/company";
import { defaultLocale } from "@/i18n/routing";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${company.brandName} — ${company.region}`,
    short_name: company.brandName,
    description:
      "Official Legea distributor — kit for clubs and sports schools",
    start_url: `/${defaultLocale}`,
    display: "standalone",
    background_color: colors.offWhite,
    theme_color: colors.navy,
    lang: defaultLocale,
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
