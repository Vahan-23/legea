import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { colors } from "@/data/colors";
import { company } from "@/data/company";
import { isLocale } from "@/i18n/routing";

export const runtime = "nodejs";
export const alt = `${company.brandName} — sports kit`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: { locale: string } };

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const bytes = await readFile(
      join(process.cwd(), "public/images/logo.png"),
    );
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: Props) {
  const locale = isLocale(params.locale) ? params.locale : "ru";
  const taglines: Record<string, string> = {
    ru: "Официальный дистрибьютор — экипировка для клубов",
    en: "Official distributor — kit for clubs and schools",
    hy: "Պաշտոնական դիստրիբյուտոր — համազգեստ ակումբների համար",
  };
  const logo = await loadLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${colors.navy} 0%, #0a1a33 55%, ${colors.blue} 140%)`,
          color: colors.white,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={72} height={72} alt="" />
          ) : null}
          <div
            style={{
              fontSize: 42,
              letterSpacing: 8,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {company.brandName}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
              maxWidth: 900,
            }}
          >
            {taglines[locale] ?? taglines.ru}
          </div>
          <div
            style={{
              height: 6,
              width: 160,
              background: colors.blue,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            opacity: 0.85,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {company.region}
        </div>
      </div>
    ),
    { ...size },
  );
}
