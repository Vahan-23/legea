"use client";

import { useMemo, useState } from "react";
import type { Team } from "@/data/teams";

export type TeamStatusFilter = "current" | "history" | "all";

export type UseTeamFiltersOptions = {
  teams: Team[];
};

export type UseTeamFiltersResult = {
  status: TeamStatusFilter;
  setStatus: (value: TeamStatusFilter) => void;
  country: string;
  setCountry: (value: string) => void;
  countries: string[];
  filtered: Team[];
};

export function useTeamFilters({
  teams,
}: UseTeamFiltersOptions): UseTeamFiltersResult {
  const [status, setStatus] = useState<TeamStatusFilter>("current");
  const [country, setCountry] = useState("");

  const countries = useMemo(() => {
    const set = new Set(teams.map((t) => t.country));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [teams]);

  const filtered = useMemo(() => {
    return teams.filter((team) => {
      if (status === "current" && !team.current) return false;
      if (status === "history" && team.current) return false;
      if (country && team.country !== country) return false;
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
