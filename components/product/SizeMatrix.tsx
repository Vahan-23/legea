"use client";

import {
  useCallback,
  useRef,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { useTranslations } from "next-intl";
import { sizePresets } from "@/data/sizePresets";
import { company } from "@/data/company";
import { totalPieces } from "@/types/spec";

type SizeMatrixProps = {
  sizes: string[];
  quantities: Record<string, number>;
  moq: number;
  onChange: (size: string, qty: number) => void;
  onApplyPreset: (preset: Record<string, number>) => void;
};

export function SizeMatrix({
  sizes,
  quantities,
  moq,
  onChange,
  onApplyPreset,
}: SizeMatrixProps) {
  const t = useTranslations("product");
  const tCatalog = useTranslations("catalog");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const total = totalPieces(quantities);
  const effectiveMoq = moq > 0 ? moq : company.defaultMoq;
  const belowMoq = total > 0 && total < effectiveMoq;

  const handleKeyDown = useCallback(
    (index: number, size: string, event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        onChange(size, (quantities[size] ?? 0) + 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        onChange(size, Math.max(0, (quantities[size] ?? 0) - 1));
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        // Tab-навигация дополнительно стрелками по полям
        const next =
          event.key === "ArrowRight"
            ? Math.min(sizes.length - 1, index + 1)
            : Math.max(0, index - 1);
        inputsRef.current[next]?.focus();
        inputsRef.current[next]?.select();
      }
    },
    [onChange, quantities, sizes.length],
  );

  const handleChange = (size: string, event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === "") {
      onChange(size, 0);
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) onChange(size, parsed);
  };

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {t("sizeMatrix")}
      </p>

      <div className="flex flex-wrap gap-2">
        {sizePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset(preset.quantities)}
            className="border border-navy/20 px-3 py-1.5 text-xs uppercase tracking-wide text-navy hover:border-blue hover:text-blue"
          >
            {tCatalog(`presets.${preset.labelKey}`)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-navy/15">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="bg-off-white">
              {sizes.map((size) => (
                <th
                  key={size}
                  className="border-b border-navy/10 px-2 py-2 text-center font-mono text-xs font-normal text-muted"
                >
                  {size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {sizes.map((size, index) => (
                <td key={size} className="px-1 py-2 text-center">
                  <input
                    ref={(el) => {
                      inputsRef.current[index] = el;
                    }}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={quantities[size] ?? 0}
                    onChange={(event) => handleChange(size, event)}
                    onKeyDown={(event) => handleKeyDown(index, size, event)}
                    onFocus={(event) => event.target.select()}
                    className="w-14 border border-navy/20 bg-white px-1 py-1.5 text-center font-mono text-sm outline-none focus:border-blue"
                    aria-label={size}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 text-sm">
        <p className="font-mono text-graphite">
          {t("totalPieces", { count: total })}
        </p>
        <p className="text-muted">{t("moqValue", { moq: effectiveMoq })}</p>
      </div>

      {belowMoq ? (
        <p className="border border-blue/30 bg-off-white px-3 py-2 text-sm text-navy">
          {t("moqWarning")}
        </p>
      ) : null}
    </div>
  );
}
