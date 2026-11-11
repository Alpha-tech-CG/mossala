import Image from "next/image";
import Link from "next/link";
import { Search, ShieldCheck, Star } from "lucide-react";
import { villes } from "@/lib/data";
import { HeroMosaic } from "./HeroMosaic";
import { TypedWord } from "./TypedWord";

const mots = ["plombier", "mécanicien", "couturier", "électricien", "menuisier", "coiffeur"];

const populaires = [
  { label: "Plombier", href: "/recherche?metier=plombier" },
  { label: "Mécanicien", href: "/recherche?metier=mecanicien-automobile" },
  { label: "Couture", href: "/recherche?categorie=textile" },
  { label: "Coiffure", href: "/recherche?categorie=beaute" },
];

const visages = ["/images/jean-claude.jpg", "/images/patrick.jpg", "/images/divine.jpg", "/images/marcel.jpg"];

export function Hero() {
  return (
    <section className="px-2.5 pt-2.5 md:px-4 md:pt-4">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-cream shadow-[0_30px_80px_-40px_rgba(20,33,61,0.45)] ring-1 ring-sand/50">
        <HeroMosaic />
        {/* 1. voile crème uniforme : toutes les photos ont la même luminosité douce */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-cream/25" />
        {/* 2. halo plus dense derrière le texte pour un contraste net */}
        {/*    (sur mobile le texte prend toute la largeur : halo plus large) */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 md:hidden"
          style={{
            background:
              "radial-gradient(ellipse 95% 60% at 50% 45%, rgba(242,234,219,.92) 0%, rgba(242,234,219,.75) 50%, rgba(242,234,219,0) 95%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 hidden md:block"
          style={{
            background:
              "radial-gradient(ellipse 58% 62% at 50% 48%, rgba(242,234,219,.9) 0%, rgba(242,234,219,.7) 40%, rgba(242,234,219,0) 85%)",
          }}
        />
        {/* 3. fondus haut et bas */}
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-20 bg-gradient-to-b from-cream to-transparent" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-cream to-transparent" />

        <div className="mx-auto max-w-4xl px-5 pt-14 pb-12 text-center md:pt-24 md:pb-16">
          <p className="fade-up inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.16em] whitespace-nowrap text-accent-ink uppercase shadow-sm min-[380px]:tracking-[0.3em] ring-1 ring-sand/60 backdrop-blur md:text-[11px]">
            <ShieldCheck className="size-3.5" />
            Brazzaville · Artisans vérifiés
          </p>

          <h1 className="fade-up mt-6 font-serif text-[2.6rem] leading-[1.1] font-normal tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Trouvez le bon
            <br />
            <TypedWord words={mots} />
          </h1>

          <p className="fade-up fade-up-1 mx-auto mt-6 max-w-xl text-base leading-relaxed font-medium text-foreground/90 [text-shadow:0_0_10px_rgba(242,234,219,1),0_0_3px_rgba(242,234,219,1)] md:text-lg">
            Appelez directement des artisans de confiance ou laissez-leur un message, et réservez
            vos matériaux au prix affiché.
          </p>

          <form
            action="/recherche"
            className="fade-up fade-up-1 mx-auto mt-9 flex max-w-3xl flex-col overflow-hidden border border-sand bg-white text-left shadow-[0_20px_50px_-30px_rgba(20,33,61,0.5)] sm:flex-row"
          >
            <label className="sr-only" htmlFor="hero-quoi">
              Que cherchez-vous ?
            </label>
            <select
              id="hero-quoi"
              name="quoi"
              defaultValue="artisans"
              className="border-b border-sand bg-transparent px-5 py-5 text-[15px] font-semibold outline-none sm:w-44 sm:border-r sm:border-b-0"
            >
              <option value="artisans">Artisans</option>
              <option value="materiaux">Quincaillerie / Matériaux</option>
            </select>
            <label className="flex min-w-0 flex-1 items-center gap-3 px-5">
              <Search className="size-5 shrink-0 text-primary" />
              <span className="sr-only">Que cherchez-vous ?</span>
              <input
                name="q"
                type="text"
                placeholder="Un artisan, du ciment, de la peinture…"
                className="w-full bg-transparent py-5 text-[15px] outline-none placeholder:text-muted-foreground"
              />
            </label>
            <label className="sr-only" htmlFor="hero-ville">
              Ville
            </label>
            <select
              id="hero-ville"
              name="ville"
              defaultValue=""
              className="border-t border-sand bg-transparent px-5 py-5 text-[15px] outline-none sm:w-52 sm:border-t-0 sm:border-l"
            >
              <option value="">Tout le Congo</option>
              {villes.map((v) => (
                <option key={v.nom} value={v.nom}>
                  {v.nom}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-foreground px-10 py-5 text-[13px] font-semibold tracking-[0.18em] text-white uppercase transition hover:bg-primary"
            >
              Rechercher
            </button>
          </form>

          <div className="fade-up fade-up-2 mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="font-semibold text-foreground/80 [text-shadow:0_0_10px_rgba(242,234,219,1),0_0_3px_rgba(242,234,219,1)]">Populaire :</span>
            {populaires.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="rounded-full bg-white/70 px-3 py-1.5 font-semibold ring-1 ring-sand/60 backdrop-blur transition hover:bg-white hover:text-primary"
              >
                {p.label}
              </Link>
            ))}
          </div>

          {/* Preuve sociale */}
          <div className="fade-up fade-up-2 mx-auto mt-9 flex w-fit items-center gap-3 rounded-full bg-white/80 py-2 pr-5 pl-2 shadow-sm ring-1 ring-sand/60 backdrop-blur">
            <div className="flex -space-x-2.5">
              {visages.map((v, i) => (
                <Image
                  key={v}
                  src={v}
                  alt=""
                  width={36}
                  height={36}
                  className={`size-9 rounded-full object-cover ring-2 ring-white ${i > 1 ? "max-[379px]:hidden" : ""}`}
                />
              ))}
            </div>
            <div className="text-left">
              <p className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="size-3.5 fill-star text-star" />
                ))}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">4,8/5</strong> · avis de clients vérifiés
              </p>
            </div>
          </div>
        </div>

        {/* Chiffres clés, posés sur un bandeau givré */}
        <div className="fade-up fade-up-2 border-t border-sand/60 bg-white/55 backdrop-blur-md">
          <div className="mx-auto grid max-w-4xl grid-cols-3 py-6 text-center md:py-8">
            {[
              ["0 %", "Commission"],
              ["Gratuit", "Messages illimités"],
              ["Meilleure", "Connaissance des prix"],
            ].map(([n, l], i) => (
              <div key={l} className={`min-w-0 px-1.5 sm:px-2 ${i > 0 ? "border-l border-sand" : ""}`}>
                <p className="font-serif text-xl whitespace-nowrap text-primary min-[380px]:text-2xl sm:text-4xl">{n}</p>
                <p className="mt-1.5 text-[9px] leading-snug tracking-[0.08em] text-foreground/75 uppercase min-[380px]:text-[10px] min-[380px]:tracking-[0.14em] sm:text-xs sm:tracking-[0.2em]">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
