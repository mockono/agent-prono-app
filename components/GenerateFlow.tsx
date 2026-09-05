"use client";

import { useState } from "react";
import type { TicketResult, Forfait, ProSubtier } from "@/lib/engine/ticketBuilder";
import { TicketPanel } from "./TicketPanel";

const FORFAITS: { id: Forfait; label: string; hint: string }[] = [
  { id: "BASIC", label: "Basic", hint: "cote 3 – 6" },
  { id: "FUN", label: "Fun", hint: "cote 6 – 18" },
  { id: "PRO", label: "Pro", hint: "cote 18 – 1500" },
  { id: "MONTANTE", label: "Montante", hint: "10 à 40 matchs" },
];

const PRO_SUBTIERS: { id: ProSubtier; label: string }[] = [
  { id: "PRO_18_50", label: "18 – 50" },
  { id: "PRO_50_150", label: "50 – 150" },
  { id: "PRO_150_500", label: "150 – 500" },
  { id: "PRO_500_1500", label: "500 – 1500" },
];

export function GenerateFlow() {
  const [forfait, setForfait] = useState<Forfait>("BASIC");
  const [proSubtier, setProSubtier] = useState<ProSubtier>("PRO_18_50");
  const [montanteStep, setMontanteStep] = useState(10);
  const [ticket, setTicket] = useState<TicketResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forfait, proSubtier, montanteStep }),
      });
      const data = await res.json();
      setTicket(data.ticket);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {FORFAITS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setForfait(f.id);
              setTicket(null);
            }}
            className={`font-display text-sm px-4 py-2 border transition-colors ${
              forfait === f.id
                ? "bg-turf border-turf text-pitch"
                : "border-pitch-line text-white/70 hover:border-turf/60"
            }`}
          >
            {f.label}
            <span className="block text-[10px] font-mono tab-nums opacity-70">{f.hint}</span>
          </button>
        ))}
      </div>

      {forfait === "PRO" && (
        <div className="flex flex-wrap gap-2">
          {PRO_SUBTIERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setProSubtier(s.id)}
              className={`font-mono tab-nums text-xs px-3 py-1.5 border ${
                proSubtier === s.id ? "border-flood text-flood" : "border-pitch-line text-white/50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {forfait === "MONTANTE" && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMontanteStep((v) => Math.max(10, v - 1))}
            className="w-8 h-8 border border-pitch-line text-white/70 font-display"
          >
            −
          </button>
          <span className="font-mono tab-nums text-lg w-16 text-center">{montanteStep} matchs</span>
          <button
            onClick={() => setMontanteStep((v) => Math.min(40, v + 1))}
            className="w-8 h-8 border border-pitch-line text-white/70 font-display"
          >
            +
          </button>
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="self-start font-display text-sm tracking-wide px-6 py-2.5 bg-flood text-pitch disabled:opacity-50"
      >
        {loading ? "Analyse en cours…" : "Générer"}
      </button>

      {ticket && <TicketPanel ticket={ticket} />}
    </section>
  );
}
