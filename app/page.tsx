import { MOCK_MATCHES } from "@/lib/data/mockMatches";
import { analyzeAllMockMatches } from "@/lib/engine/matchAnalysis";
import { MatchTicker } from "@/components/MatchTicker";
import { MatchCard } from "@/components/MatchCard";
import { GenerateFlow } from "@/components/GenerateFlow";

export default function HomePage() {
  const analyses = analyzeAllMockMatches(MOCK_MATCHES);
  const sorted = [...analyses].sort((a, b) => b.confidence.totalScore - a.confidence.totalScore);

  return (
    <main className="pb-20">
      <MatchTicker analyses={sorted} />

      <div className="max-w-5xl mx-auto px-4">
        <header className="pt-10 pb-8 border-b border-pitch-line">
          <p className="font-mono tab-nums text-xs text-turf">MODÈLE REACTIVED V1</p>
          <h1 className="font-display text-3xl md:text-4xl mt-1">AGENT PRONO</h1>
          <p className="text-white/60 font-body text-sm max-w-md mt-2 leading-relaxed">
            Score de confiance sur 100, calculé à partir de 7 facteurs pondérés, et sélection
            automatique du marché offrant le meilleur rapport probabilité / cote / risque.
          </p>
        </header>

        <section className="py-8 border-b border-pitch-line">
          <h2 className="font-display text-sm tracking-wide text-white/50 mb-4">Matchs analysés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((a) => (
              <MatchCard key={a.match.id} analysis={a} />
            ))}
          </div>
        </section>

        <section className="py-8">
          <h2 className="font-display text-sm tracking-wide text-white/50 mb-4">Générer un ticket</h2>
          <GenerateFlow />
        </section>

        <p className="text-[11px] text-white/30 font-body mt-10 leading-relaxed">
          Données de démonstration — non connectées à Football-Data.co.uk pour l'instant.
          Aucune cote présentée ici n'est une garantie de gain.
        </p>
      </div>
    </main>
  );
}
