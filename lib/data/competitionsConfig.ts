/**
 * Championnats actifs (codes football-data.org + clé de sport The Odds API
 * correspondante pour les cotes).
 *
 * Limité aux 12 championnats gratuits de football-data.org — la Suisse, le
 * Danemark, la Belgique et l'Australie du prompt maître n'y sont pas
 * disponibles gratuitement. Il faudra une source complémentaire pour ceux-là.
 */
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
  { code: "BL1", name: "Bundesliga", country: "Allemagne", oddsSportKey: "soccer_germany_bundesliga" },
  { code: "CL", name: "UEFA Champions League", country: "Europe", oddsSportKey: "soccer_uefa_champs_league" },
];