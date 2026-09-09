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
];