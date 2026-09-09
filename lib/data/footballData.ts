/**
 * Client football-data.org (v4)
 * ================================
 * ⚠️ Jamais testé contre la vraie API en conditions réelles. Format écrit
 * d'après la documentation publique — si un champ ne correspond pas,
 * dis-moi le JSON brut et je corrige.
 *
 * Free tier : 10 requêtes/minute, 12 championnats. Un seul appel par
 * championnat couvre les 60 derniers jours + les 7 prochains jours, on
 * sépare ensuite localement upcoming/résultats — ça évite de doubler le
 * nombre d'appels et garde le temps total sous la limite de Vercel (60s).
 */

const BASE_URL = "https://api.football-data.org/v4";
const CACHE_SECONDS = 12 * 60 * 60;
const THROTTLE_MS = 3000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: { fullTime: { home: number | null; away: number | null } };
}

async function footballDataGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": token },
    next: { revalidate: CACHE_SECONDS },
  });
  if (!res.ok) {
    throw new Error(`football-data.org ${path} -> HTTP ${res.status}`);
  }
  return res.json();
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Un seul appel : renvoie tous les matchs (passés ET à venir) sur la fenêtre demandée. */
export async function fetchCompetitionWindow(
  competitionCode: string,
  token: string,
  daysBack = 60,
  daysAhead = 7
): Promise<FDMatch[]> {
  const from = formatDate(new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000));
  const to = formatDate(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000));
  const json = await footballDataGet(`/competitions/${competitionCode}/matches?dateFrom=${from}&dateTo=${to}`, token);
  await sleep(THROTTLE_MS);
  return json.matches ?? [];
}

export function splitUpcomingAndFinished(matches: FDMatch[]): { upcoming: FDMatch[]; finished: FDMatch[] } {
  return {
    upcoming: matches.filter((m) => m.status === "SCHEDULED" || m.status === "TIMED"),
    finished: matches.filter((m) => m.status === "FINISHED"),
  };
}