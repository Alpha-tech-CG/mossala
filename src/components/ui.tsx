import { createElement } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  Car,
  CookingPot,
  Flame,
  HardHat,
  Palette,
  Scissors,
  Sparkles,
  Sprout,
  Cable,
  Droplets,
  PaintBucket,
  Package,
  ArrowLeft,
  ChevronRight,
  Clock,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import {
  type Artisan,
  type CategorieId,
  type MetierId,
  type Produit,
  fcfa,
  getBoutique,
  getMetier,
  initiales,
  metierLabel,
  note,
} from "@/lib/data";
import { ContactButton, type ContactArtisan } from "./Contact";
import { iconeDuMetier } from "@/lib/metierIcons";

/**
 * Données envoyées au navigateur pour la fenêtre « Contactez ».
 * Un numéro privé n'est JAMAIS transmis : le contact passe par la messagerie.
 */
export function toContact(a: Artisan): ContactArtisan {
  return {
    id: a.id,
    nom: a.nom,
    metier: metierLabel(a.metier).artisan,
    image: a.image,
    telephone: a.numeroPublic ? a.telephone : "",
    numeroPublic: a.numeroPublic,
  };
}

/** Indique comment joindre l'artisan : appel direct ou messagerie. */
export function ModeContact({ a }: { a: Artisan }) {
  return a.numeroPublic ? (
    <span className="flex items-center gap-1 font-semibold text-success">
      <Phone className="size-3.5" /> Appel direct
    </span>
  ) : (
    <span className="flex items-center gap-1 font-semibold">
      <Lock className="size-3.5" /> Par message
    </span>
  );
}

export const categorieIcons: Record<CategorieId, typeof Wrench> = {
  batiment: HardHat,
  mecanique: Car,
  bois: Armchair,
  metallurgie: Flame,
  textile: Scissors,
  alimentaire: CookingPot,
  electricite: Zap,
  beaute: Sparkles,
  art: Palette,
  agriculture: Sprout,
  services: Wrench,
};

/** Affiche l'icône d'une catégorie. */
export function CategorieIcon({ id, className }: { id: CategorieId; className?: string }) {
  return createElement(categorieIcons[id], { className, "aria-hidden": true });
}

/** Affiche l'icône de la catégorie d'un métier. */
export function MetierIcon({ id, className }: { id: MetierId; className?: string }) {
  return createElement(metierIcon(id), { className, "aria-hidden": true });
}

/** Icône propre au métier, sinon celle de sa catégorie principale. */
export const metierIcon = (metierId: MetierId) => {
  const m = getMetier(metierId);
  if (!m) return Wrench;
  return iconeDuMetier(m.label) ?? categorieIcons[m.categories[0]];
};

const produitIcons: Record<string, typeof Wrench> = {
  Ciment: Package,
  Peinture: PaintBucket,
  Électricité: Cable,
  Plomberie: Droplets,
};

