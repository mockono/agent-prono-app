import type { MockMatch } from "./mockMatches";
import { ACTIVE_LEAGUES } from "./competitionsConfig";
import { fetchUpcomingMatches, fetchRecentResults, type FDMatch } from "./footballData";
import { fetchSportOdds } from "./oddsApi";
import { findOddsForMatch } from "./matchOdds";
import { buildTeamSnapshotFromLeagueResults } from "./buildTeamSnapshot";
import type { TeamSnapshot } from "../engine/scoring";

const MAX_MATCHES_DISPLAYED = 12;

export async function fetchLiveMatches(apiKeys: {
  footballData: string;
  odds?: string;
}): Promise<MockMatch[]> {
  const matches: MockMatch[] = [];

  for (const league of ACTIVE_LEAGUES) {
    const [upcoming, recentResults] = await Promise.all([
      fetchUpcomingMatches(league.code, apiKeys.footballData),
      fetchRecentResults(league.code, apiKeys.footballData),
    ]);

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
        teamSnapshotCache.set(teamId, buildTeamSnapshotFromLeagueResults(teamId, teamName, recentResults));
      }
      return teamSnapshotCache.get(teamId)!;
    };

    for (const fixture of upcoming as FDMatch[]) {
      const odds = apiKeys.odds ? findOddsForMatch(fixture, oddsEvents) : {};

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
          importance: "normal",
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
          bttsYes: undefined,
          bttsNo: undefined,
        },
      });
    }
  }

  matches.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  return matches.slice(0, MAX_MATCHES_DISPLAYED);
}