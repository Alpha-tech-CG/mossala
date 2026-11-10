"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Film, Image as ImageIcon, Play } from "lucide-react";

/**
 * Espaces publicitaires (image ou vidéo) vendus aux annonceurs.
 * MAQUETTE : les créations sont déclarées ici ; avec Supabase elles viendront d'une table
 * « publicites » (emplacement, fichier dans le Storage, lien, dates de diffusion).
 */
export type Emplacement = "accueil-1" | "accueil-2" | "pages" | "laterale-gauche" | "laterale-droite";

type Pub = {
  type: "image" | "video";
  /** image, ou fichier vidéo MP4 */
  src: string;
  /** image affichée avant la lecture de la vidéo */
  poster?: string;
  annonceur: string;
  titre: string;
  texte?: string;
  cta: string;
  href: string;
};

const PUBS: Partial<Record<Emplacement, Pub>> = {
  "accueil-1": {
    type: "image",
    src: "/images/peinture.jpg",
    annonceur: "Bâtiplus Poto-Poto",
    titre: "Repeignez tout pour la fin d’année",
    texte: "Peinture acrylique 20 L, conseils et livraison sur chantier.",
    cta: "Voir l’offre",
    href: "/quincaillerie/peinture-blanche-20l",
  },
  pages: {
    type: "image",
    src: "/images/ciment.jpg",
    annonceur: "Quincaillerie Total Bacongo",
    titre: "Ciment 42,5 kg à 7 900 FCFA",
    texte: "Prix promo jusqu’au 30 novembre, réservez en ligne.",
    cta: "Réserver",
    href: "/quincaillerie/ciment-42-5",
  },
  "laterale-gauche": {
    type: "image",
    src: "/images/patrick.jpg",
    annonceur: "Quincaillerie Total Bacongo",
    titre: "Câble électrique 2,5 mm²",
    texte: "Rouleau de 100 m, conseils de pose offerts.",
    cta: "Voir le prix",
    href: "/quincaillerie/cable-2-5",
  },
  "laterale-droite": {
    type: "image",
    src: "/images/marcel.jpg",
    annonceur: "Menuiserie Ngouaka",
    titre: "Portes et meubles sur mesure",
    texte: "Devis gratuit partout à Brazzaville.",
    cta: "Voir le profil",
    href: "/artisans/marcel-ngouaka",
  },
  // « accueil-2 » est libre : l'emplacement vidéo invite les annonceurs.
};

/**
 * Barre latérale publicitaire (format portrait).
 * - « rail » : colonne collante à gauche ou à droite du contenu, sur grand écran ;
 * - « carte » : la même publicité réinsérée dans le fil de la page (mobile et tablette).
 * Le contenu du site garde toujours la place principale : la pub ne recouvre jamais rien.
 */
