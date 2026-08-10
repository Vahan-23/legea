"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { colorMap, colors } from "@/data/colors";

const TILES = [
  { key: "football", href: "/catalog?category=calcio", tone: colors.blue },
  { key: "volley", href: "/catalog?category=volley", tone: colors.navy },
  {
    key: "basket",
    href: "/catalog?category=basket",
    tone: colorMap["12"].hex,
  },
  {
    key: "suits",
    href: "/catalog?type=tute",
    tone: colors.graphite,
  },
  {
    key: "accessories",
    href: "/catalog?type=borse",
    tone: colors.muted,
  },
] as const;

export function HomeCategories() {
  const t = useTranslations("home.categories");

  return (
    <section className="hex-bg-muted">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-display-sm text-navy">{t("title")}</h2>
        <p className="mt-3 max-w-xl text-muted">{t("subtitle")}</p>
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile, index) => (
            <li
              key={tile.key}
              className={index === 0 ? "md:col-span-2 lg:col-span-2" : ""}
            >
              <CategoryTile
                href={tile.href}
                label={t(tile.key)}
                tone={tile.tone}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="section-rule" />
    </section>
  );
}

function CategoryTile({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "translate(0, 0)";
      }}
      className="transition-transform duration-200"
    >
      <Link
        href={href}
        className="relative flex min-h-[180px] items-end overflow-hidden p-6"
        style={{ backgroundColor: tone }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(/patterns/hex.svg)",
            backgroundSize: "56px 100px",
          }}
        />
        <span className="relative font-display text-2xl uppercase tracking-display text-white md:text-3xl">
          {label}
        </span>
      </Link>
    </div>
  );
}
