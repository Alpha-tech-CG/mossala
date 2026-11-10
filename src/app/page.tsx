import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  LayoutGrid,
  BadgeCheck,
  Fingerprint,
  MessagesSquare,
  PhoneCall,
  Quote,
  Search,
  Star,
  Store,
} from "lucide-react";
import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { CadrePub, EspacePub, PubsLateralesFil } from "@/components/EspacePub";
import { ArtisanCardVertical, ProduitCard, SectionTitle, categorieIcons } from "@/components/ui";
import { artisans, categories, metiers, produits, quartiers } from "@/lib/data";

const etapes = [
  { Icon: Search, t: "Trouvez votre artisan", d: "Par métier et quartier, avec ses avis et ses réalisations." },
  { Icon: PhoneCall, t: "Contactez-le", d: "Appel direct, ou message : il est prévenu par WhatsApp et SMS." },
  { Icon: Star, t: "Notez l’intervention", d: "Votre avis aide les meilleurs artisans à se démarquer." },
];

const verifications = [
  { Icon: PhoneCall, t: "Téléphone vérifié", d: "Chaque numéro est confirmé par code SMS." },
  { Icon: Fingerprint, t: "Identité vérifiée", d: "Pièce d’identité contrôlée par notre équipe terrain." },
  { Icon: BadgeCheck, t: "Références contrôlées", d: "Nous appelons d’anciens clients avant d’activer le profil." },
  { Icon: MessagesSquare, t: "Avis liés à une intervention", d: "Seul un client ayant réservé peut laisser un avis." },
];

const temoignages = [
  {
    texte: "J’ai laissé un message le matin, le plombier m’a rappelée dans l’heure et le prix n’a pas bougé.",
    nom: "Grâce N.",
    lieu: "Bacongo",
    photo: "/images/jean-claude.jpg",
    artisan: "Jean-Claude M., plombier",
  },
  {
    texte: "Enfin des prix clairs : j’ai réservé mon ciment en ligne et payé au retrait, sans surprise.",
    nom: "Hervé K.",
    lieu: "Makélékélé",
    photo: "/images/ciment.jpg",
    artisan: "Quincaillerie Total Bacongo",
  },
  {
    texte: "Les photos de ses réalisations m’ont convaincue. Le salon est magnifique.",
    nom: "Sandrine M.",
    lieu: "Moungali",
    photo: "/images/divine.jpg",
    artisan: "Divine M., peintre",
  },
];

