/**
 * AGENT PRONO REACTIVED V1 — Moteur de scoring (port TypeScript du prototype Python)
 * Voir /agent_prono/engine/scoring.py pour la version de référence documentée.
 */

export interface RecentForm {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  avgOpponentStrength?: number; // 0-1
}

export function pointsPct(f: RecentForm): number {
  if (f.played === 0) return 0;
  return (f.wins * 3 + f.draws) / (f.played * 3);
}

export interface VenueSplit {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export function venuePointsPct(v: VenueSplit): number {
  if (v.played === 0) return 0;
  return (v.wins * 3 + v.draws) / (v.played * 3);
}
export const goalsPerMatch = (v: VenueSplit) => (v.played ? v.goalsFor / v.played : 0);
export const concededPerMatch = (v: VenueSplit) => (v.played ? v.goalsAgainst / v.played : 0);

export interface AttackDefenseProfile {
  goalsPerMatch: number;
  concededPerMatch: number;
  cleanSheetRate: number;
  over15Rate: number;
  over25Rate: number;
  bttsRate: number;
}

export interface H2HRecord {
  date: string;
  goalsTeamA: number;
  goalsTeamB: number;
  teamAWasHome: boolean;
}

export interface TeamSnapshot {
  teamId: string;
  name: string;
  formLast5: RecentForm;
  formLast10: RecentForm;
  homeStats?: VenueSplit;
  awayStats?: VenueSplit;
  attackDefense: AttackDefenseProfile;
  leaguePosition?: number;
  leaguePoints?: number;
  currentStreak?: string;
}

export type MatchImportance =
  | "normal"
  | "derby"
  | "relegation_battle"
  | "title_race"
  | "promotion_race"
  | "dead_rubber";

export interface LegContext {
  leg: "single" | "first_leg" | "second_leg";
  firstLegHomeGoals?: number;
  firstLegAwayGoals?: number;
}

export interface MatchContext {
  competitionName: string;
  importance: MatchImportance;
  leg?: LegContext;
  fatigueFlagHome?: boolean;
  fatigueFlagAway?: boolean;
  leagueAvgHomeGoals: number; // défaut 1.50
  leagueAvgAwayGoals: number; // défaut 1.15
}

export interface OddsSnapshot {
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

export interface FactorResult {
  name: string;
  score: number;
  maxScore: number;
  justification: string;
}

export interface ConfidenceReport {
  factors: FactorResult[];
  totalScore: number;
  label: string;
}

const CONFIDENCE_BANDS: [number, number, string][] = [
  [85, 100, "TRES_FORTE"],
  [75, 84.999, "FORTE"],
  [65, 74.999, "MOYENNE"],
  [55, 64.999, "RISQUEE"],
  [0, 54.999, "A_EVITER"],
];

export function confidenceLabel(total: number): string {
  for (const [low, high, label] of CONFIDENCE_BANDS) {
    if (total >= low && total <= high) return label;
  }
  return "A_EVITER";
}

export const CONFIDENCE_META: Record<string, { fr: string; color: string }> = {
  TRES_FORTE: { fr: "Très forte", color: "var(--conf-5)" },
  FORTE: { fr: "Forte", color: "var(--conf-4)" },
  MOYENNE: { fr: "Moyenne", color: "var(--conf-3)" },
  RISQUEE: { fr: "Risquée", color: "var(--conf-2)" },
  A_EVITER: { fr: "À éviter", color: "var(--conf-1)" },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function analyzeMatch(
  home: TeamSnapshot,
  away: TeamSnapshot,
  h2h: H2HRecord[],
  context: MatchContext
): ConfidenceReport {
  const factors: FactorResult[] = [
    factorRecentForm(home, away),
    factorHomeAway(home, away),
    factorOpponentStrength(home, away),
    factorAttackDefense(home, away),
    factorContext(context),
    factorH2H(h2h),
  ];
  factors.push(factorModelIndex(factors));

  const total = clamp(
    factors.reduce((s, f) => s + f.score, 0),
    0,
    100
  );
  return { factors, totalScore: total, label: confidenceLabel(total) };
}

// FACTEUR 1 — FORME RÉCENTE (/20)
function factorRecentForm(home: TeamSnapshot, away: TeamSnapshot): FactorResult {
  const teamFormScore = (f5: RecentForm, f10: RecentForm) => {
    let base = 0.7 * pointsPct(f5) + 0.3 * pointsPct(f10);
    if (f5.avgOpponentStrength !== undefined) {
      base = clamp(base + (f5.avgOpponentStrength - 0.5) * 0.15, 0, 1);
    }
    return base;
  };
  const homeRaw = teamFormScore(home.formLast5, home.formLast10);
  const awayRaw = teamFormScore(away.formLast5, away.formLast10);
  const dominant = Math.max(homeRaw, awayRaw);
  const score = clamp(dominant * 20, 0, 20);
  const justification = `Domicile: ${home.formLast5.wins}V-${home.formLast5.draws}N-${home.formLast5.losses}D sur les 5 derniers (${home.currentStreak ?? "n/d"}); Extérieur: ${away.formLast5.wins}V-${away.formLast5.draws}N-${away.formLast5.losses}D (${away.currentStreak ?? "n/d"})`;
  return { name: "forme_recente", score, maxScore: 20, justification };
}

// FACTEUR 2 — DOMICILE / EXTÉRIEUR (/15)
function factorHomeAway(home: TeamSnapshot, away: TeamSnapshot): FactorResult {
  const h = home.homeStats;
  const a = away.awayStats;
  const homeStrength = h ? venuePointsPct(h) : 0;
  const awayStrength = a ? venuePointsPct(a) : 0;
  const diff = homeStrength - awayStrength;
  const score = clamp((0.5 + diff / 2) * 15, 0, 15);
  const justification = `Domicile: ${h ? `${h.wins}V/${h.played} (${goalsPerMatch(h).toFixed(1)} bpm)` : "n/d"}; Extérieur: ${a ? `${a.wins}V/${a.played} (${goalsPerMatch(a).toFixed(1)} bpm)` : "n/d"}`;
  return { name: "domicile_exterieur", score, maxScore: 15, justification };
}

// FACTEUR 3 — FORCE DES ADVERSAIRES (/15)
function factorOpponentStrength(home: TeamSnapshot, away: TeamSnapshot): FactorResult {
  if (home.leaguePosition == null || away.leaguePosition == null) {
    return {
      name: "force_adversaires",
      score: 7.5,
      maxScore: 15,
      justification: "Classement indisponible — score neutre",
    };
  }
  const leagueSize = 20;
  const homeRankStrength = 1 - (home.leaguePosition - 1) / (leagueSize - 1);
  const awayRankStrength = 1 - (away.leaguePosition - 1) / (leagueSize - 1);
  const diff = homeRankStrength - awayRankStrength;
  const score = clamp((0.5 + diff / 2) * 15, 0, 15);
  const justification = `Classement: domicile ${home.leaguePosition}e (${home.leaguePoints} pts), extérieur ${away.leaguePosition}e (${away.leaguePoints} pts)`;
  return { name: "force_adversaires", score, maxScore: 15, justification };
}

// FACTEUR 4 — ATTAQUE / DÉFENSE (/15)
function factorAttackDefense(home: TeamSnapshot, away: TeamSnapshot): FactorResult {
  const h = home.attackDefense;
  const a = away.attackDefense;
  const homeEdge = h.goalsPerMatch - a.concededPerMatch;
  const awayEdge = a.goalsPerMatch - h.concededPerMatch;
  const clarity = Math.abs(homeEdge - awayEdge);
  const score = clamp(7.5 + clarity * 3, 0, 15);
  const justification = `Domicile ${h.goalsPerMatch.toFixed(1)} bpm / ${h.concededPerMatch.toFixed(1)} enc.; Extérieur ${a.goalsPerMatch.toFixed(1)} bpm / ${a.concededPerMatch.toFixed(1)} enc.; Over1.5 hist. ${(((h.over15Rate + a.over15Rate) / 2) * 100).toFixed(0)}%, BTTS hist. ${(((h.bttsRate + a.bttsRate) / 2) * 100).toFixed(0)}%`;
  return { name: "attaque_defense", score, maxScore: 15, justification };
}

// FACTEUR 5 — CONTEXTE (/15)
function factorContext(context: MatchContext): FactorResult {
  let score = 7.5;
  const notes: string[] = [context.competitionName];
  const bonus: Record<MatchImportance, number> = {
    title_race: 2.0,
    relegation_battle: 1.5,
    promotion_race: 1.5,
    derby: -1.0,
    dead_rubber: -2.5,
    normal: 0.0,
  };
  score += bonus[context.importance] ?? 0;
  notes.push(`enjeu: ${context.importance}`);

  if (context.leg?.leg === "second_leg") {
    const h1 = context.leg.firstLegHomeGoals;
    const a1 = context.leg.firstLegAwayGoals;
    if (h1 != null && a1 != null) {
      const diff = Math.abs(h1 - a1);
      if (diff >= 2) {
        score += 2.0;
        notes.push(`match aller décisif (${h1}-${a1})`);
      } else if (diff === 0) {
        score -= 1.0;
        notes.push(`match aller nul (${h1}-${a1})`);
      } else {
        notes.push(`match aller serré (${h1}-${a1})`);
      }
    }
  }
  if (context.fatigueFlagHome || context.fatigueFlagAway) {
    score -= 1.5;
    notes.push("fatigue détectée");
  }
  return { name: "contexte", score: clamp(score, 0, 15), maxScore: 15, justification: notes.join("; ") };
}

// FACTEUR 6 — H2H (/10)
function factorH2H(h2h: H2HRecord[]): FactorResult {
  if (!h2h.length) {
    return { name: "h2h", score: 5, maxScore: 10, justification: "Aucun historique H2H — score neutre" };
  }
  const recent = h2h.slice(0, 5);
  let weightedDiff = 0;
  let totalWeight = 0;
  recent.forEach((m, i) => {
    const weight = 1 / (i + 1);
    totalWeight += weight;
    const diffForA = m.teamAWasHome ? m.goalsTeamA - m.goalsTeamB : m.goalsTeamB - m.goalsTeamA;
    weightedDiff += diffForA * weight;
  });
  const avg = totalWeight ? weightedDiff / totalWeight : 0;
  const score = clamp(5 + avg * 1.2, 0, 10);
  return {
    name: "h2h",
    score,
    maxScore: 10,
    justification: `${recent.length} confrontations récentes, poids dégressif (ne domine jamais le score)`,
  };
}

// FACTEUR 7 — INDICE MODÈLE (/10)
function factorModelIndex(prior: FactorResult[]): FactorResult {
  const ratios = prior.filter((f) => f.maxScore > 0).map((f) => f.score / f.maxScore);
  if (!ratios.length) return { name: "indice_modele", score: 5, maxScore: 10, justification: "Signaux insuffisants" };
  const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  const variance = ratios.reduce((s, r) => s + (r - avg) ** 2, 0) / ratios.length;
  const stability = 1 - clamp(variance * 4, 0, 1);
  const convergence = Math.abs(avg - 0.5) * 2;
  const composite = 0.6 * stability + 0.4 * convergence;
  return {
    name: "indice_modele",
    score: clamp(composite * 10, 0, 10),
    maxScore: 10,
    justification: `Cohérence inter-facteurs: ${(stability * 100).toFixed(0)}%, convergence: ${(convergence * 100).toFixed(0)}%`,
  };
}
