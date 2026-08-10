/**
 * Позиции зон нанесения на PlaceholderModel (локальные координаты группы).
 */

export const BRANDING_ZONE_KEYS = [
  "chest-center",
  "chest-left",
  "chest-right",
  "back-top",
  "back-number",
  "sleeve-left",
  "sleeve-right",
  "shorts-left",
  "shorts-right",
  "sock-side",
] as const;

export type BrandingZoneKey = (typeof BRANDING_ZONE_KEYS)[number];

export type ZoneLayout = {
  position: [number, number, number];
  rotation: [number, number, number];
  /** Базовый размер плоскости до слайдера scale */
  size: number;
};

export const ZONE_LAYOUT: Record<BrandingZoneKey, ZoneLayout> = {
  "chest-center": {
    position: [0, 0.12, 0.125],
    rotation: [0, 0, 0],
    size: 0.14,
  },
  "chest-left": {
    position: [-0.12, 0.2, 0.12],
    rotation: [0, 0, 0],
    size: 0.09,
  },
  "chest-right": {
    position: [0.12, 0.2, 0.12],
    rotation: [0, 0, 0],
    size: 0.09,
  },
  "back-top": {
    position: [0, 0.22, -0.125],
    rotation: [0, Math.PI, 0],
    size: 0.12,
  },
  "back-number": {
    position: [0, 0.02, -0.125],
    rotation: [0, Math.PI, 0],
    size: 0.22,
  },
  "sleeve-left": {
    position: [-0.36, 0.2, 0.04],
    rotation: [0, Math.PI / 2.2, 0],
    size: 0.08,
  },
  "sleeve-right": {
    position: [0.36, 0.2, 0.04],
    rotation: [0, -Math.PI / 2.2, 0],
    size: 0.08,
  },
  "shorts-left": {
    position: [-0.12, 0.08, 0.12],
    rotation: [0, 0, 0],
    size: 0.08,
  },
  "shorts-right": {
    position: [0.12, 0.08, 0.12],
    rotation: [0, 0, 0],
    size: 0.08,
  },
  "sock-side": {
    position: [0.1, 0.05, 0.08],
    rotation: [0, 0, 0],
    size: 0.06,
  },
};

export function isBrandingZoneKey(value: string): value is BrandingZoneKey {
  return (BRANDING_ZONE_KEYS as readonly string[]).includes(value);
}
