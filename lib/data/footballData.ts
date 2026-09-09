/**
 * Client football-data.org (v4)
 * ================================
 * ⚠️ Jamais testé contre la vraie API dans mon environnement de génération
 * (pas d'accès réseau, pas de clé). Format écrit d'après la documentation
 * publique — si un champ ne correspond pas, dis-moi le JSON brut et je corrige.
 *
 * Free tier : 10 requêtes/minute, 12 championnats (dont PL, PD, SA, FL1,
 * BL1, CL utilisés ici). Pas de quota mensuel documenté, juste le débit.
 */

const BASE_URL = "https://api.football-data.org/v4";
const CACHE_SECONDS = 12 * 60 * 60;

const THROTTLE_MS = 6500;

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

export async function fetchUpcomingMatches(
  competitionCode: string,
  token: string,
  daysAhead = 7
): Promise<FDMatch[]> {
  const from = formatDate(new Date());
  const to = formatDate(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000));
  const json = await footballDataGet(
    `/competitions/${competitionCode}/matches?dateFrom=${from}&dateTo=${to}&status=SCHEDULED`,
    token
  );
  await sleep(THROTTLE_MS);
  return json.matches ?? [];
}

export async function fetchRecentResults(
  competitionCode: string,
  token: string,
  daysBack = 60
): Promise<FDMatch[]> {
  const from = formatDate(new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000));
  const to = formatDate(new Date());
  const json = await footballDataGet(
    `/competitions/${competitionCode}/matches?dateFrom=${from}&dateTo=${to}&status=FINISHED`,
    token
  );
  await sleep(THROTTLE_MS);
  return json.matches ?? [];
}
