import type { MatchAnalysis } from "./matchAnalysis";

export type Forfait = "BASIC" | "FUN" | "PRO" | "MONTANTE";
export type ProSubtier = "PRO_18_50" | "PRO_50_150" | "PRO_150_500" | "PRO_500_1500";

export interface ForfaitRange {
  min: number;
  max: number;
}

export const FORFAIT_RANGES: Record<Exclude<Forfait, "MONTANTE">, ForfaitRange> = {
  BASIC: { min: 3, max: 6 },
  FUN: { min: 6, max: 18 },
  PRO: { min: 18, max: 1500 },
};

export const PRO_SUBTIER_RANGES: Record<ProSubtier, ForfaitRange> = {
  PRO_18_50: { min: 18, max: 50 },
  PRO_50_150: { min: 50, max: 150 },
  PRO_150_500: { min: 150, max: 500 },
  PRO_500_1500: { min: 500, max: 1500 },
};

export interface TicketSelection {
  analysis: MatchAnalysis;
  market: string;
  selectionDetail: string;
  odds: number;
}

export interface TicketResult {
  forfait: Forfait;
  proSubtier?: ProSubtier;
  montanteStep?: number;
  selections: TicketSelection[];
  totalOdds: number;
  targetRange: ForfaitRange;
  status: "ok" | "insufficient_data";
  message?: string;
}

/**
 * §11-15 du prompt maître : construit un ticket dont la cote totale tombe
 * dans la fourchette de la formule choisie, en priorisant les meilleurs
 * scores de confiance. Ne JAMAIS ajouter un match uniquement pour
 * atteindre une cote — si la fourchette n'est pas atteignable avec le
 * pool de matchs disponibles (score de confiance suffisant + marché avec
 * edge positive), on retourne le meilleur ticket possible sous le
 * plafond, avec un statut "insufficient_data" explicite plutôt que de
 * forcer une sélection artificielle.
 */
export function buildTicket(
  analyses: MatchAnalysis[],
  forfait: Forfait,
  options: { proSubtier?: ProSubtier; montanteStep?: number; minConfidence?: number } = {}
): TicketResult {
  const range: ForfaitRange =
    forfait === "PRO" && options.proSubtier
      ? PRO_SUBTIER_RANGES[options.proSubtier]
      : forfait === "MONTANTE"
      ? { min: 1, max: Infinity } // la montante n'a pas de contrainte de cote, mais de nombre de matchs
      : FORFAIT_RANGES[forfait as Exclude<Forfait, "MONTANTE">];

  const minConfidence = options.minConfidence ?? (forfait === "BASIC" ? 65 : forfait === "FUN" ? 55 : 0);

  // Ne retenir que les matchs où le moteur a trouvé un marché avec une edge positive,
  // triés par score de confiance décroissant (§14 : "éliminer les matchs à faible confiance").
  const eligible = analyses
    .filter((a) => a.bestMarket && a.confidence.totalScore >= minConfidence)
    .sort((a, b) => b.confidence.totalScore - a.confidence.totalScore);

  const targetCount = forfait === "MONTANTE" ? options.montanteStep ?? 10 : undefined;

  const selections: TicketSelection[] = [];
  let totalOdds = 1;

  for (const analysis of eligible) {
    if (targetCount !== undefined && selections.length >= targetCount) break;
    const market = analysis.bestMarket!;
    if (!market.odds) continue;

    const projected = totalOdds * market.odds;
    // Pour Basic/Fun/Pro : ne pas dépasser le plafond de la fourchette.
    if (targetCount === undefined && projected > range.max && selections.length > 0) continue;

    selections.push({
      analysis,
      market: market.market,
      selectionDetail: market.selectionDetail,
      odds: market.odds,
    });
    totalOdds = projected;

    if (targetCount === undefined && totalOdds >= range.min && totalOdds <= range.max) {
      // Fourchette atteinte : on peut s'arrêter dès que le minimum est franchi
      // (on continue seulement si un match supplémentaire de haute confiance reste pertinent).
      break;
    }
  }

  if (targetCount !== undefined) {
    // MONTANTE : on visait un nombre de matchs précis
    if (selections.length < targetCount) {
      return {
        forfait,
        montanteStep: targetCount,
        selections,
        totalOdds,
        targetRange: range,
        status: "insufficient_data",
        message: `Seulement ${selections.length}/${targetCount} matchs éligibles disponibles dans le pool actuel (données de démo limitées). Le moteur refuse d'en ajouter artificiellement.`,
      };
    }
    return { forfait, montanteStep: targetCount, selections, totalOdds, targetRange: range, status: "ok" };
  }

  if (totalOdds < range.min) {
    return {
      forfait,
      proSubtier: options.proSubtier,
      selections,
      totalOdds,
      targetRange: range,
      status: "insufficient_data",
      message: `Cote totale atteinte (${totalOdds.toFixed(2)}) inférieure à la fourchette ${forfait} (${range.min}–${range.max}). Le pool de matchs actuel (démo) est trop restreint — le moteur refuse d'ajouter un match artificiellement.`,
    };
  }

  return { forfait, proSubtier: options.proSubtier, selections, totalOdds, targetRange: range, status: "ok" };
}
