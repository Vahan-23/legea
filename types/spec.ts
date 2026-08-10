import type { LocalizedName } from "@/types/product";

/** Черновик брендирования — полная панель на этапе 6. */
export type BrandingDraft = {
  logoDataUrl: string | null;
  logoFileName: string | null;
  zones: string[];
  /** Зона, к которой применяются слайдеры трансформации */
  selectedZone: string | null;
  scale: number;
  rotation: number;
  offsetY: number;
  playerNumber: string;
  playerName: string;
  numberColorKey: string;
  method: "print" | "sublimation" | "embroidery" | null;
  /** Экспорт превью на белом фоне */
  exportWhiteBg: boolean;
};

export const emptyBranding = (): BrandingDraft => ({
  logoDataUrl: null,
  logoFileName: null,
  zones: [],
  selectedZone: null,
  scale: 1,
  rotation: 0,
  offsetY: 0,
  playerNumber: "",
  playerName: "",
  numberColorKey: "10",
  method: null,
  exportWhiteBg: false,
});

/** Простой стабильный хэш для ключа позиции спецификации. */
export function hashBranding(branding: BrandingDraft | null): string {
  if (!branding) return "none";
  const payload = JSON.stringify({
    logo: branding.logoFileName,
    zones: [...branding.zones].sort(),
    scale: branding.scale,
    rotation: branding.rotation,
    offsetY: branding.offsetY,
    playerNumber: branding.playerNumber,
    playerName: branding.playerName,
    numberColorKey: branding.numberColorKey,
    method: branding.method,
  });
  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function makeSpecItemKey(
  productId: string,
  colorway: string,
  branding: BrandingDraft | null,
): string {
  return `${productId}__${colorway}__${hashBranding(branding)}`;
}

export type SpecItem = {
  key: string;
  /** Артикул в спецификации (может быть B/J-вариант) */
  productId: string;
  /** Id карточки каталога для ссылки «Изменить» */
  catalogId: string;
  /** Снапшот названия на момент добавления */
  name: LocalizedName;
  colorway: string;
  quantities: Record<string, number>;
  branding: BrandingDraft | null;
  comment: string;
  /** Связь позиций комплекта из /builder */
  kitId?: string;
  previewDataUrl?: string;
  addedAt: number;
};

export function totalPieces(quantities: Record<string, number>): number {
  return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
}
