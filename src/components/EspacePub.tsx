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
 * Bloc publicitaire de la colonne de droite, au format des encarts LinkedIn :
 * carte de 300 px de large, visuel 300 × 250 (IAB « medium rectangle »), texte court dessous.
 */
export function BlocPub({
  emplacement,
  className = "",
}: {
  emplacement: "laterale-gauche" | "laterale-droite";
  className?: string;
}) {
  const pub = PUBS[emplacement];
  return (
    <aside
      aria-label="Publicité"
      className={`overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-black/[0.06] ${className}`}
    >
      <p className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
        Publicité
        <Link href="/services" className="font-semibold tracking-normal normal-case hover:underline">
          Annoncer ici
        </Link>
      </p>
      {pub ? (
        <Link href={pub.href} className="group block">
          <span className="relative block aspect-[6/5] overflow-hidden bg-foreground">
            {pub.type === "video" ? (
              <video src={pub.src} poster={pub.poster} autoPlay muted loop playsInline className="absolute inset-0 size-full object-cover" />
            ) : (
              <Image
                src={pub.src}
                alt=""
                fill
                sizes="(min-width: 1280px) 300px, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
          </span>
          <span className="flex items-center justify-between gap-2 px-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-[9px] font-semibold tracking-[0.15em] text-accent-ink uppercase sm:text-[10px]">
                {pub.annonceur}
              </span>
              <span className="mt-0.5 line-clamp-2 font-serif text-sm leading-tight sm:text-base xl:line-clamp-1">{pub.titre}</span>
            </span>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground sm:inline-flex">
              {pub.cta} <ArrowRight className="size-3" />
            </span>
          </span>
        </Link>
      ) : (
        <Link
          href="/services#contact"
          className="mx-3 mb-3 flex aspect-[6/5] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-accent-ink/30 bg-cream/60 text-center"
        >
          <ImageIcon className="size-6 text-accent-ink" />
          <span className="font-serif text-lg leading-tight">Votre publicité ici</span>
          <span className="text-xs text-muted-foreground">300 × 250 px</span>
        </Link>
      )}
    </aside>
  );
}

/** Sous 1280 px, les deux blocs de la colonne de droite sont réinsérés côte à côte dans la page. */
export function PubsLateralesFil({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 xl:hidden ${className}`}>
      <BlocPub emplacement="laterale-gauche" />
      <BlocPub emplacement="laterale-droite" />
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
      {/* Mobile et tablette : les deux barres latérales sont réinsérées ici, sur toutes les pages */}
      <PubsLateralesFil className="mb-6" />
      <EspacePub emplacement="pages" />
    </div>
  );
}

/**
 * Grand écran (≥ 1280 px) : colonne de droite de 300 px avec deux blocs publicitaires empilés,
 * comme la colonne de droite de LinkedIn. Elle reste visible pendant le défilement.
 * Sur l'accueil, le cadre commence après le hero (voir app/page.tsx) ; ailleurs, sous le header.
 */
export function CadrePub({ children, accueil = false }: { children: React.ReactNode; accueil?: boolean }) {
  const path = usePathname();
  if (path === "/" && !accueil) return <>{children}</>;
  return (
    <div className="xl:mx-auto xl:grid xl:max-w-[1500px] xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6 xl:pr-6">
      <div className="min-w-0">{children}</div>
      <div className="hidden xl:block">
        <div className="sticky top-[72px] space-y-2.5 pt-3">
          <BlocPub emplacement="laterale-gauche" />
          <BlocPub emplacement="laterale-droite" />
        </div>
      </div>
    </div>
  );
}
