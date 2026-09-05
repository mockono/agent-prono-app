import { NextRequest, NextResponse } from "next/server";
import { MOCK_MATCHES } from "@/lib/data/mockMatches";
import { analyzeAllMockMatches } from "@/lib/engine/matchAnalysis";
import { buildTicket, type Forfait, type ProSubtier } from "@/lib/engine/ticketBuilder";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const forfait: Forfait = body.forfait ?? "BASIC";
  const proSubtier: ProSubtier | undefined = body.proSubtier;
  const montanteStep: number | undefined = body.montanteStep;

  const analyses = analyzeAllMockMatches(MOCK_MATCHES);
  const ticket = buildTicket(analyses, forfait, { proSubtier, montanteStep });

  return NextResponse.json({ ticket });
}
