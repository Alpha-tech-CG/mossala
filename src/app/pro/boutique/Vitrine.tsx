"use client";

import { useState } from "react";
import { BadgePercent, CheckCircle2, Eye, MousePointerClick, Phone, Trash2 } from "lucide-react";
import { fcfa } from "@/lib/data";
import { AUJOURDHUI, type EtatBoutique, type Infos } from "./store";

type Maj = (f: (e: EtatBoutique) => EtatBoutique) => void;
const input = "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm";

/** Promotions affichées sur la vitrine Artopif. */
export function Promotions({ etat, maj }: { etat: EtatBoutique; maj: Maj }) {
  const [articleId, setArticleId] = useState("");
  const [prix, setPrix] = useState("");
  const [fin, setFin] = useState("");
  const enPromo = etat.articles.filter((a) => a.promo);
  const choisi = etat.articles.find((a) => a.id === articleId);

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const p = Number(prix);
          if (!choisi || !p || p >= choisi.prix) return;
          maj((x) => ({
            ...x,
            articles: x.articles.map((a) => (a.id === articleId ? { ...a, promo: { prix: p, jusqua: fin } } : a)),
          }));
          setArticleId("");
          setPrix("");
          setFin("");
        }}
        className="grid gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03] sm:grid-cols-2"
      >
        <h2 className="flex items-center gap-2 font-bold sm:col-span-2">
          <BadgePercent className="size-5 text-accent-ink" /> Créer une promotion
        </h2>
        <select required value={articleId} onChange={(e) => setArticleId(e.target.value)} aria-label="Produit" className={`${input} sm:col-span-2`}>
          <option value="">Choisir un produit…</option>
          {etat.articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom} · prix actuel {fcfa(a.prix)}
            </option>
          ))}
        </select>
        <label className="text-sm font-semibold">
          Prix promotionnel (FCFA)
          <input
            required
            inputMode="numeric"
            value={prix}
            onChange={(e) => setPrix(e.target.value.replace(/\D/g, ""))}
            className={`${input} mt-1`}
          />
          {choisi && Number(prix) > 0 && (
            <span className={`mt-1 block text-xs ${Number(prix) < choisi.prix ? "text-success" : "text-destructive"}`}>
              {Number(prix) < choisi.prix
                ? `−${Math.round((1 - Number(prix) / choisi.prix) * 100)} % · marge ${fcfa(Number(prix) - choisi.prixAchat)} / ${choisi.unite}`
                : "Le prix promo doit être inférieur au prix actuel."}
            </span>
          )}
        </label>
        <label className="text-sm font-semibold">
          Jusqu’au
          <input required type="date" min={AUJOURDHUI} value={fin} onChange={(e) => setFin(e.target.value)} className={`${input} mt-1`} />
        </label>
        <button className="rounded-xl bg-accent py-3 font-bold text-accent-foreground sm:col-span-2">Publier la promotion</button>
      </form>

      <section>
        <h2 className="font-bold">Promotions en cours</h2>
        <ul className="mt-3 space-y-2">
          {enPromo.map((a) => {
            const expiree = a.promo!.jusqua < AUJOURDHUI;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{a.nom}</span>
                  <span className="text-sm">
                    <strong className="text-destructive">{fcfa(a.promo!.prix)}</strong>{" "}
                    <span className="text-muted-foreground line-through">{fcfa(a.prix)}</span>
                  </span>
                </span>
                <span className={`text-xs font-semibold ${expiree ? "text-muted-foreground" : "text-success"}`}>
                  {expiree ? "Terminée" : `Jusqu’au ${a.promo!.jusqua.split("-").reverse().join("/")}`}
                </span>
                <button
                  aria-label={`Arrêter la promotion sur ${a.nom}`}
                  onClick={() => maj((x) => ({ ...x, articles: x.articles.map((y) => (y.id === a.id ? { ...y, promo: undefined } : y)) }))}
                  className="flex size-9 items-center justify-center rounded-full ring-1 ring-border"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
          {!enPromo.length && <li className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">Aucune promotion.</li>}
        </ul>
      </section>
    </div>
  );
}

/** Informations publiques de la boutique + statistiques de la vitrine. */
export function MaBoutique({ etat, maj }: { etat: EtatBoutique; maj: Maj }) {
  const [f, setF] = useState<Infos>(etat.infos);
  const [ok, setOk] = useState(false);
  const set = (k: keyof Infos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOk(false);
    setF({ ...f, [k]: e.target.value });
  };
  // MAQUETTE : chiffres de fréquentation de démonstration (à mesurer côté serveur)
  const stats = [
    { Icon: Eye, label: "Vues de la vitrine (30 j)", valeur: "1 284" },
    { Icon: MousePointerClick, label: "Clics « Réserver »", valeur: "96" },
    { Icon: Phone, label: "Appels depuis Artopif", valeur: "41" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ Icon, label, valeur }) => (
          <div key={label} className="rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/[0.03] sm:p-4">
            <Icon className="size-5 text-primary" />
            <p className="mt-2 font-serif text-xl sm:text-2xl">{valeur}</p>
            <p className="text-[11px] text-muted-foreground sm:text-xs">{label}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          maj((x) => ({ ...x, infos: f }));
          setOk(true);
        }}
        className="grid gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]"
      >
        <h2 className="font-bold">Informations affichées aux clients</h2>
        <label className="text-sm font-semibold">
          Nom de la boutique
          <input required value={f.nom} onChange={set("nom")} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-semibold">
          Adresse
          <input required value={f.adresse} onChange={set("adresse")} className={`${input} mt-1`} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Téléphone
            <input required type="tel" value={f.telephone} onChange={set("telephone")} className={`${input} mt-1`} />
          </label>
          <label className="text-sm font-semibold">
            Horaires
            <input required value={f.horaires} onChange={set("horaires")} className={`${input} mt-1`} />
          </label>
        </div>
        <label className="text-sm font-semibold">
          Présentation
          <textarea rows={3} value={f.description} onChange={set("description")} className={`${input} mt-1 resize-none`} />
        </label>
        <button className="rounded-xl bg-primary py-3 font-bold text-white">Enregistrer</button>
        {ok && (
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <CheckCircle2 className="size-4" /> Informations enregistrées.
          </p>
        )}
      </form>
    </div>
  );
}
