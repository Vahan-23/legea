"use client";

import { useEffect, useId, useState } from "react";
import { TEAMS, type Team } from "@/data/teams";
import {
  defaultTeamLabels,
  type TeamSectionLabels,
} from "@/components/teams/labels";
import { TeamCard, TeamCardSkeleton } from "@/components/teams/TeamCard";
import {
  useTeamFilters,
  type TeamStatusFilter,
} from "@/hooks/useTeamFilters";

type TeamsSectionProps = {
  teams?: Team[];
  labels?: TeamSectionLabels;
  preferEnglish?: boolean;
  className?: string;
};

const TABS: TeamStatusFilter[] = ["current", "history", "all"];

export function TeamsSection({
  teams = TEAMS,
  labels = defaultTeamLabels,
  preferEnglish = false,
  className,
}: TeamsSectionProps) {
  const tablistId = useId();
  const [mounted, setMounted] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const filters = useTeamFilters({ teams });
  const filteredIds = filters.filtered.map((t) => t.id).join(",");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setSpotlightIndex(0);
  }, [filteredIds]);

  useEffect(() => {
    if (reduceMotion || !mounted || filters.filtered.length === 0) return;
    const id = window.setInterval(() => {
      setSpotlightIndex((i) => (i + 1) % filters.filtered.length);
    }, 500);
    return () => window.clearInterval(id);
  }, [reduceMotion, mounted, filters.filtered.length, filteredIds]);

  const tabLabel = (key: TeamStatusFilter) => {
    if (key === "current") return labels.tabCurrent;
    if (key === "history") return labels.tabHistory;
    return labels.tabAll;
  };

  return (
    <section
      className={className ?? "hex-bg-muted"}
      aria-labelledby={`${tablistId}-title`}
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2
          id={`${tablistId}-title`}
          className="font-display text-display-sm uppercase tracking-display text-navy"
        >
          {labels.title}
        </h2>
        <p className="mt-3 max-w-xl text-base text-graphite/80">
          {labels.subtitle}
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div
            role="tablist"
            aria-label={labels.title}
            className="flex flex-wrap gap-1 border-b border-navy/20"
          >
            {TABS.map((key) => {
              const selected = filters.status === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`${tablistId}-tab-${key}`}
                  aria-selected={selected}
                  aria-controls={`${tablistId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => filters.setStatus(key)}
                  className={`border-b-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 ${
                    selected
                      ? "border-blue text-navy"
                      : "border-transparent text-graphite/70 hover:text-navy"
                  }`}
                >
                  {tabLabel(key)}
                </button>
              );
            })}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-graphite">
              <span className="sr-only sm:not-sr-only">{labels.countryLabel}</span>
              <select
                value={filters.country}
                onChange={(e) => filters.setCountry(e.target.value)}
                className="min-w-[10rem] border border-navy/25 bg-white px-3 py-2 text-sm font-medium text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40"
              >
                <option value="">{labels.countryAll}</option>
                {filters.countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p
          className="mt-4 font-mono text-xs font-medium text-graphite/70"
          aria-live="polite"
        >
          {labels.found(filters.filtered.length)}
        </p>

        <div
          role="tabpanel"
          id={`${tablistId}-panel`}
          aria-labelledby={`${tablistId}-tab-${filters.status}`}
          className="mt-6"
        >
          {!mounted ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => (
                <li key={i}>
                  <TeamCardSkeleton />
                </li>
              ))}
            </ul>
          ) : filters.filtered.length === 0 ? (
            <p className="border border-dashed border-navy/30 bg-white px-6 py-16 text-center text-sm font-medium text-graphite">
              {labels.empty}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-6">
              {filters.filtered.map((team, index) => {
                const isSpotlight =
                  !reduceMotion && index === spotlightIndex;
                return (
                  <li key={team.id}>
                    <TeamCard
                      team={team}
                      labels={labels}
                      preferEnglish={preferEnglish}
                      spotlight={isSpotlight}
                      dimmed={!reduceMotion && !isSpotlight}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="section-rule" />
    </section>
  );
}
