import type { MatchAnalysis } from "@/lib/engine/matchAnalysis";
import { RiskBadge } from "./RiskBadge";
import { FactorBars } from "./FactorBars";
import { riskTierOf, RISK_TIER_META } from "@/lib/engine/riskTier";

export function MatchCard({ analysis }: { analysis: MatchAnalysis }) {
  const { match, confidence, bestMarket } = analysis;
  const tier = riskTierOf(confidence.totalScore);
  const accent = RISK_TIER_META[tier].color;

  return (
    <article
      className="group border border-pitch-line bg-pitch-surface p-4 flex flex-col gap-3 transition-all duration-300 hover:border-turf/60 hover:shadow-[0_0_24px_-8px_rgba(76,122,61,0.5)] hover:-translate-y-0.5 animate-fade-in-up"
      style={{ borderLeftWidth: "3px", borderLeftColor: accent }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-white/50 font-body tracking-wide">
            {match.competition} · {match.country}
          </p>
          <h3 className="font-display text-lg leading-tight mt-0.5 truncate">
            {match.home.name} <span className="text-white/40 font-body text-sm">vs</span> {match.away.name}
          </h3>
          <p className="font-mono tab-nums text-[11px] text-white/50 mt-1">
            {match.date} · {match.time}
          </p>
        </div>
        <RiskBadge score={confidence.totalScore} pickLabel={bestMarket?.selectionDetail} />
      </header>

      <div className="border-t border-pitch-line pt-3">
        {bestMarket ? (
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-white/50 font-body">Pronostic</p>
              <p className="font-display text-base truncate">{bestMarket.selectionDetail}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] text-white/50 font-body">Cote</p>
              <p className="font-mono tab-nums text-base font-semibold text-flood">{bestMarket.odds?.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/50 font-body italic">Aucun marché avec avantage détecté — le moteur s'abstient.</p>
        )}
      </div>

      <details className="group/details">
        <summary className="text-[11px] text-white/50 font-body cursor-pointer select-none transition-colors hover:text-turf">
          Détail des facteurs
        </summary>
        <div className="mt-2">
          <FactorBars factors={confidence.factors} />
        </div>
      </details>
    </article>
  );
}