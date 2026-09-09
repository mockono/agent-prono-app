import type { MatchImportance } from "../engine/scoring";
import type { FDStanding } from "./footballData";

/**
 * Quelques grands classiques connus, par nom d'équipe tel que renvoyé par
 * football-data.org. ⚠️ Ces noms exacts n'ont pas pu être vérifiés contre
 * la vraie API (pas d'accès réseau ici) — si un derby connu ne se déclenche
 * pas, dis-moi le nom exact que l'API renvoie pour ces équipes et je corrige
 * la liste. Liste volontairement courte et non exhaustive, à enrichir au fil
 * de l'eau plutôt que de deviner des dizaines de noms non vérifiés.
 */
const KNOWN_DERBIES: [string, string][] = [
  ["Real Madrid CF", "FC Barcelona"],
  ["Club Atlético de Madrid", "Real Madrid CF"],
  ["Manchester United FC", "Manchester City FC"],
  ["Liverpool FC", "Everton FC"],
  ["Arsenal FC", "Tottenham Hotspur FC"],
  ["AC Milan", "FC Internazionale Milano"],
  ["AS Roma", "SS Lazio"],
  ["Paris Saint-Germain FC", "Olympique de Marseille"],
  ["Borussia Dortmund", "FC Bayern München"],
  ["Juventus FC", "Torino FC"],
];

function isDerby(homeName: string, awayName: string): boolean {
  return KNOWN_DERBIES.some(([a, b]) => (homeName === a && awayName === b) || (homeName === b && awayName === a));
}

export function deriveImportance(
  homeName: string,
  awayName: string,
  homePosition: number | undefined,
  awayPosition: number | undefined,
  leagueSize: number | undefined
): MatchImportance {
  if (isDerby(homeName, awayName)) return "derby";

  if (homePosition != null && awayPosition != null && leagueSize) {
    const titleZone = 4;
    const relegationZoneStart = leagueSize - 3;
    if (homePosition <= titleZone && awayPosition <= titleZone) return "title_race";
    if (homePosition >= relegationZoneStart && awayPosition >= relegationZoneStart) return "relegation_battle";
  }

  return "normal";
}

export function positionOf(standings: FDStanding[], teamId: number): number | undefined {
  return standings.find((s) => s.team.id === teamId)?.position;
}