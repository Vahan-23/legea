"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptyBranding,
  makeSpecItemKey,
  totalPieces,
  type BrandingDraft,
  type SpecItem,
} from "@/types/spec";
import type { LocalizedName } from "@/types/product";

type AddSpecPayload = {
  productId: string;
  catalogId: string;
  name: LocalizedName;
  colorway: string;
  quantities: Record<string, number>;
  branding?: BrandingDraft | null;
  comment?: string;
  kitId?: string;
  previewDataUrl?: string;
};

type SpecStore = {
  items: SpecItem[];
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (payload: AddSpecPayload) => string;
  updateQuantities: (key: string, quantities: Record<string, number>) => void;
  updateComment: (key: string, comment: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  positionCount: () => number;
  pieceCount: () => number;
};

export const useSpecStore = create<SpecStore>()(
  persist(
    (set, get) => ({
      items: [],
      drawerOpen: false,
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      addItem: (payload) => {
        const branding = payload.branding ?? emptyBranding();
        const hasBranding =
          Boolean(branding.logoDataUrl) ||
          branding.zones.length > 0 ||
          Boolean(branding.playerNumber) ||
          Boolean(branding.playerName) ||
          branding.method != null;

        const key = makeSpecItemKey(
          payload.productId,
          payload.colorway,
          hasBranding ? branding : null,
        );

        const cleaned: Record<string, number> = {};
        for (const [size, qty] of Object.entries(payload.quantities)) {
          if (qty > 0) cleaned[size] = qty;
        }

        set((state) => {
          const existing = state.items.find((item) => item.key === key);
          if (existing) {
            const merged = { ...existing.quantities };
            for (const [size, qty] of Object.entries(cleaned)) {
              merged[size] = (merged[size] ?? 0) + qty;
            }
            return {
              items: state.items.map((item) =>
                item.key === key ? { ...item, quantities: merged } : item,
              ),
              drawerOpen: true,
            };
          }

          const item: SpecItem = {
            key,
            productId: payload.productId,
            catalogId: payload.catalogId,
            name: payload.name,
            colorway: payload.colorway,
            quantities: cleaned,
            branding: hasBranding ? branding : null,
            comment: payload.comment ?? "",
            kitId: payload.kitId,
            previewDataUrl: payload.previewDataUrl,
            addedAt: Date.now(),
          };

          return { items: [...state.items, item], drawerOpen: true };
        });

        return key;
      },
      updateQuantities: (key, quantities) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.key === key ? { ...item, quantities } : item,
          ),
        })),
      updateComment: (key, comment) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.key === key ? { ...item, comment } : item,
          ),
        })),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((item) => item.key !== key),
        })),
      clear: () => set({ items: [] }),
      positionCount: () => get().items.length,
      pieceCount: () =>
        get().items.reduce(
          (sum, item) => sum + totalPieces(item.quantities),
          0,
        ),
    }),
    {
      name: "legea-spec",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
