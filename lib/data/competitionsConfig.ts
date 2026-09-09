export interface LeagueConfig {
  code: string;
  name: string;
  country: string;
  oddsSportKey: string;
}

export const ACTIVE_LEAGUES: LeagueConfig[] = [
  { code: "PL", name: "Premier League", country: "Angleterre", oddsSportKey: "soccer_epl" },
  { code: "PD", name: "La Liga", country: "Espagne", oddsSportKey: "soccer_spain_la_liga" },
  { code: "SA", name: "Serie A", country: "Italie", oddsSportKey: "soccer_italy_serie_a" },
  { code: "FL1", name: "Ligue 1", country: "France", oddsSportKey: "soccer_france_ligue_one" },
];