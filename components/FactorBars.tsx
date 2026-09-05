import type { FactorResult } from "@/lib/engine/scoring";

const FACTOR_LABELS: Record<string, string> = {
  forme_recente: "Forme",
  domicile_exterieur: "Domicile / Ext.",
  force_adversaires: "Adversaires",
  attaque_defense: "Attaque / Défense",
  contexte: "Contexte",
  h2h: "H2H",
  indice_modele: "Indice modèle",
};

export function FactorBars({ factors }: { factors: FactorResult[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {factors.map((f) => {
        const pct = (f.score / f.maxScore) * 100;
        return (
          <div key={f.name} className="grid grid-cols-[100px_1fr_44px] items-center gap-2" title={f.justification}>
            <span className="text-[11px] text-white/60 font-body">{FACTOR_LABELS[f.name] ?? f.name}</span>
            <div className="h-1.5 bg-pitch-line">
              <div className="h-full bg-turf" style={{ width: `${pct}%` }} />
            </div>
            <span className="font-mono tab-nums text-[11px] text-white/70 text-right">
              {f.score.toFixed(0)}/{f.maxScore}
            </span>
          </div>
        );
      })}
    </div>
  );
}
