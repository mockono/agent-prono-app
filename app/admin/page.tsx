import { MOCK_MATCHES } from "@/lib/data/mockMatches";
import { analyzeAllMockMatches } from "@/lib/engine/matchAnalysis";

export default function AdminPage() {
  const analyses = analyzeAllMockMatches(MOCK_MATCHES);
  const byCompetition = analyses.reduce<Record<string, number>>((acc, a) => {
    acc[a.match.competition] = (acc[a.match.competition] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <p className="font-mono tab-nums text-xs text-turf">ADMINISTRATION</p>
      <h1 className="font-display text-2xl mt-1 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Stat label="Matchs en base" value={MOCK_MATCHES.length.toString()} />
        <Stat label="Championnats actifs" value={Object.keys(byCompetition).length.toString()} />
        <Stat label="Version du modèle" value="reactived_v1" />
        <Stat label="Source de données" value="démo (statique)" />
      </div>

      <section className="border border-pitch-line bg-pitch-surface p-4 mb-6">
        <h2 className="font-display text-sm text-white/60 mb-3">Répartition par championnat</h2>
        <ul className="flex flex-col divide-y divide-pitch-line">
          {Object.entries(byCompetition).map(([name, count]) => (
            <li key={name} className="flex justify-between py-2 text-sm font-body">
              <span>{name}</span>
              <span className="font-mono tab-nums text-white/60">{count} match(s)</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-pitch-line bg-pitch-surface p-4">
        <h2 className="font-display text-sm text-white/60 mb-3">Import de données</h2>
        <p className="text-sm text-white/50 font-body mb-3">
          L'import CSV Football-Data.co.uk n'est pas encore branché à cette interface — voir
          <code className="font-mono text-xs bg-pitch px-1 mx-1">data_loader.py</code>
          dans le dépôt du moteur (prochaine étape du projet).
        </p>
        <button disabled className="font-display text-sm px-4 py-2 border border-pitch-line text-white/30 cursor-not-allowed">
          Importer un CSV
        </button>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-pitch-line bg-pitch-surface p-3">
      <p className="text-[11px] text-white/50 font-body">{label}</p>
      <p className="font-mono tab-nums text-lg mt-1">{value}</p>
    </div>
  );
}
