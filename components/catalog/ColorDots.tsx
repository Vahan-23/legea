"use client";

import { useTranslations } from "next-intl";
import { parseColorway, swatchBackground } from "@/lib/colorCode";
import { colors } from "@/data/colors";

function isDarkOrLight(code: string): boolean {
  try {
    const parsed = parseColorway(code);
    const hex = parsed.kind === "kit" ? parsed.top.base : parsed.base;
    const n = hex.replace("#", "");
    const r = Number.parseInt(n.slice(0, 2), 16);
    const g = Number.parseInt(n.slice(2, 4), 16);
    const b = Number.parseInt(n.slice(4, 6), 16);
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    return luma < 70 || luma > 220;
  } catch {
    return false;
  }
}

type ColorDotsProps = {
  colorways: string[];
  limit?: number;
  className?: string;
  activeCode?: string | null;
  onPreview?: (code: string) => void;
  fashionSrc?: string | null;
  fashionActive?: boolean;
  onSelectFashion?: () => void;
};

/**
 * Свотчи расцветок (+ опционально fashion) для карточки каталога.
 */
export function ColorDots({
  colorways,
  limit = 8,
  className = "",
  activeCode = null,
  onPreview,
  fashionSrc = null,
  fashionActive = false,
  onSelectFashion,
}: ColorDotsProps) {
  const t = useTranslations("product");

  const valid: string[] = [];
  for (const code of colorways) {
    try {
      parseColorway(code);
      valid.push(code);
    } catch {
      // skip unknown
    }
  }

  const visible = valid.slice(0, limit);
  const rest = valid.length - visible.length;
  const interactive = Boolean(onPreview || onSelectFashion);

  const stop = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <ul
      className={`flex flex-wrap items-center gap-2.5 ${className}`}
      role="list"
    >
      {fashionSrc ? (
        <li>
          <button
            type="button"
            title={t("showFashion")}
            aria-label={t("showFashion")}
            aria-pressed={fashionActive}
            onClick={(event) => {
              stop(event);
              onSelectFashion?.();
            }}
            className={
              fashionActive
                ? "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-[3px] ring-2 ring-blue ring-offset-2 touch-manipulation"
                : "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-[3px] ring-1 ring-navy/30 hover:ring-blue touch-manipulation"
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fashionSrc}
              alt=""
              draggable={false}
              className="h-full w-full rounded-full object-cover"
            />
          </button>
        </li>
      ) : null}

      {visible.map((code) => {
        const bg = swatchBackground(code);
        const isGradient = bg.startsWith("conic");
        const edge = isDarkOrLight(code);
        const active = !fashionActive && activeCode === code;

        return (
          <li key={code} title={code}>
            <button
              type="button"
              aria-label={code}
              aria-pressed={active}
              disabled={!interactive}
              onClick={
                interactive
                  ? (event) => {
                      stop(event);
                      onPreview?.(code);
                    }
                  : undefined
              }
              onMouseEnter={
                interactive
                  ? (event) => {
                      event.stopPropagation();
                      onPreview?.(code);
                    }
                  : undefined
              }
              onFocus={
                interactive
                  ? (event) => {
                      event.stopPropagation();
                      onPreview?.(code);
                    }
                  : undefined
              }
              className={
                interactive
                  ? active
                    ? "flex h-10 w-10 items-center justify-center rounded-full bg-white p-[3px] ring-2 ring-blue ring-offset-2 touch-manipulation"
                    : "flex h-10 w-10 items-center justify-center rounded-full bg-white p-[3px] ring-1 ring-navy/30 hover:ring-blue touch-manipulation"
                  : "flex h-6 w-6 items-center justify-center rounded-full bg-white p-px ring-1 ring-navy/25"
              }
            >
              <span
                className="block h-full w-full rounded-full"
                style={{
                  background: isGradient ? bg : undefined,
                  backgroundColor: isGradient ? undefined : bg,
                  boxShadow: edge
                    ? `inset 0 0 0 1px ${colors.muted}`
                    : undefined,
                }}
              />
            </button>
          </li>
        );
      })}
      {rest > 0 ? (
        <li className="font-mono text-[10px] text-muted">+{rest}</li>
      ) : null}
    </ul>
  );
}
