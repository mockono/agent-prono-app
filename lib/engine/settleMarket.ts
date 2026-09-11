/**
 * Évalue si un marché est gagné ou perdu une fois le score final connu.
 * Couvre les marchés que le sélecteur de marché peut effectivement choisir
 * (voir lib/engine/marketSelector.ts) — 1X2, double chance, over/under,
 * BTTS. Un marché non reconnu retourne "lost" par prudence plutôt que de
 * planter (ne devrait normalement jamais arriver).
 */
export function evaluateMarket(market: string, homeGoals: number, awayGoals: number): "won" | "lost" {
  const total = homeGoals + awayGoals;
  switch (market) {
    case "1":
      return homeGoals > awayGoals ? "won" : "lost";
    case "X":
      return homeGoals === awayGoals ? "won" : "lost";
    case "2":
      return awayGoals > homeGoals ? "won" : "lost";
    case "1X":
      return homeGoals >= awayGoals ? "won" : "lost";
    case "X2":
      return awayGoals >= homeGoals ? "won" : "lost";
    case "OVER_15":
      return total >= 2 ? "won" : "lost";
    case "UNDER_15":
      return total < 2 ? "won" : "lost";
    case "OVER_25":
      return total >= 3 ? "won" : "lost";
    case "UNDER_25":
      return total < 3 ? "won" : "lost";
    case "BTTS_YES":
      return homeGoals >= 1 && awayGoals >= 1 ? "won" : "lost";
    case "BTTS_NO":
      return homeGoals >= 1 && awayGoals >= 1 ? "lost" : "won";
    default:
      return "lost";
  }
}