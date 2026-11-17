"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { InscriptionClient } from "./Acces";
import { useCompte } from "@/lib/compte";
import { CRITERES_ARTISAN, CRITERES_MAGASIN } from "@/lib/data";
import { AvisDejaDonne, messageErreur, publierAvis } from "@/lib/backend";
import type { ExperienceAvis, Recommandation } from "@/lib/backend/modele";

/** Ordre des libellés de recommandation ci-dessous. */
const CODES_RECOMMANDATION: Recommandation[] = ["oui", "reserves", "non"];

/** « Grâce » + « Ngoma » → « Grâce N. » (le nom complet n'est jamais publié). */
const nomAuteur = (prenom: string, nom?: string | null) =>
  nom?.trim() ? `${prenom.trim()} ${nom.trim()[0].toUpperCase()}.` : prenom.trim();

/**
 * Formulaire d'avis, commun aux artisans et aux magasins : les critères notés et les
 * libellés diffèrent (ce sont les mêmes que ceux affichés sur l'accueil, cf. data.ts).
 */
const TEXTES = {
  artisan: {
    criteres: CRITERES_ARTISAN,
    aide: {
      "Qualité du travail": "Résultat final, finitions et conformité à la demande.",
      "Respect des délais": "Ponctualité et respect des délais convenus.",
      Professionnalisme: "Communication, politesse, conseils et propreté du chantier.",
      "Rapport qualité-prix": "Respect du prix annoncé et valeur du travail au regard du prix payé.",
      "Satisfaction générale": "Votre impression d’ensemble sur la prestation.",
    } as Record<string, string>,
    recommandations: ["Je recommande ce professionnel", "Je le recommande avec des réserves", "Je ne le recommande pas"],
    experiences: [
      ["prestation", "J’ai réellement bénéficié de la prestation"],
      ["devis", "J’ai uniquement demandé un devis"],
      ["contact", "J’ai uniquement pris contact"],
    ],
    verifiee: "Seuls les avis sur une prestation réalisée sont affichés comme « Prestation confirmée ».",
    date: "Date de la prestation",
    unite: "prestation",
  },
  magasin: {
    criteres: CRITERES_MAGASIN,
    aide: {
      "Qualité des produits": "Produits conformes, en bon état et de bonne qualité.",
      "Prix pratiqués": "Prix corrects et conformes à ceux affichés.",
      "Disponibilité des produits": "Les produits recherchés étaient en stock.",
      "Accueil et service client": "Amabilité, conseils et rapidité du service.",
      "Satisfaction générale": "Votre impression d’ensemble sur cet achat.",
    } as Record<string, string>,
    recommandations: ["Je recommande ce magasin", "Je le recommande avec des réserves", "Je ne le recommande pas"],
    experiences: [
      ["achat", "J’ai réellement acheté dans ce magasin"],
      ["devis", "J’ai uniquement demandé un devis ou un prix"],
      ["contact", "J’ai uniquement pris contact"],
    ],
    verifiee: "Seuls les avis sur un achat effectué sont affichés comme « Achat confirmé ».",
    date: "Date de l’achat",
    unite: "achat",
  },
} as const;

/** Note globale sur 5 : moyenne des critères notés. */
function noteGlobale(criteres: readonly string[], notes: Record<string, number>) {
  const n = criteres.map((c) => notes[c]).filter(Boolean);
  return n.length ? n.reduce((x, y) => x + y, 0) / n.length : null;
}

function Etoiles({ valeur, onChange, label }: { valeur: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valeur === n}
          aria-label={`${n} sur 5`}
          onClick={() => onChange(valeur === n ? 0 : n)}
          className="p-1"
        >
          <Star className={`size-6 ${n <= valeur ? "fill-star text-star" : "text-border"}`} />
        </button>
      ))}
    </div>
  );
}

