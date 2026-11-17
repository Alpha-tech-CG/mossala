import Link from "next/link";
import { ArrowRight, BadgeCheck, Hammer, Star, Store, Users } from "lucide-react";
import { ProfilLink } from "./Acces";
import { Avatar, BoutiquePhoto, toApercu } from "./ui";
import {
  CRITERES_ARTISAN,
  CRITERES_MAGASIN,
  artisansRecommandes,
  lieuArtisan,
  magasinsRecommandes,
  metierLabel,
  note,
} from "@/lib/data";

function Note({ valeur, nb }: { valeur: number; nb: number }) {
  return (
    <p className="mt-1 flex items-center gap-1.5 text-sm">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, k) => (
          <Star key={k} className={`size-3.5 ${k < Math.round(valeur) ? "fill-star text-star" : "text-border"}`} />
        ))}
      </span>
      <strong>{note(valeur)}/5</strong>
      <span className="text-muted-foreground">· {nb} avis</span>
    </p>
  );
}

function Criteres({ liste }: { liste: string[] }) {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">Les clients évaluent</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {liste.map((c) => (
          <li key={c} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Section d'accueil « Ils ont testé, ils recommandent » : la réputation des professionnels. */
export function Recommandations() {
  const pros = artisansRecommandes(3);
  const magasins = magasinsRecommandes(3);

  return (
    <section aria-labelledby="titre-recommandations">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase md:text-[11px]">
          Ils ont testé, ils recommandent
        </p>
        <h2 id="titre-recommandations" className="mt-3 font-serif text-4xl leading-[1.1] md:text-5xl">
          Les professionnels <em className="text-primary">appréciés par la communauté.</em>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Découvrez les artisans et magasins recommandés par des clients ayant réellement vécu une expérience avec eux.
        </p>
        <ul className="mt-5 flex flex-wrap justify-center gap-2 text-sm font-semibold">
          <li className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 shadow-sm ring-1 ring-black/[0.04]">
            <BadgeCheck className="size-4 text-primary" /> Avis vérifiés
          </li>
          <li className="flex items-center gap-1.5 rounded-full bg-card px-3.5 py-1.5 shadow-sm ring-1 ring-black/[0.04]">
            <Users className="size-4 text-primary" /> Expériences réelles
          </li>
        </ul>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6">
        {/* Artisans */}
        <div className="flex min-w-0 flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03] md:p-6">
          <h3 className="flex items-center gap-2 font-bold md:text-lg">
            <Hammer className="size-5 text-primary" /> Artisans les mieux recommandés
          </h3>
          <ol className="mt-4 flex-1 divide-y divide-border">
            {pros.map((a) => (
              <li key={a.id}>
                <ProfilLink a={toApercu(a)} className="group flex items-center gap-3 py-3">
                  <Avatar a={a} className="size-14 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate font-bold group-hover:underline">{a.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {metierLabel(a.metier).artisan} · {lieuArtisan(a)} · Recommandé par ses clients
                    </p>
                    <Note valeur={a.note} nb={a.nbAvis} />
                  </div>
                </ProfilLink>
              </li>
            ))}
          </ol>
          <Criteres liste={CRITERES_ARTISAN} />
          <Link href="/recherche" className="group mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
            Voir tous les artisans
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Magasins */}
        <div className="flex min-w-0 flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03] md:p-6">
          <h3 className="flex items-center gap-2 font-bold md:text-lg">
            <Store className="size-5 text-primary" /> Magasins appréciés
          </h3>
          <ol className="mt-4 flex-1 divide-y divide-border">
            {magasins.map((b) => (
              <li key={b.id}>
                <Link href={`/quincaillerie/boutique/${b.id}`} className="group flex items-center gap-3 py-3">
                  <BoutiquePhoto b={b} className="size-14 rounded-xl" sizes="56px" />
                  <div className="min-w-0">
                    <p className="truncate font-bold group-hover:underline">{b.nom}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.quartier}, {b.ville} · Appréciée par ses acheteurs
                    </p>
                    <Note valeur={b.note} nb={b.nbAvis} />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <Criteres liste={CRITERES_MAGASIN} />
          <Link href="/quincaillerie" className="group mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
            Voir la quincaillerie et comparer les prix
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <p className="mx-auto mt-5 max-w-2xl text-center text-xs text-muted-foreground">
        Classement établi selon la note, le nombre d’avis, leur récence et les expériences vérifiées, jamais selon la
        publicité. Ainsi, un professionnel avec deux avis ne passe pas automatiquement devant un autre qui compte
        cinquante expériences positives.
      </p>
    </section>
  );
}
