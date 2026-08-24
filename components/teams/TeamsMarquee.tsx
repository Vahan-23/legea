"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { TEAMS, type Team } from "@/data/teams";

type TeamsMarqueeProps = {
  teams?: Team[];
  /** Только действующие контракты (по умолчанию да). */
  currentOnly?: boolean;
  className?: string;
  preferEnglish?: boolean;
};

function logoAlt(team: Team, preferEnglish: boolean): string {
  const name = preferEnglish ? team.nameEn : team.name;
  return `Логотип ${name}`;
}

export function TeamsMarquee({
  teams = TEAMS,
  currentOnly = true,
  className,
  preferEnglish = false,
}: TeamsMarqueeProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const list = (currentOnly ? teams.filter((t) => t.current) : teams).filter(
    (t) => t.logo,
  );

  if (list.length === 0) return null;

  if (reducedMotion) {
    return (
      <div className={className}>
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {list.map((team) => (
            <li
              key={team.id}
              className="flex aspect-[4/3] items-center justify-center border border-navy/10 bg-white p-3"
            >
              <Image
                src={team.logo}
                alt={logoAlt(team, preferEnglish)}
                width={80}
                height={80}
                loading="lazy"
                unoptimized
                className="h-12 w-12 object-contain sm:h-14 sm:w-14"
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const loop = [...list, ...list];

  return (
    <div className={`teams-marquee group/marquee overflow-hidden ${className ?? ""}`}>
      <div className="teams-marquee__track flex w-max gap-10 py-2">
        {loop.map((team, index) => (
          <div
            key={`${team.id}-${index}`}
            className="flex h-16 w-28 shrink-0 items-center justify-center sm:h-20 sm:w-32"
            aria-hidden={index >= list.length}
          >
            <Image
              src={team.logo}
              alt={index < list.length ? logoAlt(team, preferEnglish) : ""}
              width={96}
              height={96}
              loading="lazy"
              unoptimized
              className="h-12 w-auto max-w-[7rem] object-contain sm:h-14"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
