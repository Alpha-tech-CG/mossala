"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Minus, PackageCheck, PackageX, Plus, ScanLine } from "lucide-react";
import { ProduitFallback } from "@/components/ui";
import type { Produit } from "@/lib/data";
import { fcfa } from "@/lib/data";
import type { ReservationBoutique } from "@/lib/pro-data";

const statutStyle: Record<ReservationBoutique["statut"], [string, string]> = {
  "a-confirmer": ["À confirmer", "bg-accent/10 text-accent-ink"],
  prete: ["Prête", "bg-secondary text-primary"],
  retiree: ["Retirée", "bg-success/10 text-success"],
  annulee: ["Rupture · annulée", "bg-muted text-muted-foreground"],
};

export function EspaceBoutique({
  reservations: init,
  produits: initProduits,
}: {
  reservations: ReservationBoutique[];
  produits: Produit[];
}) {
  const [reservations, setReservations] = useState(init);
  const [produits, setProduits] = useState(initProduits);
  const [code, setCode] = useState("");
  const [verif, setVerif] = useState<{ ok: boolean; r?: ReservationBoutique; msg: string } | null>(null);

  const maj = (c: string, statut: ReservationBoutique["statut"]) =>
    setReservations((rs) => rs.map((r) => (r.code === c ? { ...r, statut } : r)));

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

      {/* Validation du retrait au comptoir */}
      <section className="rounded-2xl bg-foreground p-5 text-white shadow-sm md:p-6">
        <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
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
                maj(verif.r!.code, "retiree");
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
        <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Clients</p>
        <h2 className="mt-1 text-xl font-bold">Réservations</h2>
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
                    <button onClick={() => maj(r.code, "prete")} className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-white">
                      <PackageCheck className="size-4" /> Mise de côté
                    </button>
                    <button onClick={() => maj(r.code, "annulee")} className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold">
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

      <section>
        <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Catalogue</p>
        <h2 className="mt-1 text-xl font-bold">Mes produits</h2>
        <div className="mt-4 space-y-3">
          {produits.map((p) => (
            <article key={p.id} className="flex gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/[0.03] sm:p-4">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="size-full object-cover" />
                ) : (
                  <ProduitFallback categorie={p.categorie} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">{p.nom}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <label className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">Prix</span>
                    <input
                      inputMode="numeric"
                      value={p.prix}
                      onChange={(e) =>
                        setProduits(produits.map((x) => (x.id === p.id ? { ...x, prix: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)))
                      }
                      aria-label={`Prix de ${p.nom}`}
                      className="w-24 rounded-lg border border-border px-2 py-1 text-right font-semibold"
                    />
                    <span className="text-muted-foreground">F</span>
                  </label>
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">Stock</span>
                    <button
                      aria-label="Retirer du stock"
                      onClick={() => setProduits(produits.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, x.stock - 1) } : x)))}
                      className="flex size-7 items-center justify-center rounded-full ring-1 ring-border"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className={`w-8 text-center font-bold tabular-nums ${p.stock ? "" : "text-destructive"}`}>{p.stock}</span>
                    <button
                      aria-label="Ajouter au stock"
                      onClick={() => setProduits(produits.map((x) => (x.id === p.id ? { ...x, stock: x.stock + 1 } : x)))}
                      className="flex size-7 items-center justify-center rounded-full ring-1 ring-border"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Un changement de prix s’applique aux nouvelles réservations ; les réservations en cours gardent le prix
          affiché au moment de la réservation.
        </p>
      </section>
    </div>
  );
}
