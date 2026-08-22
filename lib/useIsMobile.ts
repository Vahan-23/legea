"use client";

import { useEffect, useState } from "react";

let sharedMobile: boolean | null = null;
const listeners = new Set<(value: boolean) => void>();
let mqBound = false;

function bindMediaQuery() {
  if (mqBound || typeof window === "undefined") return;
  mqBound = true;
  const mq = window.matchMedia("(max-width: 767px)");
  sharedMobile = mq.matches;
  const update = () => {
    sharedMobile = mq.matches;
    for (const listener of listeners) listener(mq.matches);
  };
  mq.addEventListener("change", update);
}

/** Один matchMedia на всё приложение вместо N на карточку. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => sharedMobile ?? false);

  useEffect(() => {
    bindMediaQuery();
    if (sharedMobile !== null) setMobile(sharedMobile);
    listeners.add(setMobile);
    return () => {
      listeners.delete(setMobile);
    };
  }, []);

  return mobile;
}
