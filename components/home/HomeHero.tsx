"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

const HERO_IMAGE = "/3D/FashionModels/comand.png";

export function HomeHero() {
  const t = useTranslations("home");
  const sectionRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ctx = gsap.context(() => {
      if (!brandRef.current) return;
      const letters = brandRef.current.querySelectorAll("[data-letter]");
      if (reduced) {
        gsap.set(letters, { clipPath: "inset(0 0 0 0)" });
        return;
      }
      gsap.fromTo(
        letters,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const brand = t("brand");

  return (
    <section
      ref={sectionRef}
      className="hex-bg relative min-h-[100svh] overflow-hidden"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:gap-4 lg:py-16">
        <div className="relative z-10 space-y-8">
          <h1
            ref={brandRef}
            className="text-display-lg flex flex-wrap gap-x-1 text-navy"
            aria-label={brand}
          >
            {brand.split("").map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                data-letter
                className="inline-block"
                style={{ clipPath: "inset(0 100% 0 0)" }}
              >
                {letter}
              </span>
            ))}
          </h1>
          <p className="max-w-md text-lg text-muted">{t("subtitle")}</p>
          <div className="flex flex-wrap gap-4">
            <Button href="/catalog">{t("ctaCatalog")}</Button>
            <Button href="/catalog?type=maglie" variant="secondary">
              {t("ctaBuilder")}
            </Button>
          </div>
        </div>

        <Link
          href="/catalog"
          className="relative mx-auto flex h-[min(72svh,680px)] w-full max-w-3xl items-center justify-center overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-blue lg:max-w-none lg:h-[min(85svh,820px)]"
          aria-label={t("ctaCatalog")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMAGE}
            alt=""
            decoding="async"
            className="h-full w-full object-contain transition-transform duration-700 ease-out hover:scale-[1.02]"
          />
        </Link>
      </div>
      <div className="section-rule" />
    </section>
  );
}
