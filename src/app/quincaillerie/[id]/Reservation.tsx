"use client";

import { useState } from "react";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import { fcfa } from "@/lib/data";

const creneaux = ["Aujourd’hui 14h–18h", "Demain 8h–12h", "Demain 14h–18h"];

export function Reservation(props: { prix: number; stock: number; unite: string; boutique: string }) {
  const [qte, setQte] = useState(1);
  const [creneau, setCreneau] = useState(creneaux[0]);
  const [code, setCode] = useState<string | null>(null);
  const total = qte * props.prix;

  if (code) {
    return (
      <div className="mt-5 rounded-2xl bg-card p-5 text-center shadow-sm ring-2 ring-success">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <p className="mt-2 font-bold">Réservation confirmée</p>
        <p className="mt-3 text-xs tracking-widest text-muted-foreground uppercase">Code de retrait</p>
        <p className="font-mono text-3xl font-bold tracking-widest">{code}</p>
        <p className="mt-3 text-sm">
          {qte} {props.unite}
          {qte > 1 ? "s" : ""} · <strong>{fcfa(total)}</strong> à payer au retrait
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {props.boutique} · {creneau}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Quantité</span>
        <div className="flex items-center gap-3">
          <button
            aria-label="Retirer"
            onClick={() => setQte((q) => Math.max(1, q - 1))}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-lg font-bold tabular-nums">{qte}</span>
          <button
            aria-label="Ajouter"
            onClick={() => setQte((q) => Math.min(props.stock, q + 1))}
            className="flex size-10 items-center justify-center rounded-full border border-border bg-card"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Créneau de retrait</p>
        <div className="grid grid-cols-3 gap-2">
          {creneaux.map((c) => (
            <button
              key={c}
              onClick={() => setCreneau(c)}
              aria-pressed={creneau === c}
              className={`rounded-xl border-2 px-2 py-2.5 text-xs font-semibold ${
                creneau === c ? "border-primary bg-secondary text-primary" : "border-border bg-card"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Total à payer au retrait</span>
        <span className="text-xl font-bold">{fcfa(total)}</span>
      </div>
      <button
        onClick={() => setCode("QB-" + Math.random().toString(36).slice(2, 7).toUpperCase())}
        className="w-full rounded-xl bg-accent py-4 font-bold text-accent-foreground"
      >
        Réserver pour retrait
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Paiement au retrait, directement chez le boutiquier.
      </p>
    </div>
  );
}