export function PubLaterale({
  emplacement,
  variante,
  className = "",
}: {
  emplacement: "laterale-gauche" | "laterale-droite";
  variante: "rail" | "carte";
  className?: string;
}) {
  const pub = PUBS[emplacement];
  const rail = variante === "rail";

  return (
    <aside aria-label="Publicité" className={className}>
      <p className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Publicité</p>
      {pub ? (
        <Link
          href={pub.href}
          className={`group flex flex-1 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.04] transition hover:shadow-md ${
            rail ? "flex-col" : "flex-col sm:flex-row"
          }`}
        >
          <span
            className={`relative block shrink-0 overflow-hidden bg-foreground ${
              rail ? "aspect-[3/4] 2xl:aspect-[3/5]" : "aspect-[4/3] sm:aspect-auto sm:w-2/5"
            }`}
          >
            {pub.type === "video" ? (
              <video src={pub.src} poster={pub.poster} autoPlay muted loop playsInline className="absolute inset-0 size-full object-cover" />
            ) : (
              <Image
                src={pub.src}
                alt=""
                fill
                sizes={rail ? "180px" : "(min-width: 640px) 25vw, 50vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
          </span>
          <span className={`flex flex-1 flex-col ${rail ? "gap-1.5 p-3.5" : "gap-1 p-3 sm:justify-center sm:gap-1.5 sm:p-5"}`}>
            <span className="text-[9px] font-semibold tracking-[0.2em] text-accent-ink uppercase sm:text-[10px]">
              {pub.annonceur}
            </span>
            <span className={`font-serif leading-tight ${rail ? "text-lg" : "text-base sm:text-xl"}`}>{pub.titre}</span>
            {pub.texte && (
              <span className={`text-muted-foreground ${rail ? "text-xs" : "hidden text-sm sm:block"}`}>{pub.texte}</span>
            )}
            <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground sm:mt-2">
              {pub.cta} <ArrowRight className="size-3" />
            </span>
          </span>
        </Link>
      ) : (
        <Link
          href="/services#contact"
          className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent-ink/30 bg-cream/60 p-4 text-center transition hover:border-accent-ink/60 ${
            rail ? "aspect-[3/5]" : "aspect-[4/3] sm:aspect-auto sm:min-h-40"
          }`}
        >
          <ImageIcon className="size-6 text-accent-ink" />
          <span className="font-serif text-lg leading-tight">Votre publicité ici</span>
          <span className="text-xs text-muted-foreground">Espace disponible</span>
        </Link>
      )}
    </aside>
  );
}

/** Les deux barres latérales, réinsérées côte à côte dans le fil de la page sous 1280 px. */
export function PubsLateralesFil({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 xl:hidden ${className}`}>
      <PubLaterale emplacement="laterale-gauche" variante="carte" className="flex flex-col" />
      <PubLaterale emplacement="laterale-droite" variante="carte" className="flex flex-col" />
    </div>
  );
}

export function EspacePub({ emplacement, className = "" }: { emplacement: Emplacement; className?: string }) {
  const pub = PUBS[emplacement];
  const bandeau = emplacement === "pages";
  const libre = emplacement === "accueil-2" ? "video" : "image";

  return (
    <aside aria-label="Publicité" className={className}>
      <p className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Publicité</p>
      {pub ? (
        <Link
          href={pub.href}
          className={`group relative block overflow-hidden rounded-2xl bg-foreground shadow-sm ${
            bandeau ? "aspect-[3/1] sm:aspect-[6/1]" : "aspect-[16/10] sm:aspect-[21/9]"
          }`}
        >
          {pub.type === "video" ? (
            <video
              src={pub.src}
              poster={pub.poster}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <Image
              src={pub.src}
              alt=""
              fill
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/45 to-transparent" />
          <div
            className={`absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center text-white ${
              bandeau ? "gap-0.5 px-4 sm:px-6" : "gap-2 px-5 sm:px-10"
            }`}
          >
            <p className="text-[10px] font-semibold tracking-[0.25em] text-accent uppercase">{pub.annonceur}</p>
            <p className={`font-serif leading-tight ${bandeau ? "text-lg sm:text-2xl" : "text-2xl sm:text-4xl"}`}>
              {pub.titre}
            </p>
            {pub.texte && (
              <p className={`text-white/80 ${bandeau ? "hidden text-sm md:block" : "text-sm sm:text-base"}`}>{pub.texte}</p>
            )}
            <span
              className={`mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent font-bold text-accent-foreground ${
                bandeau ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"
              }`}
            >
              {pub.cta} <ArrowRight className="size-3.5" />
            </span>
          </div>
        </Link>
      ) : (
        <Link
          href="/services#contact"
          className={`group flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-accent-ink/30 bg-cream/60 text-center transition hover:border-accent-ink/60 ${
            bandeau ? "aspect-[3/1] sm:aspect-[6/1]" : "aspect-[16/10] sm:aspect-[21/9]"
          }`}
        >
          <span className="flex flex-col items-center gap-2 px-5">
            <span className="flex size-14 items-center justify-center rounded-full bg-foreground text-accent shadow-md transition group-hover:scale-110">
              {libre === "video" ? <Play className="size-6 fill-current" /> : <ImageIcon className="size-6" />}
            </span>
            <span className="font-serif text-xl sm:text-2xl">
              {libre === "video" ? "Votre vidéo publicitaire ici" : "Votre publicité ici"}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Film className="size-4" /> Espace disponible · réservez-le
            </span>
          </span>
        </Link>
      )}
    </aside>
  );
}

/** Bannière présente sur toutes les pages sauf l'accueil (qui a ses deux grands blocs). */
export function PubPages() {
  const path = usePathname();
  if (path === "/") return null;
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pt-4 pb-10">
      <EspacePub emplacement="pages" />
    </div>
  );
}
