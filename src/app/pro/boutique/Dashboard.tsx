"use client";

import { AlertTriangle, ArrowRight, Banknote, CalendarCheck, Percent, ShoppingBag, TrendingUp } from "lucide-react";
import { fcfa } from "@/lib/data";
import { AUJOURDHUI, type EtatBoutique } from "./store";

export type Onglet = "accueil" | "reservations" | "caisse" | "stock" | "clients" | "promotions" | "boutique";

const court = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(".", ",")} M` : n >= 1000 ? `${Math.round(n / 1000)} k` : `${n}`;

export function Dashboard({ etat, aller }: { etat: EtatBoutique; aller: (o: Onglet) => void }) {
  const mois = AUJOURDHUI.slice(0, 7);
  const article = (id: string) => etat.articles.find((a) => a.id === id);
  const ventesMois = etat.ventes.filter((v) => v.date.startsWith(mois));
  const ca = (vs: typeof ventesMois) => vs.reduce((s, v) => s + v.quantite * v.prixUnitaire, 0);
  const caMois = ca(ventesMois);
  const caJour = ca(etat.ventes.filter((v) => v.date === AUJOURDHUI));
  const marge = ventesMois.reduce(
    (s, v) => s + v.quantite * (v.prixUnitaire - (article(v.articleId)?.prixAchat ?? v.prixUnitaire)),
    0,
  );
  const tickets = new Set(ventesMois.map((v) => `${v.date}-${v.clientId ?? v.id}`)).size;
  const alertes = etat.articles.filter((a) => a.stock <= a.seuil);
  const aConfirmer = etat.reservations.filter((r) => r.statut === "a-confirmer").length;

  // 14 derniers jours
  const jours = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(`${AUJOURDHUI}T12:00:00`);
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().slice(0, 10);
    return { iso, label: d.toLocaleDateString("fr-FR", { day: "numeric" }), ca: ca(etat.ventes.filter((v) => v.date === iso)) };
  });
  const max = Math.max(1, ...jours.map((j) => j.ca));

  const top = Object.entries(
    etat.ventes.reduce<Record<string, number>>((acc, v) => {
      acc[v.articleId] = (acc[v.articleId] ?? 0) + v.quantite * v.prixUnitaire;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxTop = top[0]?.[1] ?? 1;

  const paiements = ["Espèces", "MTN MoMo", "Airtel Money"].map((p) => ({
    p,
    part: ca(ventesMois.filter((v) => v.paiement === p)) / Math.max(1, caMois),
  }));

  const kpis = [
    { Icon: Banknote, label: "Chiffre d’affaires du mois", valeur: fcfa(caMois), fort: true },
    { Icon: TrendingUp, label: "Aujourd’hui", valeur: fcfa(caJour) },
    { Icon: Percent, label: "Marge brute du mois", valeur: fcfa(marge) },
    { Icon: ShoppingBag, label: "Panier moyen", valeur: fcfa(Math.round(caMois / Math.max(1, tickets))) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ Icon, label, valeur, fort }) => (
          <div
            key={label}
            className={`rounded-2xl p-4 shadow-sm ${fort ? "bg-primary text-white" : "bg-card ring-1 ring-black/[0.03]"}`}
          >
            <Icon className={`size-5 ${fort ? "text-accent" : "text-primary"}`} />
            <p className="mt-3 font-serif text-xl leading-tight sm:text-2xl lg:text-xl xl:text-2xl">{valeur}</p>
            <p className={`mt-1 text-xs ${fort ? "text-white/75" : "text-muted-foreground"}`}>{label}</p>
          </div>
        ))}
      </div>

      {(aConfirmer > 0 || alertes.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {aConfirmer > 0 && (
            <button
              onClick={() => aller("reservations")}
              className="flex items-center gap-3 rounded-2xl bg-accent/15 p-4 text-left ring-1 ring-accent/40"
            >
              <CalendarCheck className="size-6 shrink-0 text-accent-ink" />
              <span className="flex-1 text-sm">
                <strong>{aConfirmer} réservation{aConfirmer > 1 ? "s" : ""}</strong> à confirmer
              </span>
              <ArrowRight className="size-4" />
            </button>
          )}
          {alertes.length > 0 && (
            <button
              onClick={() => aller("stock")}
              className="flex items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-left ring-1 ring-destructive/30"
            >
              <AlertTriangle className="size-6 shrink-0 text-destructive" />
              <span className="flex-1 text-sm">
                <strong>{alertes.length} produit{alertes.length > 1 ? "s" : ""}</strong> en stock bas ou épuisé
              </span>
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      )}

      <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">Ventes des 14 derniers jours</h2>
          <span className="text-xs text-muted-foreground">en FCFA</span>
        </div>
        <div className="mt-5 flex h-44 items-end gap-1.5" role="img" aria-label="Graphique des ventes par jour">
          {jours.map((j) => (
            <div key={j.iso} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground opacity-0 transition group-hover:opacity-100">
                {court(j.ca)}
              </span>
              <div
                className={`w-full rounded-t-md transition ${j.iso === AUJOURDHUI ? "bg-accent" : "bg-primary/80 group-hover:bg-primary"}`}
                style={{ height: `${Math.max(3, (j.ca / max) * 100)}%` }}
                title={`${j.iso} : ${fcfa(j.ca)}`}
              />
              <span className="text-[10px] text-muted-foreground">{j.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
          <h2 className="font-bold">Meilleures ventes (30 jours)</h2>
          <ul className="mt-4 space-y-3">
            {top.map(([id, montant]) => (
              <li key={id}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{article(id)?.nom ?? id}</span>
                  <strong className="shrink-0">{fcfa(montant)}</strong>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(montant / maxTop) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
          <h2 className="font-bold">Moyens de paiement (mois)</h2>
          <ul className="mt-4 space-y-3">
            {paiements.map(({ p, part }) => (
              <li key={p}>
                <div className="flex justify-between text-sm">
                  <span>{p}</span>
                  <strong>{Math.round(part * 100)} %</strong>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${part * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-bold">Stock à surveiller</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {alertes.slice(0, 4).map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span className="truncate">{a.nom}</span>
                <span className={`shrink-0 font-bold ${a.stock ? "text-accent-ink" : "text-destructive"}`}>
                  {a.stock ? `${a.stock} ${a.unite}` : "Épuisé"}
                </span>
              </li>
            ))}
            {!alertes.length && <li className="text-muted-foreground">Tout est en stock.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
