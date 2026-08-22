import { ImageResponse } from "next/og";
import { colors } from "@/data/colors";
import { company } from "@/data/company";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.navy,
          color: colors.white,
          fontSize: 96,
          fontWeight: 700,
          fontFamily: "sans-serif",
          letterSpacing: -2,
        }}
      >
        {company.brandName.charAt(0)}
      </div>
    ),
    { ...size },
  );
}
