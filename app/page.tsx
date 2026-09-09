import { getMatches } from "@/lib/data/matchesProvider";
import { analyzeAllMockMatches } from "@/lib/engine/matchAnalysis";
import { MatchTicker } from "@/components/MatchTicker";
import { MatchCard } from "@/components/MatchCard";
import { GenerateFlow } from "@/components/GenerateFlow";

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  live: { label: "Données réelles (football-data.org + The Odds API)", color: "#3d8b5f" },
  mock: { label: "Données de démonstration — FOOTBALL_DATA_API_KEY non configurée", color: "#e8a33d" },
  mock_fallback_empty: { label: "Démo (aucun match réel trouvé sur la période)", color: "#e8a33d" },
  mock_fallback_error: { label: "Démo (l'appel à l'API a échoué — voir logs serveur)", color: "#c1443c" },
};

export default async function HomePage() {
  const { matches, source, error } = await getMatches();
  const analyses = analyzeAllMockMatches(matches);
  const sorted = [...analyses].sort((a, b) => b.confidence.totalScore - a.confidence.totalScore);
  const sourceMeta = SOURCE_LABEL[source] ?? SOURCE_LABEL.mock;

  return (
    <main className="pb-20">
      <MatchTicker analyses={sorted} />

      <div className="max-w-5xl mx-auto px-4">
        <header className="pt-10 pb-8 border-b border-pitch-line animate-fade-in-up">
          <p className="font-mono tab-nums text-xs text-turf tracking-[0.15em]">MODÈLE REACTIVED V1</p>
          <h1 className="font-display text-4xl md:text-5xl mt-1 tracking-tight">AGENT PRONO</h1>
          <p className="text-white/60 font-body text-sm max-w-md mt-2 leading-relaxed">
            Score de confiance calculé à partir de 7 facteurs pondérés, et sélection automatique
            du marché offrant le meilleur rapport probabilité / cote / risque.
          </p>
          <p
            className="font-mono tab-nums text-[11px] mt-3 inline-block border px-2 py-1"
            style={{ color: sourceMeta.color, borderColor: sourceMeta.color }}
          >
            {sourceMeta.label}
          </p>
        </header>

        <section className="py-8 border-b border-pitch-line">
          <h2 className="font-display text-sm tracking-wide text-white/50 mb-4">
            Matchs analysés ({sorted.length})
          </h2>
          {sorted.length === 0 ? (
            <p className="text-sm text-white/50 font-body italic">
              Aucun match à venir trouvé sur les 7 prochains jours pour les championnats configurés.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sorted.map((a) => (
                <MatchCard key={a.match.id} analysis={a} />
              ))}
            </div>
          )}
        </section>

        <section className="py-8">
          <h2 className="font-display text-sm tracking-wide text-white/50 mb-4">Générer un ticket</h2>
          <GenerateFlow />
        </section>

        <p className="text-[11px] text-white/30 font-body mt-10 leading-relaxed">
          Aucune cote présentée ici n'est une garantie de gain.
          {error ? ` (Détail technique : ${error})` : ""}
        </p>
      </div>
    </main>
  );
}