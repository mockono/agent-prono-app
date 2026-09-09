import type { RecentForm, VenueSplit, AttackDefenseProfile, TeamSnapshot } from "../engine/scoring";
import type { FDMatch, FDStanding } from "./footballData";
import { positionOf } from "./deriveContext";

function matchesInvolving(results: FDMatch[], teamId: number): FDMatch[] {
  return results.filter((m) => m.homeTeam.id === teamId || m.awayTeam.id === teamId);
}

function computeForm(matches: FDMatch[], teamId: number): RecentForm {
  let wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0,
    played = 0;

  for (const m of matches) {
    const isHome = m.homeTeam.id === teamId;
    const myGoals = isHome ? m.score.fullTime.home : m.score.fullTime.away;
    const oppGoals = isHome ? m.score.fullTime.away : m.score.fullTime.home;
    if (myGoals == null || oppGoals == null) continue;
    played++;
    goalsFor += myGoals;
    goalsAgainst += oppGoals;
    if (myGoals > oppGoals) wins++;
    else if (myGoals === oppGoals) draws++;
    else losses++;
  }
  return { played, wins, draws, losses, goalsFor, goalsAgainst };
}

function computeVenueSplit(matches: FDMatch[], teamId: number, home: boolean): VenueSplit | undefined {
  const relevant = matches.filter((m) => {
    const isHome = m.homeTeam.id === teamId;
    const goalsKnown = m.score.fullTime.home != null && m.score.fullTime.away != null;
    return (home ? isHome : !isHome) && goalsKnown;
  });
  if (!relevant.length) return undefined;

  let wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0;
  for (const m of relevant) {
    const myGoals = home ? m.score.fullTime.home! : m.score.fullTime.away!;
    const oppGoals = home ? m.score.fullTime.away! : m.score.fullTime.home!;
    goalsFor += myGoals;
    goalsAgainst += oppGoals;
    if (myGoals > oppGoals) wins++;
    else if (myGoals === oppGoals) draws++;
    else losses++;
  }
  return { played: relevant.length, wins, draws, losses, goalsFor, goalsAgainst };
}

function computeAttackDefense(matches: FDMatch[], teamId: number): AttackDefenseProfile {
  const played = matches.filter((m) => m.score.fullTime.home != null && m.score.fullTime.away != null);
  if (!played.length) {
    return { goalsPerMatch: 1.2, concededPerMatch: 1.2, cleanSheetRate: 0.25, over15Rate: 0.7, over25Rate: 0.5, bttsRate: 0.5 };
  }
  let gf = 0,
    ga = 0,
    cleanSheets = 0,
    over15 = 0,
    over25 = 0,
    btts = 0;
  for (const m of played) {
    const isHome = m.homeTeam.id === teamId;
    const myGoals = isHome ? m.score.fullTime.home! : m.score.fullTime.away!;
    const oppGoals = isHome ? m.score.fullTime.away! : m.score.fullTime.home!;
    gf += myGoals;
    ga += oppGoals;
    if (oppGoals === 0) cleanSheets++;
    if (myGoals + oppGoals >= 2) over15++;
    if (myGoals + oppGoals >= 3) over25++;
    if (myGoals >= 1 && oppGoals >= 1) btts++;
  }
  const n = played.length;
  return {
    goalsPerMatch: gf / n,
    concededPerMatch: ga / n,
    cleanSheetRate: cleanSheets / n,
    over15Rate: over15 / n,
    over25Rate: over25 / n,
    bttsRate: btts / n,
  };
}

function computeStreak(matchesDesc: FDMatch[], teamId: number): string | undefined {
  const played = matchesDesc.filter((m) => m.score.fullTime.home != null && m.score.fullTime.away != null);
  if (!played.length) return undefined;
  const outcomeOf = (m: FDMatch): "W" | "D" | "L" => {
    const isHome = m.homeTeam.id === teamId;
    const myGoals = isHome ? m.score.fullTime.home! : m.score.fullTime.away!;
    const oppGoals = isHome ? m.score.fullTime.away! : m.score.fullTime.home!;
    return myGoals > oppGoals ? "W" : myGoals === oppGoals ? "D" : "L";
  };
  const first = outcomeOf(played[0]);
  let count = 0;
  for (const m of played) {
    if (outcomeOf(m) === first) count++;
    else break;
  }
  return `${first}${count}`;
}

export function buildTeamSnapshotFromLeagueResults(
  teamId: number,
  teamName: string,
  leagueResults: FDMatch[],
  standings?: FDStanding[]
): TeamSnapshot {
  const involving = matchesInvolving(leagueResults, teamId);
  const sorted = [...involving].sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
  const last5 = sorted.slice(0, 5);
  const last10 = sorted.slice(0, 10);

  const position = standings ? positionOf(standings, teamId) : undefined;
  const points = standings?.find((s) => s.team.id === teamId)?.points;

  return {
    teamId: String(teamId),
    name: teamName,
    formLast5: computeForm(last5, teamId),
    formLast10: computeForm(last10, teamId),
    homeStats: computeVenueSplit(sorted, teamId, true),
    awayStats: computeVenueSplit(sorted, teamId, false),
    attackDefense: computeAttackDefense(sorted, teamId),
    leaguePosition: position,
    leaguePoints: points,
    currentStreak: computeStreak(sorted, teamId),
  };
}