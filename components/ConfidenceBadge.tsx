import { CONFIDENCE_META } from "@/lib/engine/scoring";

export function ConfidenceBadge({ score, label }: { score: number; label: string }) {
  const meta = CONFIDENCE_META[label] ?? CONFIDENCE_META.A_EVITER;
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono tab-nums text-2xl font-semibold" style={{ color: meta.color }}>
        {score.toFixed(0)}
      </span>
      <span className="font-mono text-xs text-white/50">/100</span>
      <span
        className="font-display text-xs tracking-wide px-2 py-0.5 border"
        style={{ color: meta.color, borderColor: meta.color }}
      >
        {meta.fr}
      </span>
    </div>
  );
}
