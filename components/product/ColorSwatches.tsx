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
  onPreview?: (code: string) => void;
  fashionSrc?: string | null;
  fashionActive?: boolean;
  onSelectFashion?: () => void;
  has3d?: boolean;
  view3dActive?: boolean;
  onSelect3d?: () => void;
};

const colorSwatchClass = (active: boolean) =>
  active
    ? "flex h-10 w-10 items-center justify-center rounded-full bg-white p-[3px] ring-2 ring-blue ring-offset-2"
    : "flex h-10 w-10 items-center justify-center rounded-full bg-white p-[3px] ring-1 ring-navy/30 hover:ring-blue";

const mediaSwatchClass = (active: boolean) =>
  active
    ? "flex h-12 w-12 items-center justify-center rounded-sm bg-white p-1 ring-2 ring-blue ring-offset-2"
    : "flex h-12 w-12 items-center justify-center rounded-sm bg-white p-1 ring-1 ring-navy/30 hover:ring-blue";

export function ColorSwatches({
  colorways,
  value,
  onChange,
  onPreview,
  fashionSrc = null,
  fashionActive = false,
  onSelectFashion,
  has3d = false,
  view3dActive = false,
  onSelect3d,
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

  const label = view3dActive
    ? t("view3d")
    : fashionActive
      ? t("showFashion")
      : value
        ? value
        : null;

  const showMediaRow = Boolean(fashionSrc) || has3d;

  return (
    <div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        {t("colorway")}
        {label ? (
          <span className="ml-2 font-mono text-navy normal-case tracking-normal">
            {label}
          </span>
        ) : null}
      </p>

      <ul className="flex flex-wrap gap-3">
        {valid.map((code) => {
          const active = !fashionActive && !view3dActive && code === value;
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
                className={colorSwatchClass(active)}
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

      {showMediaRow ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {fashionSrc ? (
            <button
              type="button"
              title={t("showFashion")}
              aria-label={t("showFashion")}
              aria-pressed={fashionActive && !view3dActive}
              onClick={() => onSelectFashion?.()}
              className={mediaSwatchClass(fashionActive && !view3dActive)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fashionSrc}
                alt=""
                draggable={false}
                className="h-full w-full rounded-sm object-cover"
              />
            </button>
          ) : null}

          {has3d ? (
            <button
              type="button"
              title={t("view3d")}
              aria-label={t("view3d")}
              aria-pressed={view3dActive}
              onClick={() => onSelect3d?.()}
              className={mediaSwatchClass(view3dActive)}
            >
              <span className="flex h-full w-full items-center justify-center rounded-sm bg-black font-display text-lg leading-none text-white">
                3D
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
