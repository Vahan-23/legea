"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const SHOW_AFTER_PX = 480;

/**
 * Плавающая кнопка «наверх» — появляется после прокрутки.
 */
export function ScrollToTop() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  const goTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label={`${t("scrollToTopBrand")} — ${t("scrollToTop")}`}
      className={`fixed bottom-5 right-3 z-40 flex flex-col items-center gap-0.5 bg-transparent p-0 text-navy transition duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 sm:bottom-8 sm:right-5 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <Image
        src="/images/up.png"
        alt=""
        width={48}
        height={48}
        className="h-10 w-10 object-contain sm:h-11 sm:w-11"
        aria-hidden
        unoptimized
      />
      <span className="font-display text-[9px] uppercase leading-none tracking-[0.18em]">
        {t("scrollToTopBrand")}
      </span>
      <span className="font-mono text-[8px] uppercase leading-none tracking-wide text-graphite/70">
        {t("scrollToTop")}
      </span>
    </button>
  );
}
