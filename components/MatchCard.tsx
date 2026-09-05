import type { MatchAnalysis } from "@/lib/engine/matchAnalysis";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { FactorBars } from "./FactorBars";

export function MatchCard({ analysis }: { analysis: MatchAnalysis }) {
  const { match, confidence, bestMarket } = analysis;
  const meta = confidence.label;

  return (
    <article
      className="border border-pitch-line bg-pitch-surface p-4 flex flex-col gap-3"
      style={{ borderLeftWidth: "3px", borderLeftColor: `var(--conf-${meta === "TRES_FORTE" ? 5 : meta === "FORTE" ? 4 : meta === "MOYENNE" ? 3 : meta === "RISQUEE" ? 2 : 1})` }}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] text-white/50 font-body">
            {match.competition} · {match.country}
          </p>
          <h3 className="font-display text-lg leading-tight mt-0.5">
            {match.home.name} <span className="text-white/40 font-body text-sm">vs</span> {match.away.name}
          </h3>
          <p className="font-mono tab-nums text-[11px] text-white/50 mt-1">
            {match.date} · {match.time}
          </p>
        </div>
        <ConfidenceBadge score={confidence.totalScore} label={confidence.label} />
      </header>

      <div className="border-t border-pitch-line pt-3">
        {bestMarket ? (
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] text-white/50 font-body">Pronostic</p>
              <p className="font-display text-base">{bestMarket.selectionDetail}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/50 font-body">Cote</p>
              <p className="font-mono tab-nums text-base font-semibold text-flood">{bestMarket.odds?.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/50 font-body italic">Aucun marché avec avantage détecté — le moteur s'abstient.</p>
        )}
      </div>

      <details className="group">
        <summary className="text-[11px] text-white/50 font-body cursor-pointer select-none">
          Détail des facteurs
        </summary>
        <div className="mt-2">
          <FactorBars factors={confidence.factors} />
        </div>
      </details>
    </article>
  );
}
