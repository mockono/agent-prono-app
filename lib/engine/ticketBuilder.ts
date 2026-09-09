import type { MatchAnalysis } from "./matchAnalysis";
import { riskTierOf } from "./riskTier";

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

interface FillState {
  selections: TicketSelection[];
  totalOdds: number;
}

function toSelection(analysis: MatchAnalysis): TicketSelection | null {
  const market = analysis.bestMarket;
  if (!market || !market.odds) return null;
  return { analysis, market: market.market, selectionDetail: market.selectionDetail, odds: market.odds };
}

function greedyFill(pool: MatchAnalysis[], range: ForfaitRange): FillState {
  const selections: TicketSelection[] = [];
  let totalOdds = 1;
  for (const analysis of pool) {
    const sel = toSelection(analysis);
    if (!sel) continue;
    const projected = totalOdds * sel.odds;
    if (projected > range.max && selections.length > 0) continue;
    selections.push(sel);
    totalOdds = projected;
    if (totalOdds >= range.min && totalOdds <= range.max) break;
  }
  return { selections, totalOdds };
}

function topUp(state: FillState, extraPool: MatchAnalysis[], range: ForfaitRange, maxExtra: number): FillState {
  const usedIds = new Set(state.selections.map((s) => s.analysis.match.id));
  let added = 0;
  let { selections, totalOdds } = state;
  for (const analysis of extraPool) {
    if (added >= maxExtra || totalOdds >= range.min) break;
    if (usedIds.has(analysis.match.id)) continue;
    const sel = toSelection(analysis);
    if (!sel) continue;
    const projected = totalOdds * sel.odds;
    if (projected > range.max && selections.length > 0) continue;
    selections = [...selections, sel];
    totalOdds = projected;
    added++;
  }
  return { selections, totalOdds };
}

export function buildTicket(
  analyses: MatchAnalysis[],
  forfait: Forfait,
  options: { proSubtier?: ProSubtier; montanteStep?: number } = {}
): TicketResult {
  const range: ForfaitRange =
    forfait === "PRO" && options.proSubtier
      ? PRO_SUBTIER_RANGES[options.proSubtier]
      : forfait === "MONTANTE"
      ? { min: 1, max: Infinity }
      : FORFAIT_RANGES[forfait as Exclude<Forfait, "MONTANTE">];

  const eligible = analyses
    .filter((a) => a.bestMarket)
    .sort((a, b) => b.confidence.totalScore - a.confidence.totalScore);

  const safe = eligible.filter((a) => riskTierOf(a.confidence.totalScore) === "SAFE");
  const mid = eligible.filter((a) => riskTierOf(a.confidence.totalScore) === "MID");
  const crazy = eligible.filter((a) => riskTierOf(a.confidence.totalScore) === "CRAZY");

  if (forfait === "MONTANTE") {
    const targetCount = options.montanteStep ?? 10;
    const selections: TicketSelection[] = [];
    let totalOdds = 1;
    for (const analysis of eligible) {
      if (selections.length >= targetCount) break;
      const sel = toSelection(analysis);
      if (!sel) continue;
      selections.push(sel);
      totalOdds *= sel.odds;
    }
    if (selections.length < targetCount) {
      return {
        forfait,
        montanteStep: targetCount,
        selections,
        totalOdds,
        targetRange: range,
        status: "insufficient_data",
        message: `Seulement ${selections.length}/${targetCount} matchs éligibles disponibles dans le pool actuel. Le moteur refuse d'en ajouter artificiellement.`,
      };
    }
    return { forfait, montanteStep: targetCount, selections, totalOdds, targetRange: range, status: "ok" };
  }

  let state: FillState;
  let insufficientMessage: string;

  if (forfait === "BASIC") {
    state = greedyFill(safe, range);
    if (state.totalOdds < range.min) state = topUp(state, mid, range, 2);
    insufficientMessage = `Cote atteinte (${state.totalOdds.toFixed(2)}) inférieure à la fourchette Basic (${range.min}–${range.max}) même après complément avec des picks Fun. Le pool actuel est trop restreint.`;
  } else if (forfait === "FUN") {
    state = greedyFill([...safe, ...mid].sort((a, b) => b.confidence.totalScore - a.confidence.totalScore), range);
    if (state.totalOdds < range.min) state = topUp(state, crazy, range, 2);
    insufficientMessage = `Cote atteinte (${state.totalOdds.toFixed(2)}) inférieure à la fourchette Fun (${range.min}–${range.max}) même après complément avec 1-2 picks Crazy. Le pool actuel est trop restreint.`;
  } else {
    state = greedyFill(safe, range);
    insufficientMessage = `Cote atteinte (${state.totalOdds.toFixed(2)}) inférieure à la fourchette ${forfait} (${range.min}–${range.max}). Le forfait Pro reste Safe uniquement par principe — le moteur refuse de descendre en risque pour compenser un pool trop restreint.`;
  }

  if (state.totalOdds < range.min) {
    return {
      forfait,
      proSubtier: options.proSubtier,
      selections: state.selections,
      totalOdds: state.totalOdds,
      targetRange: range,
      status: "insufficient_data",
      message: insufficientMessage,
    };
  }

  return {
    forfait,
    proSubtier: options.proSubtier,
    selections: state.selections,
    totalOdds: state.totalOdds,
    targetRange: range,
    status: "ok",
  };
}