"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { company } from "@/data/company";
import { colorMap, colors } from "@/data/colors";
import { downloadDataUrl, loadLogoFile } from "@/lib/logo";
import { useCanvasCaptureStore } from "@/store/useCanvasCaptureStore";
import { useProductStore } from "@/store/useProductStore";
import type { BrandingDraft } from "@/types/spec";

type BrandingPanelProps = {
  zones: string[];
};

export function BrandingPanel({ zones }: BrandingPanelProps) {
  const t = useTranslations("branding");
  const branding = useProductStore((s) => s.branding);
  const setBranding = useProductStore((s) => s.setBranding);
  const resetBranding = useProductStore((s) => s.resetBranding);
  const capture = useCanvasCaptureStore((s) => s.capture);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setError(null);
      const result = await loadLogoFile(file);
      if (!result.ok) {
        setError(t(`error.${result.error}`));
        return;
      }
      setBranding({
        logoDataUrl: result.dataUrl,
        logoFileName: result.fileName,
      });
    },
    [setBranding, t],
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    void handleFiles(event.dataTransfer.files);
  };

  const toggleZone = (zone: string) => {
    const next = branding.zones.includes(zone)
      ? branding.zones.filter((z) => z !== zone)
      : [...branding.zones, zone];
    const selectedZone =
      branding.selectedZone && next.includes(branding.selectedZone)
        ? branding.selectedZone
        : (next[0] ?? null);
    setBranding({ zones: next, selectedZone });
  };

  const setMethod = (method: BrandingDraft["method"]) => {
    setBranding({ method });
  };

  const leadDays =
    branding.method === "print"
      ? company.leadTimes.branding.print
      : branding.method === "sublimation"
        ? company.leadTimes.branding.sublimation
        : branding.method === "embroidery"
          ? company.leadTimes.branding.embroidery
          : null;

  const downloadPreview = () => {
    const dataUrl = capture(branding.exportWhiteBg);
    if (!dataUrl) {
      setError(t("error.capture"));
      return;
    }
    downloadDataUrl(dataUrl, `legea-preview-${Date.now()}.png`);
  };

  return (
    <section className="space-y-6 border border-navy/15 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg uppercase tracking-display text-navy">
          {t("title")}
        </h2>
        <button
          type="button"
          onClick={resetBranding}
          className="text-xs uppercase tracking-wide text-muted hover:text-navy"
        >
          {t("reset")}
        </button>
      </div>

      {/* Логотип */}
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted">
          {t("logo")}
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={
            dragOver
              ? "border border-blue bg-off-white px-4 py-8 text-center"
              : "border border-dashed border-navy/30 px-4 py-8 text-center"
          }
        >
          {branding.logoDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.logoDataUrl}
                alt={branding.logoFileName ?? ""}
                className="h-20 w-20 object-contain"
              />
              <p className="font-mono text-xs text-muted">
                {branding.logoFileName}
              </p>
              <button
                type="button"
                onClick={() =>
                  setBranding({ logoDataUrl: null, logoFileName: null })
                }
                className="text-xs uppercase text-blue"
              >
                {t("removeLogo")}
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">{t("dropHint")}</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-3 text-xs uppercase tracking-wide text-blue"
              >
                {t("browse")}
              </button>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/svg+xml,.png,.svg"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              void handleFiles(e.target.files)
            }
          />
        </div>
        {error ? <p className="mt-2 text-sm text-blue">{error}</p> : null}
      </div>

      {/* Зоны */}
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted">
          {t("zones")}
        </p>
        <ul className="space-y-2">
          {zones.map((zone) => (
            <li key={zone} className="flex items-center gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={branding.zones.includes(zone)}
                  onChange={() => toggleZone(zone)}
                  className="accent-blue"
                />
                <span>{t(`zone.${zone}`)}</span>
              </label>
              {branding.zones.includes(zone) ? (
                <button
                  type="button"
                  onClick={() => setBranding({ selectedZone: zone })}
                  className={
                    branding.selectedZone === zone
                      ? "font-mono text-[10px] uppercase text-blue"
                      : "font-mono text-[10px] uppercase text-muted hover:text-navy"
                  }
                >
                  {t("editZone")}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {/* Трансформы */}
      {branding.selectedZone || branding.zones.length > 0 ? (
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            {t("transform")}
            {branding.selectedZone
              ? ` · ${t(`zone.${branding.selectedZone}`)}`
              : ""}
          </p>
          <SliderRow
            label={t("scale")}
            min={0.3}
            max={1.5}
            step={0.05}
            value={branding.scale}
            onChange={(scale) => setBranding({ scale })}
          />
          <SliderRow
            label={t("rotation")}
            min={-45}
            max={45}
            step={1}
            value={branding.rotation}
            onChange={(rotation) => setBranding({ rotation })}
          />
          <SliderRow
            label={t("offsetY")}
            min={-0.15}
            max={0.15}
            step={0.01}
            value={branding.offsetY}
            onChange={(offsetY) => setBranding({ offsetY })}
          />
        </div>
      ) : null}

      {/* Номер / фамилия */}
      {zones.includes("back-number") ? (
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
            {t("player")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted">{t("number")}</span>
              <input
                type="text"
                maxLength={3}
                value={branding.playerNumber}
                onChange={(e) => {
                  const playerNumber = e.target.value;
                  const nextZones = branding.zones.includes("back-number")
                    ? branding.zones
                    : [...branding.zones, "back-number"];
                  setBranding({
                    playerNumber,
                    zones: nextZones,
                    selectedZone: branding.selectedZone ?? "back-number",
                  });
                }}
                className="w-full border border-navy/20 px-3 py-2 font-mono outline-none focus:border-blue"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">{t("name")}</span>
              <input
                type="text"
                maxLength={16}
                value={branding.playerName}
                onChange={(e) => {
                  const playerName = e.target.value;
                  const nextZones = branding.zones.includes("back-number")
                    ? branding.zones
                    : [...branding.zones, "back-number"];
                  setBranding({
                    playerName,
                    zones: nextZones,
                    selectedZone: branding.selectedZone ?? "back-number",
                  });
                }}
                className="w-full border border-navy/20 px-3 py-2 uppercase outline-none focus:border-blue"
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">{t("numberColor")}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(colorMap).map(([key, meta]) => {
                const n = meta.hex.replace("#", "");
                const r = Number.parseInt(n.slice(0, 2), 16);
                const g = Number.parseInt(n.slice(2, 4), 16);
                const b = Number.parseInt(n.slice(4, 6), 16);
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                const edge = luma < 70 || luma > 220;
                return (
                  <button
                    key={key}
                    type="button"
                    title={meta.name}
                    onClick={() => setBranding({ numberColorKey: key })}
                    className={
                      branding.numberColorKey === key
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-white p-px ring-2 ring-blue ring-offset-1"
                        : "flex h-6 w-6 items-center justify-center rounded-full bg-white p-px ring-1 ring-navy/30"
                    }
                  >
                    <span
                      className="block h-full w-full rounded-full"
                      style={{
                        backgroundColor: meta.hex,
                        boxShadow: edge
                          ? `inset 0 0 0 1px ${colors.muted}`
                          : undefined,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Метод */}
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted">
          {t("method")}
        </p>
        <div className="flex flex-wrap gap-4">
          {(
            [
              ["print", "print"],
              ["sublimation", "sublimation"],
              ["embroidery", "embroidery"],
            ] as const
          ).map(([value, labelKey]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="branding-method"
                checked={branding.method === value}
                onChange={() => setMethod(value)}
                className="accent-blue"
              />
              {t(`methods.${labelKey}`)}
            </label>
          ))}
        </div>
        {leadDays != null ? (
          <p className="mt-2 text-sm text-muted">
            {t("leadTime", { days: leadDays })}
          </p>
        ) : null}
      </div>

      {/* Экспорт */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={branding.exportWhiteBg}
            onChange={(e) =>
              setBranding({ exportWhiteBg: e.target.checked })
            }
            className="accent-blue"
          />
          {t("whiteBg")}
        </label>
        <Button type="button" variant="secondary" onClick={downloadPreview}>
          {t("downloadPreview")}
        </Button>
      </div>
    </section>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[100px_1fr_48px]">
      <span className="col-span-2 text-muted sm:col-span-1">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        className="min-w-0 w-full accent-blue"
      />
      <span className="font-mono text-xs text-graphite">{value}</span>
    </label>
  );
}
