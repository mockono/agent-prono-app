import { NextResponse } from "next/server";
import { listPredictions, updatePredictionStatus } from "@/lib/data/predictionStore";
import { fetchCompetitionWindow, splitUpcomingAndFinished } from "@/lib/data/footballData";
import { evaluateMarket } from "@/lib/engine/settleMarket";

export const maxDuration = 60;

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FOOTBALL_DATA_API_KEY non configurée" }, { status: 400 });
  }

  const predictions = await listPredictions();
  const pending = predictions.filter((p) => p.status === "pending");
  if (!pending.length) {
    return NextResponse.json({ settled: 0, checked: 0, message: "Aucun pronostic en attente." });
  }

  const codes = Array.from(new Set(pending.map((p) => p.competitionCode)));
  const finishedByCode: Record<string, Awaited<ReturnType<typeof fetchCompetitionWindow>>> = {};

  for (const code of codes) {
    try {
      const window = await fetchCompetitionWindow(code, apiKey);
      finishedByCode[code] = splitUpcomingAndFinished(window).finished;
    } catch (err) {
      console.error(`[settle] échec récupération résultats ${code}:`, err);
      finishedByCode[code] = [];
    }
  }

  let settledCount = 0;
  for (const pred of pending) {
    const rawId = Number(pred.matchId.replace(/^fd-/, ""));
    const finished = finishedByCode[pred.competitionCode] ?? [];
    const match = finished.find((m) => m.id === rawId);
    if (!match || match.score.fullTime.home == null || match.score.fullTime.away == null) continue;

    const result = evaluateMarket(pred.market, match.score.fullTime.home, match.score.fullTime.away);
    await updatePredictionStatus(pred.id, result);
    settledCount++;
  }

  return NextResponse.json({ settled: settledCount, checked: pending.length });
}