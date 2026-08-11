import Image from "next/image";
import { company } from "@/data/company";

export const BRAND_LOGO_SRC = "/images/logoblack.png";

type BrandLogoProps = {
  className?: string;
  /** Высота в px (ширина авто) */
  height?: number;
  priority?: boolean;
};

/**
 * 2D-логотип из /public/images/logoblack.png
 */
export function BrandLogo({
  className,
  height = 36,
  priority = false,
}: BrandLogoProps) {
  // квадратный ассет ~1:1
  const width = height;

  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt={company.brandName}
      width={width}
      height={height}
      priority={priority}
      className={className ?? "h-9 w-auto object-contain"}
    />
  );
}
