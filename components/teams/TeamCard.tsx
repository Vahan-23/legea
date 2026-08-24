"use client";

import Image from "next/image";
import { useState } from "react";
import type { Team } from "@/data/teams";
import type { TeamSectionLabels } from "@/components/teams/labels";
import type { Locale } from "@/i18n/routing";
import {
  teamDisplayCountry,
  teamDisplayLeague,
  teamDisplayName,
} from "@/lib/teamLocale";

function countryFlagEmoji(code: string): string {
  const normalized = code.length === 2 ? code.toUpperCase() : "";
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return "";
  return String.fromCodePoint(
    ...normalized.split("").map((c) => 127397 + c.charCodeAt(0)),
  );
}

function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0] ?? "?").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

type TeamCardProps = {
  team: Team;
  labels: TeamSectionLabels;
  locale: Locale;
  /** Активная карточка: цвет */
  spotlight?: boolean;
  /** Остальные: серый «неактивный» вид */
  dimmed?: boolean;
};

export function TeamCard({
  team,
  labels,
  locale,
  spotlight = false,
  dimmed = false,
}: TeamCardProps) {
  const [failed, setFailed] = useState(false);
  const displayName = teamDisplayName(team, locale);
  const displayCountry = teamDisplayCountry(team, locale);
  const displayLeague = teamDisplayLeague(team, locale);
  const flag = countryFlagEmoji(team.countryCode);
  const sinceLabel = team.since != null ? labels.since(team.since) : null;

  const body = (
    <>
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-off-white sm:h-24 sm:w-24">
        {failed ? (
          <span
            className={`flex h-full w-full items-center justify-center rounded-full font-mono text-sm font-semibold text-white transition duration-500 ${
              dimmed ? "bg-navy/45" : "bg-navy"
            } ${spotlight ? "scale-110" : "scale-100"}`}
            aria-hidden
          >
            {initials(displayName)}
          </span>
        ) : (
          <Image
            src={team.logo}
            alt={labels.logoAlt(displayName)}
            width={96}
            height={96}
            loading="lazy"
            unoptimized
            onError={() => setFailed(true)}
            className={`team-logo ${dimmed ? "" : "team-logo--color"} ${
              spotlight ? "team-logo--live" : ""
            }`}
          />
        )}
      </div>

      <div className="mt-3 text-center">
        <p
          className={`text-sm font-semibold leading-snug transition-colors duration-300 ${
            dimmed ? "text-graphite/50" : "text-navy"
          } group-hover:text-navy`}
        >
          {displayName}
        </p>
        <p
          className={`mt-1 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors duration-300 ${
            dimmed ? "text-graphite/35" : "text-graphite/75"
          } group-hover:text-graphite/80`}
        >
          {flag ? (
            <span aria-hidden className="text-sm leading-none">
              {flag}
            </span>
          ) : null}
          <span>{displayCountry}</span>
        </p>
        {displayLeague ? (
          <p
            className={`mt-0.5 text-[11px] font-medium transition-colors duration-300 ${
              dimmed ? "text-graphite/30" : "text-graphite/60"
            } group-hover:text-graphite/65`}
          >
            {displayLeague}
          </p>
        ) : null}
        {sinceLabel ? (
          <span
            className={`mt-2 inline-block px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition duration-300 ${
              dimmed ? "bg-navy/15 text-navy/45" : "bg-navy text-white"
            } group-hover:bg-navy group-hover:text-white`}
          >
            {sinceLabel}
          </span>
        ) : null}
      </div>
    </>
  );

  const className =
    "group flex h-full flex-col items-center border border-navy/10 bg-white p-4 outline-none transition duration-300 hover:border-navy/20 focus-visible:border-navy/30 focus-visible:ring-2 focus-visible:ring-navy/20";

  if (team.url) {
    return (
      <a
        href={team.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {body}
      </a>
    );
  }

  return <article className={className}>{body}</article>;
}

export function TeamCardSkeleton() {
  return (
    <div
      className="flex h-full flex-col items-center border border-navy/10 bg-white p-4"
      aria-hidden
    >
      <div className="h-20 w-20 animate-pulse rounded-full bg-navy/10 sm:h-24 sm:w-24" />
      <div className="mt-3 h-4 w-24 animate-pulse rounded bg-navy/10" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-navy/5" />
    </div>
  );
}
