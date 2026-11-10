"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDownUp, Eye, EyeOff, PackagePlus, Search, Send } from "lucide-react";
import { fcfa } from "@/lib/data";
import { AUJOURDHUI, nouvelId, type Article, type EtatBoutique, type Mouvement } from "./store";

type Maj = (f: (e: EtatBoutique) => EtatBoutique) => void;

const input = "rounded-lg border border-border bg-white px-2 py-1.5 text-sm";
const MOTIFS: Mouvement["motif"][] = ["Réception fournisseur", "Casse / perte", "Inventaire"];

export function Stock({ etat, maj }: { etat: EtatBoutique; maj: Maj }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [mvt, setMvt] = useState<string | null>(null);
  const [ajout, setAjout] = useState(false);

  const categories = [...new Set(etat.articles.map((a) => a.categorie))].sort();
  const liste = etat.articles.filter(
    (a) => (!cat || a.categorie === cat) && a.nom.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const valeur = etat.articles.reduce((s, a) => s + a.stock * a.prixAchat, 0);
  const alertes = etat.articles.filter((a) => a.stock <= a.seuil);

  const modifier = (id: string, champ: Partial<Article>) =>
    maj((e) => ({ ...e, articles: e.articles.map((a) => (a.id === id ? { ...a, ...champ } : a)) }));

  const mouvement = (articleId: string, quantite: number, motif: Mouvement["motif"]) =>
    maj((e) => ({
      ...e,
      articles: e.articles.map((a) =>
        a.id === articleId ? { ...a, stock: motif === "Inventaire" ? quantite : Math.max(0, a.stock + quantite) } : a,
      ),
      mouvements: [
        {
          id: nouvelId(),
          date: AUJOURDHUI,
          articleId,
          quantite: motif === "Inventaire" ? quantite - (e.articles.find((a) => a.id === articleId)?.stock ?? 0) : quantite,
          motif,
        },
        ...e.mouvements,
      ],
    }));

  const reassort = alertes
    .map((a) => `- ${a.nom} : ${Math.max(a.seuil * 2 - a.stock, a.seuil)} ${a.unite}`)
    .join("\n");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Références" valeur={String(etat.articles.length)} />
        <Stat label="Valeur du stock (achat)" valeur={fcfa(valeur)} />
        <Stat label="Alertes" valeur={String(alertes.length)} alerte={alertes.length > 0} />
      </div>

      {alertes.length > 0 && (
        <section className="rounded-2xl bg-destructive/10 p-4 ring-1 ring-destructive/30">
          <p className="flex items-center gap-2 font-bold">
            <AlertTriangle className="size-5 text-destructive" /> Liste de réassort suggérée
          </p>
          <pre className="mt-2 font-sans text-sm whitespace-pre-wrap">{reassort}</pre>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, commande pour ${etat.infos.nom} (${etat.infos.adresse}) :\n${reassort}`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Send className="size-4" /> Envoyer au fournisseur par WhatsApp
          </a>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-0 flex-1 basis-56 items-center gap-2 rounded-xl bg-card px-3 ring-1 ring-border">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit"
            aria-label="Rechercher un produit"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
        </label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Catégorie" className="rounded-xl bg-card px-3 text-sm ring-1 ring-border">
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => setAjout((x) => !x)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
        >
          <PackagePlus className="size-4" /> Nouveau produit
        </button>
      </div>

      {ajout && (
        <NouveauProduit
          onAjout={(a) => {
            maj((e) => ({ ...e, articles: [a, ...e.articles] }));
            setAjout(false);
          }}
        />
      )}

      <div className="space-y-3">
        {liste.map((a) => {
          const bas = a.stock <= a.seuil;
          return (
            <article key={a.id} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold leading-tight">{a.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.categorie} · marge {Math.round(((a.prix - a.prixAchat) / a.prix) * 100)} %
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      !a.stock ? "bg-destructive text-white" : bas ? "bg-accent/20 text-accent-ink" : "bg-success/10 text-success"
                    }`}
                  >
                    {a.stock} {a.unite}
                    {!a.stock ? " · épuisé" : bas ? " · stock bas" : ""}
                  </span>
                  <button
                    onClick={() => modifier(a.id, { enLigne: !a.enLigne })}
                    aria-pressed={a.enLigne}
                    title={a.enLigne ? "Visible sur Artopif" : "Masqué sur Artopif"}
                    className="flex size-8 items-center justify-center rounded-full ring-1 ring-border"
                  >
                    {a.enLigne ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <Champ label="Prix de vente" valeur={a.prix} onChange={(n) => modifier(a.id, { prix: n })} />
                <Champ label="Prix d’achat" valeur={a.prixAchat} onChange={(n) => modifier(a.id, { prixAchat: n })} />
                <Champ label="Seuil d’alerte" valeur={a.seuil} onChange={(n) => modifier(a.id, { seuil: n })} court />
                <button
                  onClick={() => setMvt(mvt === a.id ? null : a.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary"
                >
                  <ArrowDownUp className="size-3.5" /> Mouvement de stock
                </button>
              </div>
              {mvt === a.id && (
                <FormMouvement
                  unite={a.unite}
                  onValider={(n, motif) => {
                    mouvement(a.id, n, motif);
                    setMvt(null);
                  }}
                />
              )}
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
        <h2 className="font-bold">Derniers mouvements</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {etat.mouvements.slice(0, 8).map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                {etat.articles.find((a) => a.id === m.articleId)?.nom}
                <span className="text-muted-foreground"> · {m.motif}</span>
              </span>
              <span className={`font-bold ${m.quantite >= 0 ? "text-success" : "text-destructive"}`}>
                {m.quantite >= 0 ? "+" : ""}
                {m.quantite} <span className="font-normal text-muted-foreground">· {m.date.split("-").reverse().join("/")}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, valeur, alerte }: { label: string; valeur: string; alerte?: boolean }) {
  return (
    <div className="rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/[0.03] sm:p-4">
      <p className={`font-serif text-lg leading-tight sm:text-2xl ${alerte ? "text-destructive" : ""}`}>{valeur}</p>
      <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{label}</p>
    </div>
  );
}

function Champ({ label, valeur, onChange, court }: { label: string; valeur: number; onChange: (n: number) => void; court?: boolean }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <input
        inputMode="numeric"
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
        className={`${input} ${court ? "w-14" : "w-24"} text-right font-semibold`}
      />
    </label>
  );
}

function FormMouvement({ unite, onValider }: { unite: string; onValider: (n: number, m: Mouvement["motif"]) => void }) {
  const [motif, setMotif] = useState<Mouvement["motif"]>("Réception fournisseur");
  const [n, setN] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = Number(n) || 0;
        if (!q && motif !== "Inventaire") return;
        onValider(motif === "Casse / perte" ? -q : q, motif);
      }}
      className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm"
    >
      <select value={motif} onChange={(e) => setMotif(e.target.value as Mouvement["motif"])} aria-label="Motif" className={input}>
        {MOTIFS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <input
        inputMode="numeric"
        required
        value={n}
        onChange={(e) => setN(e.target.value.replace(/\D/g, ""))}
        placeholder={motif === "Inventaire" ? "Stock compté" : "Quantité"}
        aria-label="Quantité"
        className={`${input} w-28`}
      />
      <span className="text-muted-foreground">{unite}</span>
      <button className="rounded-lg bg-primary px-3 py-1.5 font-bold text-white">Valider</button>
    </form>
  );
}

function NouveauProduit({ onAjout }: { onAjout: (a: Article) => void }) {
  const [f, setF] = useState({ nom: "", categorie: "", unite: "pièce", prix: "", prixAchat: "", stock: "", seuil: "5" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAjout({
          id: nouvelId(),
          nom: f.nom.trim(),
          categorie: f.categorie.trim() || "Divers",
          unite: f.unite.trim() || "pièce",
          prix: Number(f.prix) || 0,
          prixAchat: Number(f.prixAchat) || 0,
          stock: Number(f.stock) || 0,
          seuil: Number(f.seuil) || 0,
          enLigne: true,
        });
      }}
      className="grid gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-primary/30 sm:grid-cols-2"
    >
      <input required placeholder="Nom du produit" aria-label="Nom du produit" value={f.nom} onChange={set("nom")} className={`${input} sm:col-span-2`} />
      <input placeholder="Catégorie (ex. Ciment)" aria-label="Catégorie" value={f.categorie} onChange={set("categorie")} className={input} />
      <input placeholder="Unité (sac, barre, m²…)" aria-label="Unité" value={f.unite} onChange={set("unite")} className={input} />
      <input required inputMode="numeric" placeholder="Prix de vente (FCFA)" aria-label="Prix de vente" value={f.prix} onChange={set("prix")} className={input} />
      <input inputMode="numeric" placeholder="Prix d’achat (FCFA)" aria-label="Prix d’achat" value={f.prixAchat} onChange={set("prixAchat")} className={input} />
      <input inputMode="numeric" placeholder="Stock initial" aria-label="Stock initial" value={f.stock} onChange={set("stock")} className={input} />
      <input inputMode="numeric" placeholder="Seuil d’alerte" aria-label="Seuil d’alerte" value={f.seuil} onChange={set("seuil")} className={input} />
      <button className="rounded-xl bg-accent py-2.5 font-bold text-accent-foreground sm:col-span-2">Ajouter au catalogue</button>
    </form>
  );
}
