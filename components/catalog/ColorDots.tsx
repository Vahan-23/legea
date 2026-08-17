"use client";

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
};

/**
 * Ряд цветовых точек-свотчей для карточки каталога.
 * Наведение — hover-превью на карточке (см. ProductCard).
 */
export function ColorDots({
  colorways,
  limit = 8,
  className = "",
  activeCode = null,
  onPreview,
}: ColorDotsProps) {
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
  const interactive = Boolean(onPreview);

  return (
    <ul
      className={`flex flex-wrap items-center gap-2.5 sm:gap-1.5 ${className}`}
      role="list"
    >
      {visible.map((code) => {
        const bg = swatchBackground(code);
        const isGradient = bg.startsWith("conic");
        const edge = isDarkOrLight(code);
        const active = activeCode === code;

        return (
          <li key={code} title={code}>
            <span
              className={
                interactive
                  ? "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white p-0.5 ring-1 ring-navy/25 transition-shadow hover:ring-blue touch-manipulation sm:h-5 sm:w-5 sm:p-px"
                  : "flex h-6 w-6 items-center justify-center rounded-full bg-white p-px ring-1 ring-navy/25 sm:h-3.5 sm:w-3.5"
              }
              style={
                active
                  ? { boxShadow: `0 0 0 2px ${colors.blue}` }
                  : undefined
              }
              aria-label={code}
              onMouseEnter={
                interactive
                  ? (event) => {
                      event.stopPropagation();
                      onPreview?.(code);
                    }
                  : undefined
              }
              onClick={
                interactive
                  ? (event) => {
                      event.preventDefault();
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
            </span>
          </li>
        );
      })}
      {rest > 0 ? (
        <li className="font-mono text-[10px] text-muted">+{rest}</li>
      ) : null}
    </ul>
  );
}
