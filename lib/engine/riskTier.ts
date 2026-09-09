/**
 * Traduit le score de confiance /100 en un niveau de risque à 3 paliers,
 * utilisé à la fois pour l'affichage (badge coloré sur la carte) et pour
 * la sélection des matchs dans les tickets (voir ticketBuilder.ts).
 *
 *   70-100 -> SAFE   (vert)
 *   50-69  -> MID    (jaune) — affiché avec le pronostic lui-même, pas un mot générique
 *   <50    -> CRAZY  (rouge)
 */
export type RiskTier = "SAFE" | "MID" | "CRAZY";

export function riskTierOf(confidenceScore: number): RiskTier {
  if (confidenceScore >= 70) return "SAFE";
  if (confidenceScore >= 50) return "MID";
  return "CRAZY";
}

export const RISK_TIER_META: Record<RiskTier, { color: string; bg: string }> = {
  SAFE: { color: "#3d8b5f", bg: "rgba(61, 139, 95, 0.12)" },
  MID: { color: "#e8c33d", bg: "rgba(232, 195, 61, 0.12)" },
  CRAZY: { color: "#c1443c", bg: "rgba(193, 68, 60, 0.12)" },
};