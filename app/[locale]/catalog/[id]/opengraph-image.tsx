import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { colors } from "@/data/colors";
import { company } from "@/data/company";
import { parseColorway } from "@/lib/colorCode";
import { getProductById } from "@/lib/products";
import { isLocale, type Locale } from "@/i18n/routing";
import { productName } from "@/types/product";

export const runtime = "nodejs";
export const alt = "Legea product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: { locale: string; id: string } };

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

function swatchHexes(colorway: string): string[] {
  try {
    const parsed = parseColorway(colorway);
    if (parsed.kind === "kit") {
      return [parsed.top.base, parsed.bottom.base];
    }
    if (parsed.isSolid) return [parsed.base];
    return [parsed.base, parsed.trim];
  } catch {
    return [];
  }
}

export default async function Image({ params }: Props) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "ru";
  const product = getProductById(params.id);
  const name = product ? productName(product, locale) : params.id;
  const sku = product?.id ?? params.id;
  const logo = await loadLogoDataUrl();

  const swatches = (product?.colorways ?? [])
    .flatMap(swatchHexes)
    .filter((hex, index, all) => all.indexOf(hex) === index)
    .slice(0, 10);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(145deg, ${colors.navy} 0%, #0c1d38 60%, ${colors.blue} 160%)`,
          color: colors.white,
          padding: "56px 64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} width={56} height={56} alt="" />
            ) : null}
            <div
              style={{
                fontSize: 28,
                letterSpacing: 6,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {company.brandName}
            </div>
          </div>
          <div
            style={{
              fontSize: 28,
              fontFamily: "monospace",
              letterSpacing: 2,
              opacity: 0.9,
            }}
          >
            {sku}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 980,
            }}
          >
            {name}
          </div>
          <div
            style={{
              height: 6,
              width: 140,
              background: colors.blue,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              opacity: 0.75,
            }}
          >
            Colorways
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {swatches.length > 0
              ? swatches.map((hex) => (
                  <div
                    key={hex}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      background: hex,
                      border: `2px solid ${colors.white}`,
                    }}
                  />
                ))
              : (
                  <div
                    style={{
                      fontSize: 22,
                      opacity: 0.7,
                    }}
                  >
                    {company.region}
                  </div>
                )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
