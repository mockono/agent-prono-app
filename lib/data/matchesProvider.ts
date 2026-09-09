import { MOCK_MATCHES, type MockMatch } from "./mockMatches";
import { fetchLiveMatches } from "./fetchLiveMatches";

export type MatchesSource = "live" | "mock" | "mock_fallback_empty" | "mock_fallback_error";

export interface MatchesResult {
  matches: MockMatch[];
  source: MatchesSource;
  error?: string;
}

export async function getMatches(): Promise<MatchesResult> {
  const footballDataKey = process.env.FOOTBALL_DATA_API_KEY;
  const oddsKey = process.env.ODDS_API_KEY;

  if (!footballDataKey) {
    return { matches: MOCK_MATCHES, source: "mock" };
  }

  try {
    const matches = await fetchLiveMatches({ footballData: footballDataKey, odds: oddsKey });
    if (!matches.length) {
      return { matches: MOCK_MATCHES, source: "mock_fallback_empty" };
    }
    return { matches, source: "live" };
  } catch (err) {
    console.error("[getMatches] échec football-data.org/Odds API, repli sur les données de démo:", err);
    return { matches: MOCK_MATCHES, source: "mock_fallback_error", error: String(err) };
  }
}