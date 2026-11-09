import type { Metadata } from "next";
import { Eye, GalleryHorizontal, MapPin, Megaphone, Store, Users } from "lucide-react";
import { BackHeader } from "@/components/ui";
import { DemandeAnnonceur } from "./DemandeAnnonceur";

export const metadata: Metadata = {
  title: "Annoncer sur Artico",
  description: "Bannières, annonces sponsorisées et mise en avant locale à Brazzaville.",
};

const OFFRES = [
  [GalleryHorizontal, "Bannières", "Votre marque sur l’accueil et dans les pages de recherche, au format mobile."],
  [Megaphone, "Annonces sponsorisées", "Votre fiche en tête des résultats, toujours signalée « Sponsorisé »."],
  [MapPin, "Mise en avant locale", "Soyez visible en premier dans votre quartier ou votre métier."],
] as const;

export default function AnnonceursPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Annonceurs" />

      <section className="mt-6 max-w-3xl">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
          Artisans, boutiques et marques
        </p>
        <h2 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">
          Faites-vous voir par les clients <em className="text-primary">qui cherchent déjà</em>.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Les particuliers consultent gratuitement les avis et les informations, les artisans et les commerces
          créent gratuitement leur fiche. Artico se finance en vendant de la visibilité : jamais de faux avis ni
          de badge acheté.
        </p>
      </section>

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {OFFRES.map(([Icon, t, d]) => (
          <li key={t} className="rounded-2xl bg-card p-5 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
              <Icon className="size-5" />
            </span>
            <p className="mt-3 font-bold">{t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            <p className="mt-3 text-xs font-bold tracking-wide text-accent-ink uppercase">Tarif sur demande</p>
          </li>
        ))}
      </ul>

      <section className="mt-12 grid gap-6 md:grid-cols-[1fr_minmax(0,26rem)]">
        <div className="space-y-4">
          <h2 className="font-serif text-3xl">Pourquoi Artico</h2>
          {([
            [Users, "Une audience qualifiée", "Des gens qui ont un besoin concret : réparer, construire, acheter."],
            [Eye, "Une publicité honnête", "Chaque emplacement payé est clairement signalé aux visiteurs."],
            [Store, "Local avant tout", "Ciblage par quartier de Brazzaville et par métier."],
          ] as const).map(([Icon, t, d]) => (
            <p key={t} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>
                <span className="block font-bold">{t}</span>
                <span className="text-sm text-muted-foreground">{d}</span>
              </span>
            </p>
          ))}
        </div>
        <div id="contact" className="scroll-mt-24 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
          <DemandeAnnonceur />
        </div>
      </section>
    </div>
  );
}