export function Evaluation({
  type = "artisan",
  cibleId,
  nom,
  sousTitre,
  retour,
}: {
  type?: keyof typeof TEXTES;
  /** identifiant de l'artisan ou du magasin évalué */
  cibleId: string;
  nom: string;
  /** ex. « Plombier · Bacongo » ou « Quincaillerie · Bacongo » */
  sousTitre: string;
  /** page à laquelle revenir après l'envoi */
  retour: string;
}) {
  const t = TEXTES[type];
  const c = useCompte();
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [recommandation, setRecommandation] = useState("");
  const [experience, setExperience] = useState("");
  const [date, setDate] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const qui = type === "artisan" ? nom.split(" ")[0] : nom;

  if (!c.pret) return <div className="mt-6 h-96 animate-pulse rounded-2xl bg-card" />;
  if (!c.inscrit)
    return (
      <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="font-serif text-2xl">Inscrivez-vous pour donner votre avis</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Un compte garantit un seul avis par {t.unite}.
        </p>
        <InscriptionClient />
      </div>
    );

  if (envoye)
    return (
      <div className="mt-6 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="size-14 text-success" />
        <h2 className="mt-4 font-serif text-2xl">Merci pour votre avis</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Il sera publié après une vérification par notre équipe. {qui} pourra y répondre publiquement.
        </p>
        <Link
          href={retour}
          className="mt-6 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground"
        >
          {type === "artisan" ? "Retour au profil" : "Retour au magasin"}
        </Link>
      </div>
    );

  const globale = noteGlobale(t.criteres, notes);
  const nbNotes = Object.values(notes).filter(Boolean).length;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!globale || !c.compte) return;
        setErreur("");
        setEnvoi(true);
        try {
          await publierAvis({
            cibleType: type,
            cibleId,
            cibleNom: nom,
            auteur: nomAuteur(c.compte.prenom, c.compte.nom),
            notes: Object.fromEntries(Object.entries(notes).filter(([, n]) => n > 0)),
            note: Math.round(globale * 10) / 10,
            recommandation: CODES_RECOMMANDATION[t.recommandations.indexOf(recommandation as never)] ?? "oui",
            experience: experience as ExperienceAvis,
            date: date || null,
            texte: commentaire.trim(),
          });
          setEnvoye(true);
        } catch (err) {
          setErreur(err instanceof AvisDejaDonne ? err.message : messageErreur(err));
        } finally {
          setEnvoi(false);
        }
      }}
      className="mt-6 space-y-5"
    >
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
          {sousTitre}
        </p>
        <p className="mt-1 font-serif text-2xl">{nom}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre avis aide les autres à faire le bon choix. Notez de 1 à 5 étoiles les critères qui vous concernent.
        </p>
        <label className="mt-4 block text-sm font-semibold">
          {t.date}
          <input
            type="month"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-base"
          />
        </label>
      </div>

      <fieldset className="rounded-2xl bg-card p-5 shadow-sm">
        <legend className="sr-only">Vos notes</legend>
        <p className="font-bold">Vos notes</p>
        <div className="mt-2 divide-y divide-border">
          {t.criteres.map((critere) => (
            <div key={critere} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-sm font-semibold">{critere}</p>
                <p className="text-xs text-muted-foreground">{t.aide[critere]}</p>
              </div>
              <Etoiles
                label={critere}
                valeur={notes[critere] ?? 0}
                onChange={(n) => setNotes((x) => ({ ...x, [critere]: n }))}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl bg-foreground px-5 py-4 text-white shadow-lg">
        <span className="text-sm text-white/75">Note globale · {nbNotes} / {t.criteres.length} critères</span>
        <span className="flex items-center gap-1.5 font-serif text-2xl">
          <Star className="size-5 fill-star text-star" />
          {globale ? globale.toFixed(1).replace(".", ",") : "–"}
          <span className="text-sm text-white/60">/ 5</span>
        </span>
      </div>

      <fieldset className="rounded-2xl bg-card p-5 shadow-sm">
        <legend className="sr-only">Votre recommandation</legend>
        <p className="font-bold">Votre recommandation</p>
        <div className="mt-3 space-y-2">
          {t.recommandations.map((r) => (
            <label key={r} className="flex items-center gap-3 text-sm">
              <input
                type="radio"
                name="recommandation"
                required
                checked={recommandation === r}
                onChange={() => setRecommandation(r)}
              />
              {r}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl bg-card p-5 shadow-sm">
        <legend className="sr-only">Votre expérience</legend>
        <p className="font-bold">Votre expérience</p>
        <div className="mt-3 space-y-2">
          {t.experiences.map(([v, l]) => (
            <label key={v} className="flex items-center gap-3 text-sm">
              <input
                type="radio"
                name="experience"
                required
                checked={experience === v}
                onChange={() => setExperience(v)}
              />
              {l}
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t.verifiee}
        </p>
      </fieldset>

      <label className="block rounded-2xl bg-card p-5 shadow-sm">
        <span className="font-bold">Commentaire</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          Ce que vous avez apprécié, les points à améliorer, tout élément utile.
        </span>
        <textarea
          rows={4}
          maxLength={1000}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className="mt-3 w-full resize-none rounded-xl border border-border bg-white px-4 py-3 text-base"
        />
      </label>

      {erreur && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={nbNotes === 0 || envoi}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground disabled:opacity-50"
      >
        {envoi && <Loader2 className="size-4 animate-spin" />}
        Publier mon avis
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Un seul avis par {t.unite}. Les avis sont modérés, et un avis négatif n’est jamais retiré à la demande du{" "}
        {type === "artisan" ? "professionnel" : "magasin"}.
      </p>
    </form>
  );
}
