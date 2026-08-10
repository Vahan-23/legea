"use client";

import { Html, useProgress } from "@react-three/drei";

export function CanvasLoader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="font-mono text-xs uppercase tracking-widest text-navy">
        {Math.round(progress)}%
      </div>
    </Html>
  );
}
