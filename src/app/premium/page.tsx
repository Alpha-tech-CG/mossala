import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  ClipboardCheck,
  FileSignature,
  IdCard,
  MessageSquareQuote,
  ScrollText,
  Store,
  Users,
} from "lucide-react";
import { BackHeader } from "@/components/ui";
import { PROFILS_GRATUITS_PAR_MOIS } from "@/lib/data";
import { SouscriptionPremium } from "./SouscriptionPremium";

export const metadata: Metadata = {
  title: "Premium — Artico",
  description: "Profils illimités et mise en relation accompagnée avec des artisans sélectionnés.",
};

const ETAPES = [
  ["Décrivez votre besoin", "Sur le site ou par WhatsApp : plomberie, électricité, climatisation, menuiserie…"],
  ["Nous trouvons les artisans", "Artico identifie un ou plusieurs artisans Premium disponibles près de chez vous."],
  ["Recevez les devis", "Vous comparez les propositions et les prix, sans vous déplacer."],
  ["Choisissez votre artisan", "Vous décidez librement, en toute transparence."],
  ["Le travail est réalisé", "L’artisan intervient aux conditions convenues."],
  ["Confirmez et évaluez", "Vous confirmez la fin des travaux et notez la prestation."],
];

const SELECTION = [
  [IdCard, "Identité vérifiée", "Pièce d’identité contrôlée par notre équipe."],
  [BadgeCheck, "Expérience et compétences", "Vérification du savoir-faire et des années de métier."],
  [Camera, "Photos de réalisations", "Des chantiers précédents, contrôlés."],
  [Users, "Références clients", "Des clients joignables qui confirment la qualité du travail."],
  [ScrollText, "Documents professionnels", "Quand l’activité l’exige (électricité, gaz, transport…)."],
  [FileSignature, "Charte qualité signée", "Ponctualité, prix annoncé respecté, chantier propre."],
  [ClipboardCheck, "Évaluation après chaque prestation", "Une note qui baisse trop retire le statut Premium."],
] as const;

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Artico Premium" />

      <section className="mt-6 grid gap-6 md:grid-cols-[1fr_minmax(0,24rem)] md:items-start">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
            Pour les particuliers
          </p>
          <h2 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">
            Les bons professionnels, <em className="text-primary">sans chercher</em>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Artico reste gratuit : la recherche, les avis et {PROFILS_GRATUITS_PAR_MOIS} profils complets par mois.
            Premium vous ouvre tous les profils et un service de mise en relation accompagnée avec des artisans
            sélectionnés.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Gratuit", `Recherche, avis, messages illimités, ${PROFILS_GRATUITS_PAR_MOIS} profils par mois`],
              ["Premium", "Profils illimités, devis et mise en relation accompagnée"],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl bg-card p-4 shadow-sm">
                <p className="font-bold">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
          <SouscriptionPremium />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-serif text-3xl">Comment fonctionne la mise en relation</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ETAPES.map(([t, d], i) => (
            <li key={t} className="rounded-2xl bg-card p-5 shadow-sm">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
                {i + 1}
              </span>
              <p className="mt-3 font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="font-serif text-3xl">Des artisans Premium sélectionnés</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Le statut Premium ne s’achète pas : chaque artisan passe une procédure de sélection avant de recevoir
          des demandes.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SELECTION.map(([Icon, t, d]) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-card p-4 shadow-sm">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>
                <span className="block font-bold">{t}</span>
                <span className="text-sm text-muted-foreground">{d}</span>
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/pro/inscription"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary px-5 py-3 text-sm font-bold text-primary"
        >
          <MessageSquareQuote className="size-4" /> Artisan ? Candidatez au programme Premium
        </Link>
      </section>

      <section className="mt-14 flex flex-col gap-4 rounded-2xl bg-foreground p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.3em] text-accent uppercase">
            <Store className="size-4" /> Boutiques et quincailleries
          </p>
          <p className="mt-2 font-serif text-2xl">Premium boutique : tarif communiqué prochainement</p>
          <p className="mt-1 text-sm text-white/70">
            Votre fiche reste gratuite. Mise en avant, promotions et bannières : parlons-en.
          </p>
        </div>
        <Link
          href="/annonceurs"
          className="shrink-0 rounded-xl bg-accent px-5 py-3 text-center text-sm font-bold text-accent-foreground"
        >
          Être recontacté
        </Link>
      </section>
    </div>
  );
}