export default function Home() {
  const proches = artisans.filter((a) => a.image).slice(0, 4);
  return (
    <>
      <Hero />

      <CadrePub accueil>

      {/* Bandeau quartiers défilant */}
      <div className="mt-6 overflow-hidden py-3 md:mt-8" aria-label="Quartiers couverts">
        <div className="marquee flex w-max gap-10 text-sm font-semibold text-muted-foreground">
          {[0, 1].map((copy) =>
            quartiers.map((q) => (
              <span key={`${copy}-${q}`} aria-hidden={copy === 1} className="flex items-center gap-10">
                {q}
                <span className="size-1.5 rounded-full bg-accent" />
              </span>
            )),
          )}
        </div>
      </div>

      {/* Grand écran : deux blocs publicitaires dans la colonne de droite (CadrePub).
          Sous 1280 px, ils sont réinsérés dans le fil (PubsLateralesFil). */}
      <div className="mx-auto max-w-6xl">
        {/* Catégories de métiers. Mobile : une seule ligne (3 secteurs + « Tout voir »). */}
        <Reveal className="mt-8 px-5 md:mt-12">
          <SectionTitle
            eyebrow={`${metiers.length} métiers`}
            title={"De quoi avez-vous besoin ?"}
            href="/metiers"
          />
          <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-6">
            {categories.map((c, i) => {
              const Icon = categorieIcons[c.id];
              return (
                <Link
                  key={c.id}
                  href={`/recherche?categorie=${c.id}`}
                  className={`group flex-col items-center gap-2 rounded-2xl bg-card px-1.5 py-3.5 text-center shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] sm:px-2 md:py-5 ${i < 3 ? "flex" : "hidden md:flex"}`}
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-white sm:size-12">
                    <Icon className="size-5 sm:size-6" />
                  </span>
                  <span className="text-[11px] leading-tight font-semibold sm:text-[13px] md:text-sm">{c.court}</span>
                </Link>
              );
            })}
            <Link
              href="/metiers"
              className="group flex flex-col items-center gap-2 rounded-2xl bg-primary px-1.5 py-3.5 text-center text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] sm:px-2 md:py-5"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-white/15 sm:size-12">
                <LayoutGrid className="size-5 sm:size-6" />
              </span>
              <span className="text-[11px] leading-tight font-semibold sm:text-[13px] md:text-sm">
                <span className="md:hidden">Tout voir</span>
                <span className="hidden md:inline">Tous les métiers</span>
              </span>
            </Link>
          </div>
        </Reveal>

        <PubsLateralesFil className="mt-10 px-5 md:mt-12" />

        <Reveal className="mt-12 md:mt-16">
          <div className="px-5">
            <SectionTitle eyebrow="Les mieux notés" title="Artisans près de vous" href="/recherche" />
          </div>
          <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto px-5 pt-1 pb-3 md:grid md:grid-cols-4 md:overflow-visible">
            {proches.map((a) => (
              <ArtisanCardVertical key={a.id} a={a} />
            ))}
          </div>
        </Reveal>

        <EspacePub emplacement="accueil-1" className="mt-12 block px-5 md:mt-16" />

        {/* Confiance */}
        <section className="mt-14 px-5 md:mt-24">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <Reveal className="relative order-2 md:order-1">
              <div className="relative ml-auto aspect-[4/5] w-[78%] overflow-hidden rounded-[28px] shadow-xl md:w-[80%]">
                <Image src="/images/patrick.jpg" alt="Patrick, électricien vérifié" fill sizes="(min-width: 768px) 40vw, 80vw" className="object-cover" />
              </div>
              <div className="absolute bottom-6 left-0 w-[46%] overflow-hidden rounded-2xl shadow-xl ring-4 ring-background">
                <Image src="/images/peinture.jpg" alt="" width={400} height={400} className="aspect-square w-full object-cover" />
              </div>
            </Reveal>
            <Reveal className="order-1 md:order-2" delay={120}>
              <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase md:text-[11px]">
                Notre engagement
              </p>
              <h2 className="mt-3 font-serif text-4xl leading-[1.1] md:text-5xl">
                Des artisans vérifiés,
                <br />
                <em className="text-primary">pas des promesses.</em>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Chaque badge correspond à une vérification réelle. Les meilleurs artisans montent
                grâce à leurs avis et leurs réalisations, jamais grâce à la publicité.
              </p>
              <ul className="mt-7 grid gap-4 sm:grid-cols-2">
                {verifications.map(({ Icon, t, d }) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{t}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        <Reveal className="mt-16 md:mt-24">
          <div className="px-5">
            <SectionTitle eyebrow="Prix fixes affichés" title="Quincaillerie" href="/quincaillerie" />
          </div>
          <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto px-5 pt-1 pb-3 md:grid md:grid-cols-4 md:overflow-visible">
            {produits.map((p) => (
              <ProduitCard key={p.id} p={p} />
            ))}
          </div>
        </Reveal>

        <EspacePub emplacement="accueil-2" className="mt-12 block px-5 md:mt-16" />

        <Reveal className="mt-12 px-5 md:mt-20">
          <SectionTitle eyebrow="Simple et sans commission" title="Comment ça marche" />
          <ol className="mt-4 grid gap-3 md:grid-cols-3 md:gap-4">
            {etapes.map(({ Icon, t, d }, i) => (
              <li
                key={t}
                className="relative flex gap-4 overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03] md:flex-col md:p-6"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-3 right-3 font-serif text-7xl text-cream-2 md:text-8xl"
                >
                  {i + 1}
                </span>
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="relative">
                  <p className="font-bold">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>

      {/* Témoignages, sur fond crème pleine largeur */}
      <section className="mt-16 bg-cream py-14 md:mt-24 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase md:text-[11px]">
              Ils nous font confiance
            </p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">
              Ce que disent <em className="text-primary">nos clients</em>
            </h2>
          </Reveal>
          <div className="no-scrollbar -mx-5 mt-10 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {temoignages.map((t, i) => (
              <Reveal
                key={t.nom}
                delay={i * 120}
                className="w-[85%] shrink-0 snap-center md:w-auto"
              >
                <figure className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.03]">
                  <Quote className="size-8 text-accent-ink" />
                  <p className="mt-2 flex gap-0.5">
                    {Array.from({ length: 5 }, (_, k) => (
                      <Star key={k} className="size-4 fill-star text-star" />
                    ))}
                  </p>
                  <blockquote className="mt-4 flex-1 font-serif text-lg leading-snug">
                    {t.texte}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                    <Image src={t.photo} alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-bold">
                        {t.nom} <span className="font-normal text-muted-foreground">· {t.lieu}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">A fait appel à {t.artisan}</p>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl">
        <Reveal className="my-12 px-5 md:my-20">
          <div className="relative isolate flex flex-col gap-5 overflow-hidden rounded-[28px] bg-foreground p-7 text-white md:flex-row md:items-center md:justify-between md:p-12">
            {/* Photo en pleine opacité ; le voile sombre ne couvre que la zone du texte */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-cover bg-[center_30%] md:bg-right"
              style={{ backgroundImage: "url(/images/marcel.jpg)" }}
            />
            {/* mobile : le texte est en haut, voile du haut vers le bas */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/90 via-foreground/70 to-foreground/25 md:hidden"
            />
            {/* desktop : le texte est à gauche, la photo reste nette à droite */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-foreground/95 via-foreground/65 to-transparent md:block"
            />
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
                <Store className="size-4" /> Professionnels
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight [text-shadow:0_2px_14px_rgba(0,0,0,0.45)] md:text-5xl">
                Artisan ou boutiquier ?<br />
                <em className="text-accent-ink">Rejoignez-nous gratuitement.</em>
              </h2>
              <p className="mt-3 max-w-md text-sm text-white/75">
                Profil gratuit, vos prix restent libres, aucune commission sur vos prestations.
              </p>
            </div>
            <Link
              href="/pro"
              className="group flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-sm font-bold text-accent-foreground transition hover:brightness-95"
            >
              Créer mon profil
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
      </CadrePub>
    </>
  );
}
