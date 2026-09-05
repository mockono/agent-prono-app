import type { TicketResult } from "@/lib/engine/ticketBuilder";

export function TicketPanel({ ticket }: { ticket: TicketResult }) {
  return (
    <div className="border border-pitch-line bg-pitch-surface p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between border-b border-pitch-line pb-3">
        <div>
          <p className="text-[11px] text-white/50 font-body">Ticket</p>
          <h3 className="font-display text-lg">
            {ticket.forfait}
            {ticket.proSubtier ? ` · ${ticket.proSubtier.replace("PRO_", "").replace("_", "–")}` : ""}
            {ticket.montanteStep ? ` · ${ticket.montanteStep} matchs` : ""}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-white/50 font-body">Cote totale</p>
          <p className="font-mono tab-nums text-xl font-semibold text-flood">{ticket.totalOdds.toFixed(2)}</p>
        </div>
      </header>

      {ticket.status === "insufficient_data" && (
        <p className="text-xs text-conf-2 font-body border border-conf-2/40 bg-conf-2/10 px-3 py-2">
          {ticket.message}
        </p>
      )}

      {ticket.selections.length === 0 ? (
        <p className="text-sm text-white/50 font-body italic">Aucune sélection ne remplit les critères pour l'instant.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-pitch-line">
          {ticket.selections.map((s, i) => (
            <li key={s.analysis.match.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-mono tab-nums text-[11px] text-white/40 w-5">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-body text-sm truncate">
                    {s.analysis.match.home.name} vs {s.analysis.match.away.name}
                  </p>
                  <p className="text-[11px] text-white/50 font-body truncate">{s.selectionDetail}</p>
                </div>
              </div>
              <span className="font-mono tab-nums text-sm text-flood shrink-0">{s.odds.toFixed(2)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
