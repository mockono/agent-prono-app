import type { MatchAnalysis } from "@/lib/engine/matchAnalysis";
import { CONFIDENCE_META } from "@/lib/engine/scoring";

export function MatchTicker({ analyses }: { analyses: MatchAnalysis[] }) {
  return (
    <div className="border-y border-pitch-line bg-pitch-surface overflow-x-auto">
      <div className="flex divide-x divide-pitch-line min-w-max">
        {analyses.map((a) => {
          const meta = CONFIDENCE_META[a.confidence.label];
          return (
            <div key={a.match.id} className="px-4 py-2.5 flex items-center gap-3 shrink-0">
              <span className="font-mono tab-nums text-[11px] text-white/40">{a.match.time}</span>
              <span className="font-body text-xs">
                {a.match.home.name} <span className="text-white/30">–</span> {a.match.away.name}
              </span>
              <span className="font-mono tab-nums text-xs font-semibold" style={{ color: meta.color }}>
                {a.confidence.totalScore.toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
