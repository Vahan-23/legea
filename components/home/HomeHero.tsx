"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { brandLogoGlbPath } from "@/lib/models";

const Scene = dynamic(
  () => import("@/components/canvas/Scene").then((m) => m.Scene),
  { ssr: false },
);

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
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 lg:grid-cols-2 lg:py-24">
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

        <div className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden">
          <Scene
            glbUrl={brandLogoGlbPath()}
            preserveMaterials
            model={null}
            colorway={null}
            mobile={false}
            transparent
            interactive={false}
            modelScale={0.85}
          />
        </div>
      </div>
      <div className="section-rule" />
    </section>
  );
}
