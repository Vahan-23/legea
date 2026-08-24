"use client";

import { useMemo, useState } from "react";
import type { Team } from "@/data/teams";
import type { Locale } from "@/i18n/routing";
import { teamCountryOptions } from "@/lib/teamLocale";

export type TeamStatusFilter = "current" | "history" | "all";

export type UseTeamFiltersOptions = {
  teams: Team[];
  locale: Locale;
};

export type UseTeamFiltersResult = {
  status: TeamStatusFilter;
  setStatus: (value: TeamStatusFilter) => void;
  /** countryCode или "" */
  country: string;
  setCountry: (value: string) => void;
  countries: ReturnType<typeof teamCountryOptions>;
  filtered: Team[];
};

export function useTeamFilters({
  teams,
  locale,
}: UseTeamFiltersOptions): UseTeamFiltersResult {
  const [status, setStatus] = useState<TeamStatusFilter>("current");
  const [country, setCountry] = useState("");

  const countries = useMemo(
    () => teamCountryOptions(teams, locale),
    [teams, locale],
  );

  const filtered = useMemo(() => {
    return teams.filter((team) => {
      if (status === "current" && !team.current) return false;
      if (status === "history" && team.current) return false;
      if (country && team.countryCode !== country) return false;
      return true;
    });
  }, [teams, status, country]);

  return {
    status,
    setStatus,
    country,
    setCountry,
    countries,
    filtered,
  };
}
