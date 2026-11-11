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
  Hammer,
  LayoutGrid,
  Nut,
  Store,
  TrendingDown,
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
  type Boutique,
  type CategorieId,
  type MetierId,
  type Lieu,
  type Produit,
  VILLE_DEFAUT,
  fcfa,
  libelleProximite,
  lienLieu,
  resumeProduit,
  getMetier,
  initiales,
  lieuArtisan,
  metierLabel,
  note,
} from "@/lib/data";
import { ContactButton, type ContactArtisan } from "./Contact";
import { ProfilLink, type Apercu } from "./Acces";
import { iconeDuMetier } from "@/lib/metierIcons";

/**
 * Données envoyées au navigateur pour la fenêtre « Contactez ».
 * Un numéro privé n'est JAMAIS transmis : le contact passe par la messagerie.
 */
/** Infos publiques d'un artisan, affichées dans la fenêtre d'inscription. */
export function toApercu(a: Artisan): Apercu {
  return {
    id: a.id,
    nom: a.nom,
    metier: metierLabel(a.metier).artisan,
    quartier: a.quartier,
    image: a.image,
    note: a.note,
    nbAvis: a.nbAvis,
  };
}

export function toContact(a: Artisan): ContactArtisan {
  return {
    id: a.id,
    nom: a.nom,
    metier: metierLabel(a.metier).artisan,
    image: a.image,
    telephone: a.numeroPublic ? a.telephone : "",
    numeroPublic: a.numeroPublic,
    quartier: a.quartier,
    note: a.note,
    nbAvis: a.nbAvis,
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
  Outillage: Hammer,
  Fixation: Nut,
  Carrelage: LayoutGrid,
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
      <ProfilLink a={toApercu(a)} className="relative block overflow-hidden">
        <Avatar
          a={a}
          className="h-40 w-full transition-transform duration-500 group-hover:scale-105 md:h-48"
        />
      </ProfilLink>
      <div className="flex flex-1 flex-col p-4">
        <ProfilLink a={toApercu(a)} className="truncate font-bold hover:underline">
          {a.nom}
        </ProfilLink>
        <p className="text-sm text-muted-foreground">
          {m.artisan} · {lieuArtisan(a)}
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
      <ProfilLink a={toApercu(a)} className="shrink-0">
        <Avatar a={a} className="size-20 rounded-xl min-[360px]:size-24" />
      </ProfilLink>
      <div className="flex min-w-0 flex-1 flex-col">
        <ProfilLink a={toApercu(a)} className="truncate text-base font-bold hover:underline">
          {a.nom}
        </ProfilLink>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <VerifiedBadge />
          <DispoChip a={a} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{m.artisan}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
          <Rating value={a.note} />
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4" />
            {lieuArtisan(a)}
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

/**
 * Carte produit : meilleur prix dans la ville du client, nombre de quincailleries qui l'ont,
 * et la boutique la moins chère. Le lien garde la ville et le quartier choisis.
 */
export function ProduitCard({ p, wide, lieu = { ville: VILLE_DEFAUT } }: { p: Produit; wide?: boolean; lieu?: Lieu }) {
  const r = resumeProduit(p.id, lieu);
  return (
    <Link
      href={lienLieu(`/quincaillerie/${p.id}`, lieu)}
      className={`${wide ? "" : "w-44 shrink-0 md:w-auto"} group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-1 hover:shadow-lg`}
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
        {r?.promo && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
            Promo
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="text-sm font-bold leading-snug">{p.nom}</h3>
        {r ? (
          <>
            <p className="mt-1 text-lg font-bold text-primary">
              {!r.memePrix && <span className="text-xs font-semibold text-muted-foreground">dès </span>}
              {fcfa(r.min)}
              <span className="text-xs font-medium text-muted-foreground"> / {p.unite}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {r.memePrix && r.nb > 1 ? "Même prix partout · " : ""}
              {r.nb} quincaillerie{r.nb > 1 ? "s" : ""} à {lieu.ville}
            </p>
            <p className="mt-auto flex items-center gap-1 truncate pt-1.5 text-[11px] font-bold text-success">
              <Store className="size-3 shrink-0" />
              <span className="truncate">{r.memePrix ? r.plusProche.b.nom : r.moinsCher.b.nom}</span>
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Pas encore disponible à {lieu.ville}</p>
        )}
      </div>
    </Link>
  );
}

/** Carte d'une quincaillerie : on la touche pour entrer et voir ses produits et ses prix. */
export function BoutiqueCard({
  b,
  lieu,
  nbProduits,
  meilleursPrix,
  distance,
}: {
  b: Boutique;
  lieu: Lieu;
  nbProduits: number;
  meilleursPrix: number;
  distance: 0 | 1 | 2 | 3;
}) {
  return (
    <Link
      href={lienLieu(`/quincaillerie/boutique/${b.id}`, lieu)}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-1 hover:shadow-lg"
    >
      <BoutiquePhoto b={b} className="aspect-[16/7] w-full" sizes="(min-width: 768px) 480px, 100vw" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold">{b.nom}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              distance === 0
                ? "bg-success text-white"
                : distance === 1
                  ? "bg-secondary text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {distance === 2 ? b.quartier : libelleProximite(b, lieu)}
          </span>
        </div>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" /> {b.adresse}, {b.quartier}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" /> {b.horaires}
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>
            <strong>{nbProduits}</strong> produit{nbProduits > 1 ? "s" : ""}
          </span>
          {meilleursPrix > 0 && (
            <span className="flex items-center gap-1 font-semibold text-success">
              <TrendingDown className="size-4" /> Meilleur prix sur {meilleursPrix}
            </span>
          )}
        </p>
        <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-bold text-primary">
          Voir les produits et les prix <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/**
 * Photo d'une quincaillerie. Sans photo, une vignette à ses couleurs avec ses initiales,
 * pour qu'on la reconnaisse quand même d'un coup d'œil.
 */
const TEINTES = [
  "from-primary to-[#163A6B]",
  "from-accent-ink to-[#6E5214]",
  "from-[#2F6B4F] to-[#1F4A36]",
  "from-[#8A3B2E] to-[#5E271E]",
];

export function BoutiquePhoto({ b, className = "", sizes = "160px" }: { b: Boutique; className?: string; sizes?: string }) {
  if (b.image)
    return (
      <span className={`relative block shrink-0 overflow-hidden bg-cream ${className}`}>
        <Image src={b.image} alt={`Quincaillerie ${b.nom}`} fill sizes={sizes} className="object-cover" />
      </span>
    );
  const teinte = TEINTES[[...b.id].reduce((n, c) => n + c.charCodeAt(0), 0) % TEINTES.length];
  return (
    <span
      aria-hidden
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br text-white ${teinte} ${className}`}
    >
      <Store className="absolute -right-2 -bottom-2 size-[60%] opacity-15" strokeWidth={1.4} />
      <span className="relative font-serif text-[clamp(0.9rem,2.2vw,1.6rem)] leading-none tracking-wide">{initiales(b.nom)}</span>
    </span>
  );
}

export function ProduitIcon({ categorie, className }: { categorie: string; className?: string }) {
  return createElement(produitIcons[categorie] ?? Wrench, { className, strokeWidth: 1.6 });
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
