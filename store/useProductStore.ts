"use client";

import { create } from "zustand";
import { emptyBranding, type BrandingDraft } from "@/types/spec";

type ProductStore = {
  productId: string | null;
  colorway: string | null;
  quantities: Record<string, number>;
  branding: BrandingDraft;
  /** Инициализация при открытии карточки */
  initProduct: (input: {
    productId: string;
    colorways: string[];
    sizes: string[];
  }) => void;
  setColorway: (code: string) => void;
  setQuantity: (size: string, qty: number) => void;
  applyPreset: (preset: Record<string, number>, sizes: string[]) => void;
  clearQuantities: (sizes: string[]) => void;
  setBranding: (patch: Partial<BrandingDraft>) => void;
  resetBranding: () => void;
};

function emptyQuantities(sizes: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const size of sizes) {
    result[size] = 0;
  }
  return result;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  productId: null,
  colorway: null,
  quantities: {},
  branding: emptyBranding(),

  initProduct: ({ productId, colorways, sizes }) => {
    const current = get();
    if (current.productId === productId) {
      // Тот же товар — дополняем размеры, цвет не сбрасываем
      const quantities = { ...emptyQuantities(sizes), ...current.quantities };
      for (const size of Object.keys(quantities)) {
        if (!sizes.includes(size)) delete quantities[size];
      }
      set({ quantities });
      return;
    }

    set({
      productId,
      colorway: colorways[0] ?? null,
      quantities: emptyQuantities(sizes),
      branding: emptyBranding(),
    });
  },

  setColorway: (code) => set({ colorway: code }),

  setQuantity: (size, qty) =>
    set((state) => ({
      quantities: {
        ...state.quantities,
        [size]: Math.max(0, Math.floor(qty)),
      },
    })),

  applyPreset: (preset, sizes) => {
    const next = emptyQuantities(sizes);
    for (const size of sizes) {
      if (preset[size] != null) next[size] = preset[size];
    }
    set({ quantities: next });
  },

  clearQuantities: (sizes) => set({ quantities: emptyQuantities(sizes) }),

  setBranding: (patch) =>
    set((state) => ({ branding: { ...state.branding, ...patch } })),

  resetBranding: () => set({ branding: emptyBranding() }),
}));
