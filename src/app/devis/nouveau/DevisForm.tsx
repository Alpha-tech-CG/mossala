"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Search, Send, Store } from "lucide-react";
import { InscriptionClient } from "@/components/Acces";
import { SUPABASE_ACTIF, erreurSupabase, estDemo, sb } from "@/lib/backend/supabase";
import { useCompte } from "@/lib/compte";
import { creerDemande, type ProDevis } from "@/lib/devis";
import { getArtisan, getBoutique, boutiques, metierLabel, quartiers } from "@/lib/data";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-4 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

/** Exemples de demandes, pour montrer qu'on peut écrire avec ses propres mots. */
const EXEMPLES: Record<ProDevis["type"], string[]> = {
  artisan: [
    "Je veux construire un poulailler de 280 m² à Kibina : fondations, 37 poteaux, toiture en aluminium. Combien pour les matériaux et la main-d’œuvre ?",
    "Fuite sous l’évier de la cuisine et un robinet qui goutte. Pouvez-vous me faire un prix ?",
  ],
  boutique: [
    "Il me faut 10 sacs de ciment, 3 m³ de sable, 12 barres de fer de 10 et 5 kg de pointes. C’est combien au total ?",
    "Je cherche de quoi refaire la plomberie d’une salle de bain : tuyaux PVC, robinet, raccords.",
  ],
};

function cible(params: URLSearchParams): ProDevis | null {
  const a = getArtisan(params.get("artisan") ?? "");
  if (a)
    return {
      type: "artisan",
      id: a.id,
      nom: a.nom,
      sous: metierLabel(a.metier).artisan,
      image: a.image,
      telephone: a.telephone,
    };
  const idB = params.get("boutique");
  const b = idB && boutiques.some((x) => x.id === idB) ? getBoutique(idB) : null;
  if (b) return { type: "boutique", id: b.id, nom: b.nom, sous: `Quincaillerie · ${b.quartier}`, image: b.image, telephone: b.telephone };
  return null;
}

/** Pro inscrit (base Supabase) visé par la demande, lu côté navigateur. */
function useProInscrit(params: URLSearchParams): { charge: boolean; pro: ProDevis | null } {
  const id = params.get("artisan") ?? params.get("boutique") ?? "";
  const aChercher = SUPABASE_ACTIF && !!id && !estDemo(id);
  const [res, setRes] = useState<{ id: string; pro: ProDevis | null } | null>(null);
  useEffect(() => {
    if (!aChercher) return;
    let actif = true;
    void sb()
      .from("pros")
      .select("id, type, nom, metier, quartier, image, telephone_public")
      .eq("id", id)
      .maybeSingle()
      .then(({ data: p }) => {
        if (!actif) return;
        setRes({
          id,
          pro: p
            ? {
                type: p.type,
                id: p.id,
                nom: p.nom,
                sous: p.type === "boutique" ? `Quincaillerie · ${p.quartier}` : p.metier ? metierLabel(p.metier).artisan : "Artisan",
                image: p.image ?? undefined,
                telephone: p.telephone_public ?? undefined,
              }
            : null,
        });
      });
    return () => {
      actif = false;
    };
  }, [aChercher, id]);
  return { charge: !aChercher || res?.id === id, pro: res?.id === id ? res.pro : null };
}

