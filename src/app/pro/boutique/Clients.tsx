"use client";

import { useState } from "react";
import { MessageCircle, Phone, Search, UserPlus } from "lucide-react";
import { fcfa } from "@/lib/data";
import { AUJOURDHUI, nouvelId, type Client, type EtatBoutique } from "./store";

type Maj = (f: (e: EtatBoutique) => EtatBoutique) => void;
const TYPES: Client["type"][] = ["Artisan", "Particulier", "Entreprise"];
const input = "rounded-xl border border-border bg-white px-3 py-2.5 text-sm";

const joursDepuis = (date: string) =>
  Math.round((new Date(`${AUJOURDHUI}T12:00:00`).getTime() - new Date(`${date}T12:00:00`).getTime()) / 86_400_000);

/** Fichier clients : historique d'achats, notes, relance par WhatsApp. */
export function Clients({ etat, maj }: { etat: EtatBoutique; maj: Maj }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [ajout, setAjout] = useState(false);

  const fiches = etat.clients
    .map((c) => {
      const achats = etat.ventes.filter((v) => v.clientId === c.id);
      const visites = new Set(achats.map((v) => v.date));
      const derniere = [...visites].sort().at(-1);
      return {
        c,
        total: achats.reduce((s, v) => s + v.quantite * v.prixUnitaire, 0),
        visites: visites.size,
        derniere,
        achats,
      };
    })
    .filter((f) => (!type || f.c.type === type) && f.c.nom.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.total - a.total);

  const inactifs = fiches.filter((f) => !f.derniere || joursDepuis(f.derniere) > 14);
  const article = (id: string) => etat.articles.find((a) => a.id === id)?.nom ?? "Produit";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-0 flex-1 basis-56 items-center gap-2 rounded-xl bg-card px-3 ring-1 ring-border">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client"
            aria-label="Rechercher un client"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
        </label>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type de client" className="rounded-xl bg-card px-3 text-sm ring-1 ring-border">
          <option value="">Tous</option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <button onClick={() => setAjout((x) => !x)} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">
          <UserPlus className="size-4" /> Nouveau client
        </button>
      </div>

      {ajout && (
        <NouveauClient
          onAjout={(c) => {
            maj((e) => ({ ...e, clients: [c, ...e.clients] }));
            setAjout(false);
          }}
        />
      )}

      {inactifs.length > 0 && (
        <p className="rounded-2xl bg-secondary p-4 text-sm text-primary">
          <strong>{inactifs.length} client{inactifs.length > 1 ? "s" : ""}</strong> sans achat depuis plus de 14 jours :
          pensez à les relancer avec une promotion.
        </p>
      )}

      <div className="space-y-3">
        {fiches.map(({ c, total, visites, derniere, achats }) => (
          <article key={c.id} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
            <button onClick={() => setOuvert(ouvert === c.id ? null : c.id)} className="flex w-full items-start gap-3 text-left" aria-expanded={ouvert === c.id}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-lg text-white">
                {c.nom[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-bold">
                  {c.nom}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{c.type}</span>
                </span>
                <span className="block text-xs text-muted-foreground">
                  {visites} visite{visites > 1 ? "s" : ""} · dernière {derniere ? `il y a ${joursDepuis(derniere)} j` : "jamais"}
                </span>
              </span>
              <strong className="shrink-0 text-sm">{fcfa(total)}</strong>
            </button>
            {ouvert === c.id && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${c.telephone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-bold">
                    <Phone className="size-4" /> {c.telephone}
                  </a>
                  <a
                    href={`https://wa.me/${c.telephone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour ${c.nom.split(" ")[0]}, c'est ${etat.infos.nom}. `)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-sm font-bold text-white"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                </div>
                <label className="block text-sm">
                  <span className="font-semibold">Notes</span>
                  <textarea
                    rows={2}
                    value={c.note}
                    onChange={(e) =>
                      maj((x) => ({ ...x, clients: x.clients.map((y) => (y.id === c.id ? { ...y, note: e.target.value } : y)) }))
                    }
                    placeholder="Préférences, chantier en cours, conditions de paiement…"
                    className={`${input} mt-1 w-full resize-none`}
                  />
                </label>
                <div>
                  <p className="text-sm font-semibold">Derniers achats</p>
                  <ul className="mt-1 text-sm text-muted-foreground">
                    {achats
                      .slice(-5)
                      .reverse()
                      .map((v) => (
                        <li key={v.id} className="flex justify-between gap-2 py-0.5">
                          <span className="truncate">
                            {v.date.split("-").reverse().join("/")} · {v.quantite} × {article(v.articleId)}
                          </span>
                          <span className="shrink-0">{fcfa(v.quantite * v.prixUnitaire)}</span>
                        </li>
                      ))}
                    {!achats.length && <li>Aucun achat enregistré.</li>}
                  </ul>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function NouveauClient({ onAjout }: { onAjout: (c: Client) => void }) {
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [type, setType] = useState<Client["type"]>("Particulier");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAjout({ id: nouvelId(), nom: nom.trim(), telephone: tel.trim(), type, note: "" });
      }}
      className="grid gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-primary/30 sm:grid-cols-3"
    >
      <input required placeholder="Nom" aria-label="Nom du client" value={nom} onChange={(e) => setNom(e.target.value)} className={input} />
      <input required type="tel" placeholder="Téléphone" aria-label="Téléphone du client" value={tel} onChange={(e) => setTel(e.target.value)} className={input} />
      <select value={type} onChange={(e) => setType(e.target.value as Client["type"])} aria-label="Type" className={input}>
        {TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <button className="rounded-xl bg-accent py-2.5 font-bold text-accent-foreground sm:col-span-3">Ajouter le client</button>
    </form>
  );
}
