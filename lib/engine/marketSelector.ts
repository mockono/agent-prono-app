import type { OddsSnapshot } from "./scoring";
import type { MarketProbabilities } from "./poissonModel";

export interface MarketCandidate {
  market: string;
  selectionDetail: string;
  estimatedProbability: number;
  odds?: number;
}

export function impliedProbability(c: MarketCandidate): number | null {
  if (!c.odds || c.odds <= 1.0) return null;
  return 1 / c.odds;
}
export function edge(c: MarketCandidate): number | null {
  const implied = impliedProbability(c);
  if (implied === null) return null;
  return c.estimatedProbability - implied;
}
export function valueScore(c: MarketCandidate): number | null {
  const e = edge(c);
  if (e === null || e <= 0) return null;
  const riskPenalty = c.odds ? 1 / (1 + Math.max(c.odds - 3, 0) * 0.15) : 1;
  return e * riskPenalty;
}

export function buildMarketCandidates(
  probs: MarketProbabilities,
  odds: OddsSnapshot,
  homeName: string,
  awayName: string
): MarketCandidate[] {
  const candidates: MarketCandidate[] = [
    { market: "1", selectionDetail: `${homeName} gagne`, estimatedProbability: probs["1"], odds: odds.home },
    { market: "X", selectionDetail: "Match nul", estimatedProbability: probs["X"], odds: odds.draw },
    { market: "2", selectionDetail: `${awayName} gagne`, estimatedProbability: probs["2"], odds: odds.away },
    { market: "OVER_15", selectionDetail: "Plus de 1.5 but", estimatedProbability: probs["OVER_15"], odds: odds.over15 },
    { market: "OVER_25", selectionDetail: "Plus de 2.5 buts", estimatedProbability: probs["OVER_25"], odds: odds.over25 },
    { market: "UNDER_25", selectionDetail: "Moins de 2.5 buts", estimatedProbability: probs["UNDER_25"], odds: odds.under25 },
    { market: "BTTS_YES", selectionDetail: "Les deux équipes marquent", estimatedProbability: probs["BTTS_YES"], odds: odds.bttsYes },
    { market: "BTTS_NO", selectionDetail: "Au moins une équipe ne marque pas", estimatedProbability: probs["BTTS_NO"], odds: odds.bttsNo },
  ];
  if (odds.home && odds.draw) {
    const implied = 1 / odds.home + 1 / odds.draw;
    candidates.push({ market: "1X", selectionDetail: `${homeName} ou nul`, estimatedProbability: probs["1X"], odds: implied ? 1 / implied : undefined });
  }
  if (odds.draw && odds.away) {
    const implied = 1 / odds.draw + 1 / odds.away;
    candidates.push({ market: "X2", selectionDetail: `${awayName} ou nul`, estimatedProbability: probs["X2"], odds: implied ? 1 / implied : undefined });
  }
  return candidates;
}

export function selectBestMarket(candidates: MarketCandidate[]): MarketCandidate | null {
  const scored = candidates
    .map((c) => [c, valueScore(c)] as const)
    .filter((pair): pair is [MarketCandidate, number] => pair[1] !== null);
  if (!scored.length) return null;
  scored.sort((a, b) => b[1] - a[1]);
  return scored[0][0];
}
