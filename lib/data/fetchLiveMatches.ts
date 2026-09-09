import type { MockMatch } from "./mockMatches";
import { ACTIVE_LEAGUES } from "./competitionsConfig";
import { fetchCompetitionWindow, splitUpcomingAndFinished, fetchStandings, type FDMatch } from "./footballData";
import { fetchSportOdds } from "./oddsApi";
import { findOddsForMatch } from "./matchOdds";
import { buildTeamSnapshotFromLeagueResults } from "./buildTeamSnapshot";
import { deriveImportance, positionOf } from "./deriveContext";
import type { TeamSnapshot } from "../engine/scoring";

const MAX_MATCHES_DISPLAYED = 12;

export async function fetchLiveMatches(apiKeys: { footballData: string; odds?: string }): Promise<MockMatch[]> {
  const matches: MockMatch[] = [];

  for (const league of ACTIVE_LEAGUES) {
    const window = await fetchCompetitionWindow(league.code, apiKeys.footballData);
    const { upcoming, finished } = splitUpcomingAndFinished(window);

    let standings: Awaited<ReturnType<typeof fetchStandings>> = [];
    try {
      standings = await fetchStandings(league.code, apiKeys.footballData);
    } catch (err) {
      console.error(`[fetchLiveMatches] classement indisponible pour ${league.name}:`, err);
    }

    let oddsEvents: Awaited<ReturnType<typeof fetchSportOdds>> = [];
    if (apiKeys.odds) {
      try {
        oddsEvents = await fetchSportOdds(league.oddsSportKey, apiKeys.odds);
      } catch (err) {
        console.error(`[fetchLiveMatches] cotes indisponibles pour ${league.name}:`, err);
      }
    }

    const teamSnapshotCache = new Map<number, TeamSnapshot>();
    const getSnapshot = (teamId: number, teamName: string): TeamSnapshot => {
      if (!teamSnapshotCache.has(teamId)) {
        teamSnapshotCache.set(teamId, buildTeamSnapshotFromLeagueResults(teamId, teamName, finished, standings));
      }
      return teamSnapshotCache.get(teamId)!;
    };

    for (const fixture of upcoming as FDMatch[]) {
      const odds = apiKeys.odds ? findOddsForMatch(fixture, oddsEvents) : {};
      const homePos = positionOf(standings, fixture.homeTeam.id);
      const awayPos = positionOf(standings, fixture.awayTeam.id);
      const importance = deriveImportance(
        fixture.homeTeam.name,
        fixture.awayTeam.name,
        homePos,
        awayPos,
        standings.length || undefined
      );

      matches.push({
        id: `fd-${fixture.id}`,
        competition: league.name,
        country: league.country,
        date: fixture.utcDate.slice(0, 10),
        time: fixture.utcDate.slice(11, 16),
        home: getSnapshot(fixture.homeTeam.id, fixture.homeTeam.name),
        away: getSnapshot(fixture.awayTeam.id, fixture.awayTeam.name),
        context: {
          competitionName: league.name,
          importance,
          leagueAvgHomeGoals: 1.5,
          leagueAvgAwayGoals: 1.15,
        },
        odds: {
          home: odds.home,
          draw: odds.draw,
          away: odds.away,
          over15: odds.over15,
          under15: odds.under15,
          over25: odds.over25,
          under25: odds.under25,
          bttsYes: odds.bttsYes,
          bttsNo: odds.bttsNo,
        },
      });
    }
  }

  matches.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  return matches.slice(0, MAX_MATCHES_DISPLAYED);
}