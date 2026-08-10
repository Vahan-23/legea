import { parseColorway, swatchBackground } from "@/lib/colorCode";

type ColorDotsProps = {
  colorways: string[];
  /** Сколько точек показать до «+N» */
  limit?: number;
  className?: string;
};

/**
 * Ряд цветовых точек-свотчей для карточки каталога.
 * Неизвестные коды пропускаются (без падения UI).
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
      // TODO: уточнить отсутствующие ключи палитры (напр. 71)
    }
  }

  const visible = valid.slice(0, limit);
  const rest = valid.length - visible.length;

  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className}`} role="list">
      {visible.map((code) => {
        const bg = swatchBackground(code);
        const isGradient = bg.startsWith("conic");
        return (
          <li key={code} title={code}>
            <span
              className="block h-3.5 w-3.5 rounded-full border border-graphite/20"
              style={{
                background: isGradient ? bg : undefined,
                backgroundColor: isGradient ? undefined : bg,
              }}
              aria-label={code}
            />
          </li>
        );
      })}
      {rest > 0 ? (
        <li className="font-mono text-[10px] text-muted">+{rest}</li>
      ) : null}
    </ul>
  );
}
