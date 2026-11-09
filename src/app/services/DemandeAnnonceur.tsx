"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

const TYPES = ["Artisan", "Boutique / quincaillerie", "Marque ou entreprise"];
const INTERETS = ["Vidéo sur l’accueil", "Image sur l’accueil", "Bannière sur tout le site", "Annonces sponsorisées", "Mise en avant locale", "Premium boutique"];

export function DemandeAnnonceur() {
  const [envoye, setEnvoye] = useState(false);
  const [interets, setInterets] = useState<string[]>([]);

  if (envoye)
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <p className="mt-3 font-serif text-2xl">Demande reçue</p>
        <p className="mt-1 text-sm text-muted-foreground">Notre équipe vous rappelle avec nos tarifs.</p>
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // TODO backend : enregistrer la demande (table demandes_annonceurs) et prévenir l'équipe commerciale
        setEnvoye(true);
      }}
      className="space-y-3"
    >
      <p className="font-serif text-2xl">Être recontacté</p>
      <input required placeholder="Nom de l’entreprise ou votre nom" aria-label="Nom" className={field} />
      <select required aria-label="Vous êtes" defaultValue="" className={field}>
        <option value="" disabled>
          Vous êtes…
        </option>
        {TYPES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <input required type="tel" placeholder="Téléphone ou WhatsApp" aria-label="Téléphone" className={field} />
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Ce qui vous intéresse</legend>
        <div className="flex flex-wrap gap-2">
          {INTERETS.map((i) => {
            const actif = interets.includes(i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={actif}
                onClick={() => setInterets((x) => (actif ? x.filter((y) => y !== i) : [...x, i]))}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                  actif ? "border-primary bg-secondary text-primary" : "border-border bg-white"
                }`}
              >
                {i}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button type="submit" className="w-full rounded-xl bg-accent py-4 font-bold text-accent-foreground">
        Envoyer ma demande
      </button>
      <p className="text-[11px] text-muted-foreground">
        Vos coordonnées servent uniquement à vous recontacter.{" "}
        <Link href="/confidentialite" className="underline">
          En savoir plus
        </Link>
      </p>
    </form>
  );
}
