export type TeamSectionLabels = {
  title: string;
  subtitle: string;
  tabCurrent: string;
  tabHistory: string;
  tabAll: string;
  countryAll: string;
  countryLabel: string;
  /** Форматированный счётчик, напр. «Найдено: 12» */
  found: (count: number) => string;
  empty: string;
  since: (year: number) => string;
  logoAlt: (name: string) => string;
};

/** Дефолтные RU-тексты; на страницах подменяйте через next-intl. */
export const defaultTeamLabels: TeamSectionLabels = {
  title: "Нам доверяют",
  subtitle: "Клубы и сборные, которые выбирают экипировку Legea",
  tabCurrent: "Действующие",
  tabHistory: "История",
  tabAll: "Все",
  countryAll: "Все страны",
  countryLabel: "Страна",
  found: (count) => `Найдено: ${count}`,
  empty: "Ничего не найдено. Измените фильтры или запрос.",
  since: (year) => `с ${year}`,
  logoAlt: (name) => `Логотип ${name}`,
};
