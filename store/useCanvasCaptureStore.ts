"use client";

import { create } from "zustand";
import type { WebGLRenderer } from "three";
import { captureCanvasPng } from "@/lib/logo";

type CanvasCaptureStore = {
  renderer: WebGLRenderer | null;
  setRenderer: (renderer: WebGLRenderer | null) => void;
  /** PNG data URL 1600×1600 или null */
  capture: (whiteBackground: boolean) => string | null;
};

export const useCanvasCaptureStore = create<CanvasCaptureStore>((set, get) => ({
  renderer: null,
  setRenderer: (renderer) => set({ renderer }),
  capture: (whiteBackground) => {
    const { renderer } = get();
    if (!renderer) return null;
    return captureCanvasPng(renderer.domElement, { whiteBackground, size: 1600 });
  },
}));
