"use client";

import { useMemo } from "react";
import * as THREE from "three";

/** Процедурная normalMap переплетения ткани (без внешнего файла). */
export function createFabricNormalMap(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = "#8080ff";
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const v = 110 + ((x + y) % 4) * 12;
      ctx.fillStyle = `rgb(${v},${v},255)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

export function useFabricNormalMap(): THREE.CanvasTexture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    return createFabricNormalMap();
  }, []);
}

export function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}
