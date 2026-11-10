import type { Metadata } from "next";
import Link from "next/link";
import {
  Crown,
  Eye,
  Film,
  GalleryHorizontal,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  Megaphone,
  PanelsLeftRight,
  Store,
  Users,
} from "lucide-react";
import { BackHeader } from "@/components/ui";
import { DemandeAnnonceur } from "./DemandeAnnonceur";

export const metadata: Metadata = {
  title: "Nos services — Artopif",
  description:
    "Publicité vidéo et image, annonces sponsorisées, mise en avant locale et outils Premium pour les boutiques à Brazzaville.",
};

/** Emplacements publicitaires vendus sur le site. */
const EMPLACEMENTS = [
  [Film, "Vidéo sur l’accueil", "Votre spot de 15 à 30 secondes, lu sans le son, en grand sur la page d’accueil.", "Format 16:9 · MP4"],
  [ImageIcon, "Image sur l’accueil", "Une grande affiche pour votre marque, votre promotion ou votre nouvelle boutique.", "Format 16:9 ou 21:9 · JPG/PNG"],
  [PanelsLeftRight, "Colonne de droite", "Deux encarts à droite du site, visibles sur toutes les pages pendant la lecture ; sur mobile, ils s’insèrent dans la page.", "Image 300 × 250 px · JPG/PNG"],
  [GalleryHorizontal, "Bannière sur tout le site", "Présente sur toutes les pages : recherche, profils, quincaillerie…", "Image ou vidéo · format bandeau"],
  [Megaphone, "Annonces sponsorisées", "Votre fiche en tête des résultats de recherche, toujours signalée « Sponsorisé ».", "Artisans et boutiques"],
  [MapPin, "Mise en avant locale", "Soyez visible en premier dans votre quartier ou pour votre métier.", "Ciblage par quartier"],
] as const;

const PROS = [
  [LayoutDashboard, "Boutique Premium", "Tableau de bord, caisse, stock, fichier clients et promotions pour les quincailleries.", "/pro/boutique"],
  [Store, "Fiche gratuite", "Artisans et commerces créent gratuitement leur fiche et reçoivent des clients.", "/pro/inscription"],
  [Crown, "Artisan Premium", "Soyez mieux référencé : votre fiche remonte dans les résultats de votre métier et de votre quartier.", "/services#contact"],
] as const;

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Nos services" />

      <section className="mt-6 max-w-3xl">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
          Publicité · Artisans, boutiques et marques
        </p>
        <h2 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">
          Faites-vous voir par les clients <em className="text-primary">qui cherchent déjà</em>.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Les particuliers consultent gratuitement les avis et les informations, les artisans et les commerces
          créent gratuitement leur fiche. Artopif se finance en vendant de la visibilité : jamais de faux avis ni
          de badge acheté.
        </p>
        <a
          href="#contact"
          className="mt-6 inline-block rounded-xl bg-accent px-6 py-3.5 font-bold text-accent-foreground"
        >
          Réserver un espace publicitaire
        </a>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Nos espaces publicitaires</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EMPLACEMENTS.map(([Icon, t, d, format]) => (
            <li key={t} className="flex flex-col rounded-2xl bg-card p-5 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <p className="mt-3 font-bold">{t}</p>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{d}</p>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">{format}</p>
              <p className="mt-1 text-xs font-bold tracking-wide text-accent-ink uppercase">Tarif sur demande</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-3xl">Nos autres services</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {PROS.map(([Icon, t, d, href]) => (
            <li key={t}>
              <Link href={href} className="flex h-full gap-3 rounded-2xl bg-card p-5 shadow-sm transition hover:shadow-md">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-bold">{t}</span>
                  <span className="text-sm text-muted-foreground">{d}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-[1fr_minmax(0,26rem)]">
        <div className="space-y-4">
          <h2 className="font-serif text-3xl">Pourquoi Artopif</h2>
          {(
            [
              [Users, "Une audience qualifiée", "Des gens qui ont un besoin concret : réparer, construire, acheter."],
              [Eye, "Une publicité honnête", "Chaque emplacement payé est clairement signalé « Publicité »."],
              [MapPin, "Local avant tout", "Ciblage par quartier de Brazzaville et par métier."],
            ] as const
          ).map(([Icon, t, d]) => (
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
