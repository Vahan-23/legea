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
  /** Desktop: hover fashion / уход мыши — вернуть главную */
  onPreviewFashion?: () => void;
  onPreviewEnd?: () => void;
};

/**
 * Свотчи расцветок (+ fashion) — одинаковый размер слота, без ring-offset.
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
  onPreviewFashion,
  onPreviewEnd,
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

  /** Фиксированный слот — крупнее для каталога */
  const slotClass = interactive
    ? "flex h-9 w-9 shrink-0 items-center justify-center sm:h-7 sm:w-7"
    : "flex h-7 w-7 shrink-0 items-center justify-center sm:h-5 sm:w-5";

  const buttonClass = (active: boolean) => {
    const base =
      "box-border flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white p-[2px] touch-manipulation sm:p-px";
    if (!interactive) {
      return `${base} ring-1 ring-inset ring-navy/25`;
    }
    if (active) {
      return `${base} ring-2 ring-inset ring-blue`;
    }
    return `${base} ring-1 ring-inset ring-navy/25 hover:ring-blue`;
  };

  return (
    <ul
      className={`flex max-w-full min-w-0 flex-wrap items-center gap-2 sm:gap-2 ${className}`}
      role="list"
      onMouseLeave={onPreviewEnd}
    >
      {fashionSrc ? (
        <li className={slotClass}>
          <button
            type="button"
            title={t("showFashion")}
            aria-label={t("showFashion")}
            aria-pressed={fashionActive}
            onClick={(event) => {
              stop(event);
              onSelectFashion?.();
            }}
            onMouseEnter={(event) => {
              event.stopPropagation();
              onPreviewFashion?.();
            }}
            className={buttonClass(fashionActive)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fashionSrc}
              alt=""
              draggable={false}
              className="block h-full w-full rounded-full object-cover"
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
          <li key={code} title={code} className={slotClass}>
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
              className={buttonClass(active)}
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
        <li className="flex h-9 shrink-0 items-center font-mono text-[10px] text-muted sm:h-7">
          +{rest}
        </li>
      ) : null}
    </ul>
  );
}
