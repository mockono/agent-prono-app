import { analyzeMatch, type ConfidenceReport } from "./scoring";
import { estimateProbabilities } from "./poissonModel";
import { buildMarketCandidates, selectBestMarket, type MarketCandidate } from "./marketSelector";
import type { MockMatch } from "../data/mockMatches";

export interface MatchAnalysis {
  match: MockMatch;
  confidence: ConfidenceReport;
  bestMarket: MarketCandidate | null;
  allCandidates: MarketCandidate[];
}

export function analyzeMockMatch(match: MockMatch): MatchAnalysis {
  const confidence = analyzeMatch(match.home, match.away, [], match.context);
  const { probs } = estimateProbabilities(match.home, match.away, match.context);
  const allCandidates = buildMarketCandidates(probs, match.odds, match.home.name, match.away.name);
  const bestMarket = selectBestMarket(allCandidates);
  return { match, confidence, bestMarket, allCandidates };
}

export function analyzeAllMockMatches(matches: MockMatch[]): MatchAnalysis[] {
  return matches.map(analyzeMockMatch);
}
