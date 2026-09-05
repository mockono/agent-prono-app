/**
 * AGENT PRONO REACTIVED V1 — Modèle Poisson (port TS de engine/poisson_model.py)
 * Voir la version Python pour la documentation complète de la méthode
 * (buts attendus normalisés par les moyennes du championnat + correction
 * Dixon-Coles sur les scores bas). ⚠️ rho est une valeur de départ, pas
 * calibrée sur des données réelles — à ajuster via le backtesting.
 */
import type { TeamSnapshot, MatchContext } from "./scoring";

const DEFAULT_RHO = -0.05;
const MAX_GOALS = 10;

export interface ExpectedGoals {
  lambdaHome: number;
  lambdaAway: number;
  notes: string;
}

function rateOrFallback(venuePlayed: number, venueRate: number, fallbackRate: number): number {
  return venuePlayed >= 5 ? venueRate : fallbackRate;
}

export function computeExpectedGoals(
  home: TeamSnapshot,
  away: TeamSnapshot,
  context: MatchContext
): ExpectedGoals {
  const leagueAvgHome = Math.max(context.leagueAvgHomeGoals, 0.1);
  const leagueAvgAway = Math.max(context.leagueAvgAwayGoals, 0.1);

  const h = home.homeStats;
  const homeAttackRate = h?.played
    ? rateOrFallback(h.played, h.goalsFor / h.played, home.attackDefense.goalsPerMatch)
    : home.attackDefense.goalsPerMatch;
  const homeDefenseRate = h?.played
    ? rateOrFallback(h.played, h.goalsAgainst / h.played, home.attackDefense.concededPerMatch)
    : home.attackDefense.concededPerMatch;

  const a = away.awayStats;
  const awayAttackRate = a?.played
    ? rateOrFallback(a.played, a.goalsFor / a.played, away.attackDefense.goalsPerMatch)
    : away.attackDefense.goalsPerMatch;
  const awayDefenseRate = a?.played
    ? rateOrFallback(a.played, a.goalsAgainst / a.played, away.attackDefense.concededPerMatch)
    : away.attackDefense.concededPerMatch;

  const homeAttackStrength = homeAttackRate / leagueAvgHome;
  const homeDefenseWeakness = homeDefenseRate / leagueAvgAway;
  const awayAttackStrength = awayAttackRate / leagueAvgAway;
  const awayDefenseWeakness = awayDefenseRate / leagueAvgHome;

  let lambdaHome = homeAttackStrength * awayDefenseWeakness * leagueAvgHome;
  let lambdaAway = awayAttackStrength * homeDefenseWeakness * leagueAvgAway;

  lambdaHome = Math.min(Math.max(lambdaHome, 0.15), 5.0);
  lambdaAway = Math.min(Math.max(lambdaAway, 0.15), 5.0);

  const notes = `λ domicile=${lambdaHome.toFixed(2)} (attaque ${homeAttackRate.toFixed(2)} vs moy. ${leagueAvgHome.toFixed(2)}); λ extérieur=${lambdaAway.toFixed(2)} (attaque ${awayAttackRate.toFixed(2)} vs moy. ${leagueAvgAway.toFixed(2)})`;
  return { lambdaHome, lambdaAway, notes };
}

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function poissonPmf(k: number, lam: number): number {
  return (Math.exp(-lam) * Math.pow(lam, k)) / factorial(k);
}
function dixonColesTau(x: number, y: number, lambdaHome: number, lambdaAway: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lambdaHome * lambdaAway * rho;
  if (x === 0 && y === 1) return 1 + lambdaHome * rho;
  if (x === 1 && y === 0) return 1 + lambdaAway * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1.0;
}

export function scoreMatrix(
  lambdaHome: number,
  lambdaAway: number,
  rho: number = DEFAULT_RHO,
  maxGoals: number = MAX_GOALS
): number[][] {
  const homePmf = Array.from({ length: maxGoals + 1 }, (_, x) => poissonPmf(x, lambdaHome));
  const awayPmf = Array.from({ length: maxGoals + 1 }, (_, y) => poissonPmf(y, lambdaAway));
  const matrix: number[][] = homePmf.map((hp) => awayPmf.map((ap) => hp * ap));

  for (let x = 0; x < 2; x++) {
    for (let y = 0; y < 2; y++) {
      matrix[x][y] *= dixonColesTau(x, y, lambdaHome, lambdaAway, rho);
    }
  }
  const total = matrix.reduce((s, row) => s + row.reduce((rs, v) => rs + v, 0), 0);
  return total > 0 ? matrix.map((row) => row.map((v) => v / total)) : matrix;
}

export interface MarketProbabilities {
  [market: string]: number;
}

export function marketProbabilities(matrix: number[][]): MarketProbabilities {
  const maxGoals = matrix.length - 1;
  let pHome = 0,
    pDraw = 0,
    pAway = 0,
    pOver15 = 0,
    pOver25 = 0,
    pBttsYes = 0,
    winBttsHome = 0,
    winBttsAway = 0,
    winOver25Home = 0,
    winOver25Away = 0;

  for (let x = 0; x <= maxGoals; x++) {
    for (let y = 0; y <= maxGoals; y++) {
      const p = matrix[x][y];
      if (x > y) pHome += p;
      else if (y > x) pAway += p;
      else pDraw += p;
      if (x + y >= 2) pOver15 += p;
      if (x + y >= 3) pOver25 += p;
      if (x >= 1 && y >= 1) pBttsYes += p;
      if (x > y && x >= 1 && y >= 1) winBttsHome += p;
      if (y > x && x >= 1 && y >= 1) winBttsAway += p;
      if (x > y && x + y >= 3) winOver25Home += p;
      if (y > x && x + y >= 3) winOver25Away += p;
    }
  }

  return {
    "1": pHome,
    X: pDraw,
    "2": pAway,
    "1X": pHome + pDraw,
    X2: pDraw + pAway,
    OVER_15: pOver15,
    UNDER_15: 1 - pOver15,
    OVER_25: pOver25,
    UNDER_25: 1 - pOver25,
    BTTS_YES: pBttsYes,
    BTTS_NO: 1 - pBttsYes,
    WIN_BTTS_HOME: winBttsHome,
    WIN_BTTS_AWAY: winBttsAway,
    WIN_OVER25_HOME: winOver25Home,
    WIN_OVER25_AWAY: winOver25Away,
  };
}

export function estimateProbabilities(
  home: TeamSnapshot,
  away: TeamSnapshot,
  context: MatchContext,
  rho: number = DEFAULT_RHO
): { probs: MarketProbabilities; xg: ExpectedGoals } {
  const xg = computeExpectedGoals(home, away, context);
  const matrix = scoreMatrix(xg.lambdaHome, xg.lambdaAway, rho);
  return { probs: marketProbabilities(matrix), xg };
}