export function DevisForm() {
  const params = useSearchParams();
  const inscrit = useProInscrit(params);
  const pro = cible(params) ?? inscrit.pro;
  const { compte, pret } = useCompte();
  const similaire = params.get("similaire");
  const [texte, setTexte] = useState(similaire ? `Travaux similaires à : ${similaire}. ` : "");
  const [prenom, setPrenom] = useState("");
  const [tel, setTel] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  if (!inscrit.charge) return <div className="mt-6 h-72 animate-pulse rounded-2xl bg-card" aria-busy />;

  // Pro inscrit : la demande est enregistrée dans la base, il faut un compte (numéro vérifié).
  if (pro && !estDemo(pro.id) && !compte) {
    if (!pret) return <div className="mt-6 h-72 animate-pulse rounded-2xl bg-card" aria-busy />;
    return (
      <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm">
        <InscriptionClient
          titre={`Connectez-vous pour écrire à ${pro.nom}`}
          intro="Votre demande et le devis seront gardés dans votre compte, et vous serez prévenu par SMS."
        />
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-bold">À qui demander un devis ?</h2>
        <p className="text-sm text-muted-foreground">
          Ouvrez le profil d’un artisan ou choisissez une quincaillerie, puis touchez « Demander un devis ».
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/recherche" className="flex items-center gap-3 rounded-2xl bg-card p-5 font-bold shadow-sm ring-1 ring-black/[0.03]">
            <Search className="size-5 text-primary" /> Trouver un artisan
          </Link>
          <Link href="/quincaillerie#boutiques" className="flex items-center gap-3 rounded-2xl bg-card p-5 font-bold shadow-sm ring-1 ring-black/[0.03]">
            <Store className="size-5 text-primary" /> Choisir une quincaillerie
          </Link>
        </div>
      </div>
    );
  }

  if (envoye) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="size-14 text-success" />
        <h2 className="mt-4 text-xl font-bold">Demande envoyée</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pro.nom} a reçu votre demande et va vous répondre avec un devis détaillé : prix unitaires, quantités et
          total. Vous serez prévenu par SMS ou WhatsApp.
        </p>
        <Link href="/devis" className="mt-6 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground">
          Voir mes devis
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (envoi) return;
        const f = new FormData(e.currentTarget);
        setErreur("");
        setEnvoi(true);
        try {
          await creerDemande({
          pro,
          client: {
            prenom: compte?.prenom ?? prenom.trim(),
            telephone: compte?.telephone ?? tel.trim(),
          },
          texte,
          quartier: String(f.get("quartier") ?? ""),
          dateSouhaitee: String(f.get("date") ?? "") || undefined,
          budget: String(f.get("budget") ?? "").trim() || undefined,
          });
          setEnvoye(true);
        } catch (err) {
          setErreur(erreurSupabase(err));
        } finally {
          setEnvoi(false);
        }
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-secondary p-4 text-primary">
        {pro.type === "boutique" ? <Store className="size-6 shrink-0" /> : null}
        <p className="text-sm">
          Demande de devis à <strong>{pro.nom}</strong>
          <span className="block text-xs">{pro.sous}</span>
        </p>
      </div>

      <div>
        <label className="text-xl font-bold" htmlFor="besoin">
          Décrivez votre besoin, avec vos mots
        </label>
        <p className="mt-1 text-sm text-muted-foreground">
          Comme dans un message : ce qu’il faut faire ou acheter, les quantités si vous les connaissez, le lieu.
          {pro.type === "boutique" ? " La boutique vous renverra les prix unitaires et le total." : " L’artisan vous renverra un devis détaillé."}
        </p>
        <textarea
          id="besoin"
          required
          minLength={10}
          rows={6}
          maxLength={2000}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          className={`${field} mt-3 resize-y`}
          placeholder={EXEMPLES[pro.type][0]}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {EXEMPLES[pro.type].map((ex, i) => (
              <button
                key={ex}
                type="button"
                onClick={() => setTexte(ex)}
                className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-border"
              >
                Exemple {i + 1}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{texte.length} / 2000</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="quartier">
            Quartier / lieu
          </label>
          <div className="relative">
            <select key={compte?.quartier ?? ""} id="quartier" name="quartier" required defaultValue={compte?.quartier ?? ""} className={`${field} appearance-none`}>
              <option value="" disabled>
                Choisissez votre quartier
              </option>
              {quartiers.map((q) => (
                <option key={q}>{q}</option>
              ))}
              <option>Hors Brazzaville</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="date">
            Pour quand ? (facultatif)
          </label>
          <input id="date" name="date" type="date" className={field} />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="budget">
          Budget indicatif (facultatif)
        </label>
        <div className="relative">
          <input id="budget" name="budget" inputMode="numeric" placeholder="Ex. 500 000" className={`${field} pr-20`} />
          <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm font-bold text-muted-foreground">FCFA</span>
        </div>
      </div>

      {compte ? (
        <p className="text-sm text-muted-foreground">
          Réponse envoyée à <strong className="text-foreground">{compte.prenom}</strong> · {compte.telephone}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="prenom">
              Votre prénom
            </label>
            <input id="prenom" required value={prenom} onChange={(e) => setPrenom(e.target.value)} autoComplete="given-name" className={field} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="tel">
              Téléphone / WhatsApp
            </label>
            <input id="tel" type="tel" required value={tel} onChange={(e) => setTel(e.target.value)} placeholder="06 000 00 00" className={field} />
          </div>
        </div>
      )}

      {erreur && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{erreur}</p>}
      <button
        type="submit"
        disabled={envoi}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-bold text-accent-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        <Send className="size-5" /> Envoyer ma demande de devis
      </button>
      <p className="text-center text-xs text-muted-foreground">Gratuit et sans engagement · Aucune commission Artopif.</p>
    </form>
  );
}
