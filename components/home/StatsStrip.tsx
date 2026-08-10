"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

type StatsStripProps = {
  productCount: number;
  colorwayCount: number;
  deliveryDays: number;
  moq: number;
};

export function StatsStrip({
  productCount,
  colorwayCount,
  deliveryDays,
  moq,
}: StatsStripProps) {
  const t = useTranslations("home.stats");
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ctx = gsap.context(() => {
      const nodes = ref.current?.querySelectorAll("[data-count]");
      if (!nodes) return;

      nodes.forEach((node) => {
        const el = node as HTMLElement;
        const target = Number(el.dataset.count ?? "0");
        if (reduced) {
          el.textContent = String(target);
          return;
        }
        const obj = { value: 0 };
        gsap.to(obj, {
          value: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.value));
          },
        });
      });
    }, ref);

    return () => ctx.revert();
  }, [productCount, colorwayCount, deliveryDays, moq]);

  const items = [
    { value: productCount, label: t("articles") },
    { value: colorwayCount, label: t("colorways") },
    { value: deliveryDays, label: t("delivery") },
    { value: moq, label: t("moq") },
  ];

  return (
    <section ref={ref} className="border-b border-blue bg-navy text-white">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
        {items.map((item) => (
          <li key={item.label} className="text-center md:text-left">
            <p
              className="font-mono text-4xl tracking-tight md:text-5xl"
              data-count={item.value}
            >
              0
            </p>
            <p className="mt-2 text-sm uppercase tracking-wide text-white/70">
              {item.label}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
