"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, PackageCheck, PackageX, ScanLine } from "lucide-react";
import { fcfa } from "@/lib/data";
import type { ReservationBoutique } from "@/lib/pro-data";
import type { EtatBoutique } from "./store";

const statutStyle: Record<ReservationBoutique["statut"], [string, string]> = {
  "a-confirmer": ["À confirmer", "bg-accent/10 text-accent-ink"],
  prete: ["Prête", "bg-secondary text-primary"],
  retiree: ["Retirée", "bg-success/10 text-success"],
  annulee: ["Rupture · annulée", "bg-muted text-muted-foreground"],
};

/** Réservations des clients + validation du retrait au comptoir (formules Gratuit et Premium). */
export function Reservations({
  reservations,
  maj,
}: {
  reservations: ReservationBoutique[];
  maj: (f: (e: EtatBoutique) => EtatBoutique) => void;
}) {
  const [code, setCode] = useState("");
  const [verif, setVerif] = useState<{ ok: boolean; r?: ReservationBoutique; msg: string } | null>(null);

  const changer = (c: string, statut: ReservationBoutique["statut"]) =>
    maj((e) => ({ ...e, reservations: e.reservations.map((r) => (r.code === c ? { ...r, statut } : r)) }));

  const verifier = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const r = reservations.find((x) => x.code === c);
    if (!r) return setVerif({ ok: false, msg: "Code inconnu. Vérifiez la saisie avec le client." });
    if (r.statut === "retiree") return setVerif({ ok: false, r, msg: "Cette réservation a déjà été retirée." });
    if (r.statut === "annulee") return setVerif({ ok: false, r, msg: "Cette réservation a été annulée (rupture)." });
    setVerif({ ok: true, r, msg: "" });
  };

  const aTraiter = reservations.filter((r) => r.statut === "a-confirmer").length;
  const pretes = reservations.filter((r) => r.statut === "prete").length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-primary p-4 text-white shadow-sm">
          <p className="font-serif text-3xl leading-none">{aTraiter}</p>
          <p className="mt-1 text-xs text-white/80">Réservations à confirmer</p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
          <p className="font-serif text-3xl leading-none">{pretes}</p>
          <p className="mt-1 text-xs text-muted-foreground">Prêtes pour le retrait</p>
        </div>
      </div>

      <section className="rounded-2xl bg-foreground p-5 text-white shadow-sm md:p-6">
        <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-accent uppercase">
          <ScanLine className="size-4" /> Au comptoir
        </p>
        <h2 className="mt-2 font-serif text-2xl">Valider un retrait</h2>
        <form onSubmit={verifier} className="mt-4 flex gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-4 text-foreground">
            <KeyRound className="size-5 text-primary" />
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setVerif(null);
              }}
              placeholder="Code (ex. QB-7KD2X)"
              aria-label="Code de retrait"
              className="w-full bg-transparent py-3.5 font-mono tracking-wider uppercase outline-none placeholder:normal-case placeholder:tracking-normal"
            />
          </label>
          <button className="rounded-xl bg-accent px-5 font-bold text-accent-foreground">Vérifier</button>
        </form>
        {verif && !verif.ok && <p className="mt-3 rounded-xl bg-white/10 p-3 text-sm">{verif.msg}</p>}
        {verif?.ok && verif.r && (
          <div className="mt-4 rounded-xl bg-white p-4 text-foreground">
            <p className="text-sm text-muted-foreground">
              {verif.r.client} · {verif.r.quantite} {verif.r.unite} de {verif.r.produit}
            </p>
            <p className="mt-1 text-sm">Montant exact à encaisser</p>
            <p className="font-serif text-3xl text-primary">{fcfa(verif.r.total)}</p>
            <button
              onClick={() => {
                changer(verif.r!.code, "retiree");
                setVerif({ ok: false, msg: `Retrait ${verif.r!.code} confirmé. Merci !` });
                setCode("");
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 font-bold text-white"
            >
              <CheckCircle2 className="size-5" /> Paiement reçu, retrait effectué
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold">Réservations des clients</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reservations.map((r) => {
            const [label, cls] = statutStyle[r.statut];
            return (
              <article key={r.code} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold tracking-wider">{r.code}</p>
                    <p className="text-sm text-muted-foreground">{r.client}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span>
                </div>
                <p className="mt-2 text-sm">
                  {r.quantite} {r.unite} · {r.produit}
                </p>
                <p className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{r.creneau}</span>
                  <strong>{fcfa(r.total)}</strong>
                </p>
                {r.statut === "a-confirmer" && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => changer(r.code, "prete")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-white"
                    >
                      <PackageCheck className="size-4" /> Mise de côté
                    </button>
                    <button
                      onClick={() => changer(r.code, "annulee")}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold"
                    >
                      <PackageX className="size-4" /> Rupture
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          En cas de rupture, le client est prévenu. Aucun remplacement ne lui est imposé : une alternative doit
          être acceptée de sa part.
        </p>
      </section>
    </div>
  );
}
