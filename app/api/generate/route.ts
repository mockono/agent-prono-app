import { NextRequest, NextResponse } from "next/server";
import { getMatches } from "@/lib/data/matchesProvider";
import { analyzeAllMockMatches } from "@/lib/engine/matchAnalysis";
import { buildTicket, type Forfait, type ProSubtier } from "@/lib/engine/ticketBuilder";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const forfait: Forfait = body.forfait ?? "BASIC";
  const proSubtier: ProSubtier | undefined = body.proSubtier;
  const montanteStep: number | undefined = body.montanteStep;

  const { matches, source } = await getMatches();
  const analyses = analyzeAllMockMatches(matches);
  const ticket = buildTicket(analyses, forfait, { proSubtier, montanteStep });

  return NextResponse.json({ ticket, source });
}