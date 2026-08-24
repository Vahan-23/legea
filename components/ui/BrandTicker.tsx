/**
 * Бегущая рекламная лента под header: LEGEA на чёрном фоне.
 */
export function BrandTicker() {
  const items = Array.from({ length: 12 }, () => "LEGEA");
  const loop = [...items, ...items];

  return (
    <div
      className="brand-ticker overflow-hidden border-b border-white/10 bg-black"
      aria-hidden="true"
    >
      <div className="brand-ticker__track flex w-max items-center gap-6 py-0.5 sm:gap-8">
        {loop.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="flex shrink-0 items-center gap-6 sm:gap-8"
          >
            <span className="font-display text-[10px] uppercase italic leading-none tracking-[0.22em] text-white sm:text-xs">
              {label}
            </span>
            <span className="h-0.5 w-0.5 rounded-full bg-blue" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}
