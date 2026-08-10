"use client";

import { useTranslations } from "next-intl";
import { parseColorway, swatchBackground } from "@/lib/colorCode";

type ColorSwatchesProps = {
  colorways: string[];
  value: string | null;
  onChange: (code: string) => void;
};

export function ColorSwatches({
  colorways,
  value,
  onChange,
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
          return (
            <li key={code}>
              <button
                type="button"
                title={code}
                aria-pressed={active}
                onClick={() => onChange(code)}
                className={
                  active
                    ? "h-9 w-9 rounded-full ring-2 ring-blue ring-offset-2"
                    : "h-9 w-9 rounded-full border border-graphite/20 hover:border-blue"
                }
                style={{
                  background: isGradient ? bg : undefined,
                  backgroundColor: isGradient ? undefined : bg,
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
