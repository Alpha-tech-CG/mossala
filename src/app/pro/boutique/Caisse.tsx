"use client";

import { useState } from "react";
import { CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import { fcfa } from "@/lib/data";
import { AUJOURDHUI, nouvelId, prixVente, type EtatBoutique, type Vente } from "./store";

type Maj = (f: (e: EtatBoutique) => EtatBoutique) => void;
type Ligne = { articleId: string; quantite: number };

const PAIEMENTS: Vente["paiement"][] = ["Espèces", "MTN MoMo", "Airtel Money"];

/** Caisse : enregistre une vente au comptoir et décompte le stock. */
export function Caisse({ etat, maj }: { etat: EtatBoutique; maj: Maj }) {
  const [panier, setPanier] = useState<Ligne[]>([]);
  const [choix, setChoix] = useState("");
  const [client, setClient] = useState("");
  const [paiement, setPaiement] = useState<Vente["paiement"]>("Espèces");
  const [ok, setOk] = useState<number | null>(null);

  const article = (id: string) => etat.articles.find((a) => a.id === id)!;
  const total = panier.reduce((s, l) => s + l.quantite * prixVente(article(l.articleId)), 0);
  const dispo = etat.articles.filter((a) => a.stock > 0);

  const ajouter = (id: string) => {
    if (!id) return;
    setOk(null);
    setPanier((p) =>
      p.some((l) => l.articleId === id)
        ? p.map((l) => (l.articleId === id ? { ...l, quantite: Math.min(article(id).stock, l.quantite + 1) } : l))
        : [...p, { articleId: id, quantite: 1 }],
    );
    setChoix("");
  };

  const encaisser = () => {
    const lignes = panier;
    maj((e) => ({
      ...e,
      ventes: [
        ...e.ventes,
        ...lignes.map((l) => ({
          id: nouvelId(),
          date: AUJOURDHUI,
          articleId: l.articleId,
          quantite: l.quantite,
          prixUnitaire: prixVente(e.articles.find((a) => a.id === l.articleId)!),
          clientId: client || undefined,
          canal: "comptoir" as const,
          paiement,
        })),
      ],
      articles: e.articles.map((a) => {
        const l = lignes.find((x) => x.articleId === a.id);
        return l ? { ...a, stock: Math.max(0, a.stock - l.quantite) } : a;
      }),
      mouvements: [
        ...lignes.map((l) => ({ id: nouvelId(), date: AUJOURDHUI, articleId: l.articleId, quantite: -l.quantite, motif: "Vente" as const })),
        ...e.mouvements,
      ],
    }));
    setOk(total);
    setPanier([]);
    setClient("");
  };

  const duJour = etat.ventes.filter((v) => v.date === AUJOURDHUI).slice().reverse();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
        <h2 className="font-bold">Nouvelle vente</h2>
        <select
          value={choix}
          onChange={(e) => ajouter(e.target.value)}
          aria-label="Ajouter un produit"
          className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-3 text-sm"
        >
          <option value="">+ Ajouter un produit…</option>
          {dispo.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom} · {fcfa(prixVente(a))} · {a.stock} en stock
            </option>
          ))}
        </select>

        <ul className="mt-4 divide-y divide-border">
          {panier.map((l) => {
            const a = article(l.articleId);
            return (
              <li key={l.articleId} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-semibold">{a.nom}</span>
                  <span className="text-muted-foreground">{fcfa(prixVente(a))} / {a.unite}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <button
                    aria-label="Moins"
                    onClick={() => setPanier((p) => p.map((x) => (x.articleId === l.articleId ? { ...x, quantite: Math.max(1, x.quantite - 1) } : x)))}
                    className="flex size-7 items-center justify-center rounded-full ring-1 ring-border"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold tabular-nums">{l.quantite}</span>
                  <button
                    aria-label="Plus"
                    onClick={() => setPanier((p) => p.map((x) => (x.articleId === l.articleId ? { ...x, quantite: Math.min(a.stock, x.quantite + 1) } : x)))}
                    className="flex size-7 items-center justify-center rounded-full ring-1 ring-border"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </span>
                <strong className="w-28 text-right text-sm">{fcfa(l.quantite * prixVente(a))}</strong>
                <button aria-label="Retirer" onClick={() => setPanier((p) => p.filter((x) => x.articleId !== l.articleId))}>
                  <Trash2 className="size-4 text-muted-foreground" />
                </button>
              </li>
            );
          })}
          {!panier.length && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              {ok !== null ? (
                <span className="flex items-center justify-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="size-5" /> Vente de {fcfa(ok)} enregistrée, stock mis à jour.
                </span>
              ) : (
                "Le panier est vide."
              )}
            </li>
          )}
        </ul>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select value={client} onChange={(e) => setClient(e.target.value)} aria-label="Client" className="rounded-xl border border-border bg-white px-3 py-3 text-sm">
            <option value="">Client de passage</option>
            {etat.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-1.5">
            {PAIEMENTS.map((p) => (
              <button
                key={p}
                aria-pressed={paiement === p}
                onClick={() => setPaiement(p)}
                className={`rounded-xl border-2 px-1 py-2 text-xs font-bold ${paiement === p ? "border-primary bg-secondary text-primary" : "border-border"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!panier.length}
          onClick={encaisser}
          className="mt-4 flex w-full items-center justify-between rounded-xl bg-accent px-5 py-4 font-bold text-accent-foreground disabled:opacity-50"
        >
          <span>Encaisser</span>
          <span className="font-serif text-xl">{fcfa(total)}</span>
        </button>
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
        <h2 className="font-bold">Ventes du jour</h2>
        <p className="mt-1 font-serif text-2xl text-primary">
          {fcfa(duJour.reduce((s, v) => s + v.quantite * v.prixUnitaire, 0))}
        </p>
        <ul className="mt-3 divide-y divide-border text-sm">
          {duJour.slice(0, 12).map((v) => (
            <li key={v.id} className="py-2">
              <div className="flex justify-between gap-2">
                <span className="truncate">
                  {v.quantite} × {article(v.articleId)?.nom ?? "Produit supprimé"}
                </span>
                <strong className="shrink-0">{fcfa(v.quantite * v.prixUnitaire)}</strong>
              </div>
              <p className="text-xs text-muted-foreground">
                {v.paiement} · {v.canal === "reservation" ? "Réservation Artopif" : "Comptoir"}
                {v.clientId && ` · ${etat.clients.find((c) => c.id === v.clientId)?.nom ?? ""}`}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
