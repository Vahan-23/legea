"use client";

import { useTranslations } from "next-intl";
import { parseColorway, swatchBackground } from "@/lib/colorCode";
import { colors } from "@/data/colors";

function isDarkSwatch(code: string): boolean {
  try {
    const parsed = parseColorway(code);
    const hex = parsed.kind === "kit" ? parsed.top.base : parsed.base;
    const n = hex.replace("#", "");
    const r = Number.parseInt(n.slice(0, 2), 16);
    const g = Number.parseInt(n.slice(2, 4), 16);
    const b = Number.parseInt(n.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b < 70;
  } catch {
    return false;
  }
}

function isLightSwatch(code: string): boolean {
  try {
    const parsed = parseColorway(code);
    const hex = parsed.kind === "kit" ? parsed.top.base : parsed.base;
    const n = hex.replace("#", "");
    const r = Number.parseInt(n.slice(0, 2), 16);
    const g = Number.parseInt(n.slice(2, 4), 16);
    const b = Number.parseInt(n.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 220;
  } catch {
    return false;
  }
}

type ColorSwatchesProps = {
  colorways: string[];
  value: string | null;
  onChange: (code: string) => void;
  /** Предзагрузка фото при наведении на свотч */
  onPreview?: (code: string) => void;
};

export function ColorSwatches({
  colorways,
  value,
  onChange,
  onPreview,
}: ColorSwatchesProps) {
  const t = useTranslations("product");

  const valid = colorways.filter((code) => {
    try {
      parseColorway(code);
      return true;
    } catch {
      return false;
    }
  });

  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        {t("colorway")}
        {value ? (
          <span className="ml-2 font-mono text-navy normal-case tracking-normal">
            {value}
          </span>
        ) : null}
      </p>
      <ul className="flex flex-wrap gap-3">
        {valid.map((code) => {
          const active = code === value;
          const bg = swatchBackground(code);
          const isGradient = bg.startsWith("conic");
          const dark = isDarkSwatch(code);
          const light = isLightSwatch(code);

          return (
            <li key={code}>
              <button
                type="button"
                title={code}
                aria-label={code}
                aria-pressed={active}
                onClick={() => onChange(code)}
                onMouseEnter={() => onPreview?.(code)}
                onFocus={() => onPreview?.(code)}
                className={
                  active
                    ? "flex h-10 w-10 items-center justify-center rounded-full bg-white p-[3px] ring-2 ring-blue ring-offset-2"
                    : "flex h-10 w-10 items-center justify-center rounded-full bg-white p-[3px] ring-1 ring-navy/30 hover:ring-blue"
                }
              >
                <span
                  className="block h-full w-full rounded-full"
                  style={{
                    background: isGradient ? bg : undefined,
                    backgroundColor: isGradient ? undefined : bg,
                    boxShadow:
                      dark || light
                        ? `inset 0 0 0 1px ${colors.muted}`
                        : undefined,
                  }}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
