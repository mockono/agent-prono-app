import { riskTierOf, RISK_TIER_META } from "@/lib/engine/riskTier";

export function RiskBadge({ score, pickLabel }: { score: number; pickLabel?: string }) {
  const tier = riskTierOf(score);
  const meta = RISK_TIER_META[tier];

  const text = tier === "SAFE" ? "SAFE" : tier === "CRAZY" ? "CRAZY" : pickLabel ?? "FUN";

  return (
    <span
      className="font-display text-xs tracking-wide px-2.5 py-1 border whitespace-nowrap max-w-[170px] truncate"
      style={{ color: meta.color, borderColor: meta.color, backgroundColor: meta.bg }}
      title={text}
    >
      {text}
    </span>
  );
}