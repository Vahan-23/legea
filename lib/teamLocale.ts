import type { Team } from "@/data/teams";
import type { Locale } from "@/i18n/routing";

/** Нестандартные коды и особые названия */
const COUNTRY_LABELS: Partial<
  Record<string, Partial<Record<Locale, string>>>
> = {
  EH: {
    ru: "Западная Сахара",
    en: "Western Sahara",
    hy: "Արևմտյան Սահարա",
  },
  WLS: {
    ru: "Уэльс",
    en: "Wales",
    hy: "Ուելս",
  },
  KP: {
    ru: "КНДР",
    en: "North Korea",
    hy: "ԿԺՀ",
  },
  GI: {
    ru: "Гибралтар",
    en: "Gibraltar",
    hy: "Ջիբրալթար",
  },
};

const displayNames = new Map<string, Intl.DisplayNames>();

function regionDisplayNames(locale: Locale): Intl.DisplayNames | null {
  try {
    const key = locale === "hy" ? "hy" : locale;
    let cached = displayNames.get(key);
    if (!cached) {
      cached = new Intl.DisplayNames([key], { type: "region" });
      displayNames.set(key, cached);
    }
    return cached;
  } catch {
    return null;
  }
}

export function teamDisplayName(team: Team, locale: Locale): string {
  if (locale === "en") return team.nameEn;
  if (locale === "hy") return team.nameHy ?? team.nameEn;
  return team.name;
}

export function teamDisplayLeague(team: Team, locale: Locale): string | undefined {
  if (!team.league) return undefined;
  if (locale === "ru") return team.leagueRu ?? team.league;
  if (locale === "hy") return team.leagueHy ?? team.league;
  return team.league;
}

export function teamDisplayCountry(team: Team, locale: Locale): string {
  const override = COUNTRY_LABELS[team.countryCode]?.[locale];
  if (override) return override;

  if (locale === "ru") return team.country;

  const code =
    team.countryCode.length === 2 ? team.countryCode.toUpperCase() : null;
  if (code) {
    const dn = regionDisplayNames(locale);
    const label = dn?.of(code);
    if (label) return label;
  }

  return team.country;
}

export type TeamCountryOption = {
  code: string;
  label: string;
};

export function teamCountryOptions(
  teams: Team[],
  locale: Locale,
): TeamCountryOption[] {
  const byCode = new Map<string, Team>();
  for (const team of teams) {
    if (!byCode.has(team.countryCode)) {
      byCode.set(team.countryCode, team);
    }
  }

  return Array.from(byCode.entries())
    .map(([code, team]) => ({
      code,
      label: teamDisplayCountry(team, locale),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}
