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
};

/**
 * Ряд цветовых точек-свотчей для карточки каталога.
 */
export function ColorDots({
  colorways,
  limit = 8,
  className = "",
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

  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`} role="list">
      {visible.map((code) => {
        const bg = swatchBackground(code);
        const isGradient = bg.startsWith("conic");
        const edge = isDarkOrLight(code);
        return (
          <li key={code} title={code}>
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white p-px ring-1 ring-navy/25">
              <span
                className="block h-full w-full rounded-full"
                style={{
                  background: isGradient ? bg : undefined,
                  backgroundColor: isGradient ? undefined : bg,
                  boxShadow: edge
                    ? `inset 0 0 0 1px ${colors.muted}`
                    : undefined,
                }}
                aria-label={code}
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
