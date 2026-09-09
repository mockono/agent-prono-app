import type { FDMatch } from "./footballData";
import type { OddsEvent, ParsedOdds } from "./oddsApi";
import { parseOddsEvent } from "./oddsApi";

function normalizeWords(name: string): string[] {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !["fc", "cf", "afc", "sc", "cd", "ac"].includes(w));
}

function nameSimilarity(a: string, b: string): number {
  const wa = new Set(normalizeWords(a));
  const wb = new Set(normalizeWords(b));
  if (!wa.size || !wb.size) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / Math.max(wa.size, wb.size);
}

export function findOddsForMatch(match: FDMatch, oddsEvents: OddsEvent[]): ParsedOdds {
  const matchDay = match.utcDate.slice(0, 10);
  const sameDay = oddsEvents.filter((e) => e.commence_time.slice(0, 10) === matchDay);

  let best: OddsEvent | null = null;
  let bestScore = 0;
  for (const e of sameDay) {
    const score =
      nameSimilarity(match.homeTeam.name, e.home_team) + nameSimilarity(match.awayTeam.name, e.away_team);
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }

  if (!best || bestScore < 1.2) return {};
  return parseOddsEvent(best);
}