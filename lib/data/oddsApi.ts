/**
 * Client The Odds API (v4)
 * ==========================
 * ⚠️ Jamais testé contre la vraie API dans mon environnement de génération.
 * Format écrit d'après la documentation publique — si un champ ne
 * correspond pas, dis-moi le JSON brut et je corrige.
 *
 * Free tier : 500 requêtes/mois. Coût = nb marchés × nb régions par appel.
 * Ici : 3 marchés (h2h, totals, btts) × 1 région (uk) = 3 crédits par
 * championnat par rafraîchissement. Avec 4 championnats et un cache 24h :
 * 12 crédits/jour max ≈ 360/mois — large marge sous la limite.
 *
 * BTTS ajouté mais jamais vérifié contre une vraie réponse — si le marché
 * n'apparaît pas pour un championnat/plan donné, bttsYes/bttsNo restent
 * simplement undefined, géré sans casser le reste.
 */

const BASE_URL = "https://api.the-odds-api.com/v4";
const CACHE_SECONDS = 24 * 60 * 60;

export interface OddsEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    markets: { key: string; outcomes: { name: string; price: number; point?: number }[] }[];
  }[];
}

export async function fetchSportOdds(sportKey: string, apiKey: string): Promise<OddsEvent[]> {
  const url = `${BASE_URL}/sports/${sportKey}/odds?apiKey=${apiKey}&regions=uk&markets=h2h,totals,btts&oddsFormat=decimal`;
  const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
  if (!res.ok) {
    throw new Error(`The Odds API ${sportKey} -> HTTP ${res.status}`);
  }
  return res.json();
}

export interface ParsedOdds {
  home?: number;
  draw?: number;
  away?: number;
  over15?: number;
  under15?: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
}

export function parseOddsEvent(event: OddsEvent): ParsedOdds {
  const snapshot: ParsedOdds = {};
  const bookmaker = event.bookmakers?.[0];
  if (!bookmaker) return snapshot;

  for (const market of bookmaker.markets ?? []) {
    if (market.key === "h2h") {
      for (const o of market.outcomes) {
        if (o.name === event.home_team) snapshot.home = o.price;
        else if (o.name === event.away_team) snapshot.away = o.price;
        else if (o.name === "Draw") snapshot.draw = o.price;
      }
    }
    if (market.key === "totals") {
      for (const o of market.outcomes) {
        if (o.point === 1.5) {
          if (o.name === "Over") snapshot.over15 = o.price;
          if (o.name === "Under") snapshot.under15 = o.price;
        }
        if (o.point === 2.5) {
          if (o.name === "Over") snapshot.over25 = o.price;
          if (o.name === "Under") snapshot.under25 = o.price;
        }
      }
    }
    if (market.key === "btts") {
      for (const o of market.outcomes) {
        if (o.name === "Yes") snapshot.bttsYes = o.price;
        if (o.name === "No") snapshot.bttsNo = o.price;
      }
    }
  }
  return snapshot;
}