import { ImageResponse } from "next/og";
import { colors } from "@/data/colors";
import { company } from "@/data/company";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {company.brandName.charAt(0)}
      </div>
    ),
    { ...size },
  );
}
