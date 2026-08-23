"use client";

import { useTranslations } from "next-intl";
import type { CatalogGridColumns } from "@/lib/catalogGridView";

const OPTIONS: CatalogGridColumns[] = [2, 3, 4];

type GridViewToggleProps = {
  value: CatalogGridColumns;
  onChange: (value: CatalogGridColumns) => void;
};

function GridIcon({ columns }: { columns: CatalogGridColumns }) {
  const cols = columns;
  const rows = 2;
  const gap = 1.4;
  const cellW = (20 - gap * (cols - 1)) / cols;
  const cellH = (14 - gap * (rows - 1)) / rows;

  return (
    <svg
      aria-hidden
      viewBox="0 0 20 14"
      className="h-3.5 w-5"
      fill="currentColor"
    >
      {Array.from({ length: rows * cols }).map((_, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        return (
          <rect
            key={index}
            x={col * (cellW + gap)}
            y={row * (cellH + gap)}
            width={cellW}
            height={cellH}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}

/** Переключатель плотности сетки — 2 / 3 / 4 колонки реально отличаются. */
export function GridViewToggle({ value, onChange }: GridViewToggleProps) {
  const t = useTranslations("catalog");

  return (
    <div
      role="radiogroup"
      aria-label={t("gridView")}
      className="hidden items-center gap-2 md:flex"
    >
      <span className="sr-only">{t("gridView")}</span>
      <div className="inline-flex items-stretch border border-navy/15 bg-white p-0.5">
        {OPTIONS.map((columns) => {
          const active = value === columns;
          return (
            <button
              key={columns}
              type="button"
              role="radio"
              aria-checked={active}
              title={t(`gridCols${columns}`)}
              onClick={() => onChange(columns)}
              className={
                active
                  ? "flex min-w-[2.75rem] flex-col items-center justify-center gap-0.5 bg-navy px-2 py-1.5 text-white"
                  : "flex min-w-[2.75rem] flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-muted transition-colors hover:bg-off-white hover:text-navy"
              }
            >
              <GridIcon columns={columns} />
              <span className="font-mono text-[9px] leading-none">{columns}</span>
              <span className="sr-only">{t(`gridCols${columns}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