/** Pastille de disponibilité (critère de recherche du cahier des charges). */
export function DispoChip({ a }: { a: Artisan }) {
  const map = {
    aujourdhui: ["Dispo aujourd’hui", "bg-success"],
    semaine: ["Dispo cette semaine", "bg-star"],
    "plus-tard": ["Sur rendez-vous", "bg-muted-foreground"],
  } as const;
  const [label, dot] = map[a.disponible];
  return (
    <span className="flex w-fit items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-foreground/80">
      <span className={`size-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="flex w-fit items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-primary">
      <ShieldCheck className="size-3.5" />
      Vérifié
    </span>
  );
}

export function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1 font-bold">
      <Star className="size-4 fill-star text-star" />
      {note(value)}/5
    </span>
  );
}

export function Avatar({ a, className }: { a: Artisan; className: string }) {
  return a.image ? (
    <Image src={a.image} alt={a.nom} width={400} height={400} className={`${className} object-cover`} />
  ) : (
    <AvatarFallback a={a} className={className} />
  );
}

function AvatarFallback({ a, className }: { a: Artisan; className: string }) {
  return (
    <div
      className={`${className} relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-[#2f64a8] font-serif text-3xl text-white`}
    >
      <MetierIcon id={a.metier} className="absolute -right-3 -bottom-3 size-20 opacity-15" />
      {initiales(a.nom)}
    </div>
  );
}

/** Titre de section : sur-titre espacé façon hero + titre de l’app. */
export function SectionTitle({
  title,
  eyebrow,
  href,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase md:text-[11px]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-primary"
        >
          Voir tout
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function BackHeader({ title, href = "/" }: { title: string; href?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={href}
        aria-label="Retour"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-sm"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}

/** Carte verticale (carrousel « Artisans près de vous »). */
export function ArtisanCardVertical({ a }: { a: Artisan }) {
  const m = metierLabel(a.metier);
  return (
    <article className="group flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-1 hover:shadow-lg md:w-auto">
      <Link href={`/artisans/${a.id}`} className="relative block overflow-hidden">
        <Avatar
          a={a}
          className="h-40 w-full transition-transform duration-500 group-hover:scale-105 md:h-48"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/artisans/${a.id}`} className="truncate font-bold hover:underline">
          {a.nom}
        </Link>
        <p className="text-sm text-muted-foreground">
          {m.artisan} · {a.quartier}
        </p>
        <div className="mt-2 text-sm">
          <Rating value={a.note} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <VerifiedBadge />
          <DispoChip a={a} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {a.reponse}
          </span>
          <ModeContact a={a} />
        </div>
        <ContactButton
          artisan={toContact(a)}
          className="mt-4 w-full rounded-xl bg-accent py-3 text-center text-sm font-bold text-accent-foreground transition hover:brightness-95 active:scale-[0.98]"
        />
      </div>
    </article>
  );
}

/** Carte horizontale (page de recherche, conforme à la maquette). */
export function ArtisanCardRow({ a }: { a: Artisan }) {
  const m = metierLabel(a.metier);
  return (
    <article className="relative flex gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md min-[360px]:gap-4 min-[360px]:p-4">
      {a.sponsorise && (
        <span className="absolute top-3 right-3 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
          Sponsorisé
        </span>
      )}
      <Link href={`/artisans/${a.id}`} className="shrink-0">
        <Avatar a={a} className="size-20 rounded-xl min-[360px]:size-24" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/artisans/${a.id}`} className="truncate text-base font-bold hover:underline">
          {a.nom}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <VerifiedBadge />
          <DispoChip a={a} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{m.artisan}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
          <Rating value={a.note} />
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4" />
            {a.quartier}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {a.reponse}
          </span>
        </div>
        <p className="mt-1 text-xs">
          <ModeContact a={a} />
        </p>
        <ContactButton
          artisan={toContact(a)}
          className="mt-3 w-full rounded-xl bg-accent py-3 text-center text-sm font-bold text-accent-foreground transition hover:brightness-95 active:scale-[0.98]"
        />
      </div>
    </article>
  );
}

export function ProduitCard({ p, wide }: { p: Produit; wide?: boolean }) {
  const b = getBoutique(p.boutique);
  return (
    <Link
      href={`/quincaillerie/${p.id}`}
      className={`${wide ? "" : "w-44 shrink-0 md:w-auto"} group overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="relative h-32 overflow-hidden md:h-40">
        {p.image ? (
          <Image
            src={p.image}
            alt={p.nom}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <ProduitFallback categorie={p.categorie} />
        )}
        <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-foreground uppercase backdrop-blur">
          {p.categorie}
        </span>
        {p.promo && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            Promo
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="text-sm font-bold leading-snug">{p.nom}</h3>
        <p className="mt-1 text-lg font-bold text-primary">
          {fcfa(p.promo ?? p.prix)}
          <span className="text-xs font-medium text-muted-foreground"> / {p.unite}</span>
        </p>
        {p.promo && <p className="text-xs text-muted-foreground line-through">{fcfa(p.prix)}</p>}
        <p className="truncate text-xs text-muted-foreground">{b.nom}</p>
        <p className={`mt-1.5 text-[11px] font-bold ${p.stock > 10 ? "text-success" : "text-accent-ink"}`}>
          {p.stock > 10 ? "En stock" : `Plus que ${p.stock} en stock`}
        </p>
      </div>
    </Link>
  );
}

export function ProduitFallback({ categorie, big }: { categorie: string; big?: boolean }) {
  const Icon = produitIcons[categorie] ?? Wrench;
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream to-cream-2 text-primary">
      <span
        className={`flex items-center justify-center rounded-full bg-white/70 shadow-sm ${big ? "size-36" : "size-16"}`}
      >
        <Icon className={big ? "size-16" : "size-8"} strokeWidth={1.6} />
      </span>
    </div>
  );
}
