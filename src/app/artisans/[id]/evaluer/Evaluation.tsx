"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { InscriptionClient } from "@/components/Acces";
import { useCompte } from "@/lib/compte";

/** Grille officielle d'évaluation des professionnels : 14 critères, 6 dimensions pondérées. */
const DIMENSIONS = [
  {
    nom: "Qualité et compétence technique",
    poids: 25,
    criteres: [
      ["Qualité du travail", "Résultat final, finitions et conformité à la demande."],
      ["Compétence technique", "Maîtrise du métier et capacité à résoudre le problème."],
      ["Qualité des matériaux et équipements", "Adéquation et qualité des matériaux ou pièces utilisés."],
    ],
  },
  {
    nom: "Fiabilité et ponctualité",
    poids: 20,
    criteres: [
      ["Respect des délais et ponctualité", "Arrivée à l’heure et respect des délais convenus."],
      ["Disponibilité et réactivité", "Facilité à joindre le professionnel et rapidité de réponse."],
      ["Respect des engagements", "Respect des accords et du travail convenu."],
    ],
  },
  {
    nom: "Prix et transparence",
    poids: 20,
    criteres: [
      ["Respect du prix annoncé", "Respect du devis et justification des éventuels suppléments."],
      ["Transparence des tarifs", "Clarté du devis, des coûts et des conditions de paiement."],
    ],
  },
  {
    nom: "Communication et comportement",
    poids: 15,
    criteres: [
      ["Communication et comportement", "Politesse, écoute, respect et qualité des échanges."],
      ["Conseil et accompagnement", "Pertinence des conseils et explications donnés au client."],
    ],
  },
  {
    nom: "Organisation et propreté",
    poids: 10,
    criteres: [["Propreté et organisation", "Protection des lieux, rangement et nettoyage après intervention."]],
  },
  {
    nom: "Durabilité et service après-vente",
    poids: 10,
    criteres: [
      ["Durabilité du travail", "Fiabilité du résultat et tenue dans le temps."],
      ["Service après-vente", "Réactivité et prise en charge en cas de problème après intervention."],
    ],
  },
] as const;

/** Affiché à part pour ne pas compter deux fois le prix. */
const QUALITE_PRIX = "Rapport qualité-prix";

const RECOMMANDATIONS = [
  "Je recommande ce professionnel",
  "Je le recommande avec des réserves",
  "Je ne le recommande pas",
];
const EXPERIENCES = [
  ["prestation", "J’ai réellement bénéficié de la prestation"],
  ["devis", "J’ai uniquement demandé un devis"],
  ["contact", "J’ai uniquement pris contact"],
] as const;

/**
 * Note globale sur 5 : moyenne des critères notés dans chaque dimension, puis moyenne pondérée
 * des dimensions renseignées (les poids sont ramenés à 100 % si une dimension est vide).
 */
function noteGlobale(notes: Record<string, number>) {
  let somme = 0;
  let poids = 0;
  for (const d of DIMENSIONS) {
    const n = d.criteres.map(([c]) => notes[c]).filter(Boolean);
    if (!n.length) continue;
    somme += (n.reduce((x, y) => x + y, 0) / n.length) * d.poids;
    poids += d.poids;
  }
  return poids ? somme / poids : null;
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
  id,
  nom,
  metier,
  quartier,
}: {
  id: string;
  nom: string;
  metier: string;
  quartier: string;
}) {
  const c = useCompte();
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [recommandation, setRecommandation] = useState("");
  const [experience, setExperience] = useState("");
  const [date, setDate] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const prenom = nom.split(" ")[0];

  if (!c.pret) return <div className="mt-6 h-96 animate-pulse rounded-2xl bg-card" />;
  if (!c.inscrit)
    return (
      <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="font-serif text-2xl">Inscrivez-vous pour donner votre avis</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Un compte garantit un seul avis par prestation.
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
          Il sera publié après une vérification rapide par notre équipe. {prenom} pourra y répondre publiquement.
        </p>
        <Link
          href={`/artisans/${id}`}
          className="mt-6 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground"
        >
          Retour au profil
        </Link>
      </div>
    );

  const globale = noteGlobale(notes);
  const nbNotes = Object.values(notes).filter(Boolean).length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO backend : insérer l'avis (1 par prestation et par client), statut « à modérer »
        setEnvoye(true);
      }}
      className="mt-6 space-y-5"
    >
      <div className="rounded-2xl bg-card p-5 shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
          {metier} · {quartier}
        </p>
        <p className="mt-1 font-serif text-2xl">{nom}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre avis aide les autres à faire le bon choix. Notez de 1 à 5 étoiles les critères qui vous concernent.
        </p>
        <label className="mt-4 block text-sm font-semibold">
          Date de la prestation
          <input
            type="month"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-base"
          />
        </label>
      </div>

      {DIMENSIONS.map((d) => (
        <fieldset key={d.nom} className="rounded-2xl bg-card p-5 shadow-sm">
          <legend className="sr-only">{d.nom}</legend>
          <p className="flex items-baseline justify-between gap-3 font-bold">
            {d.nom} <span className="text-xs font-semibold text-muted-foreground">{d.poids} %</span>
          </p>
          <div className="mt-2 divide-y divide-border">
            {d.criteres.map(([critere, aide]) => (
              <div key={critere} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="text-sm font-semibold">{critere}</p>
                  <p className="text-xs text-muted-foreground">{aide}</p>
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
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-5 shadow-sm">
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-sm font-semibold">{QUALITE_PRIX}</p>
          <p className="text-xs text-muted-foreground">
            Valeur globale de la prestation au regard du prix payé (affiché à part).
          </p>
        </div>
        <Etoiles
          label={QUALITE_PRIX}
          valeur={notes[QUALITE_PRIX] ?? 0}
          onChange={(n) => setNotes((x) => ({ ...x, [QUALITE_PRIX]: n }))}
        />
      </div>

      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl bg-foreground px-5 py-4 text-white shadow-lg">
        <span className="text-sm text-white/75">Note globale · {nbNotes} / 14 critères</span>
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
          {RECOMMANDATIONS.map((r) => (
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
          {EXPERIENCES.map(([v, l]) => (
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
          Seuls les avis sur une prestation réalisée sont affichés comme « Prestation confirmée ».
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

      <button
        type="submit"
        disabled={nbNotes === 0}
        className="w-full rounded-xl bg-accent py-4 font-bold text-accent-foreground disabled:opacity-50"
      >
        Publier mon avis
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Un seul avis par prestation. Les avis sont modérés, et un avis négatif n’est jamais retiré à la demande du
        professionnel.
      </p>
    </form>
  );
}
