import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Camera,
  Hammer,
  Lock,
  Percent,
  Phone,
  Store,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { metiers } from "@/lib/metiers";

export const metadata: Metadata = { title: "Espace professionnels — ArtisanBrazza" };

const avantages = [
  { Icon: Percent, t: "0 % de commission", d: "Vos prix restent libres. Nous ne prenons rien sur vos prestations." },
  { Icon: Phone, t: "Numéro public ou privé", d: "Les clients vous appellent directement, ou vous écrivent si vous préférez garder votre numéro." },
  { Icon: BellRing, t: "Alerte WhatsApp et SMS", d: "Chaque nouveau message client vous est signalé immédiatement." },
  { Icon: Camera, t: "Vitrine de réalisations", d: "Vos photos avant/après rassurent les clients et vous font monter dans les résultats." },
  { Icon: BadgeCheck, t: "Badges de confiance", d: "Téléphone, identité, références : chaque vérification vous démarque." },
];

export default function ProPage() {
  return (
    <>
      <section className="px-2.5 pt-2.5 md:px-4 md:pt-4">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-foreground text-white">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-cover bg-[center_30%] md:bg-right"
            style={{ backgroundImage: "url(/images/patrick.jpg)" }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/90 via-foreground/75 to-foreground/40 md:bg-gradient-to-r md:from-foreground/95 md:via-foreground/70 md:to-transparent"
          />
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-24">
            <p className="fade-up text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase md:text-[11px]">
              Espace professionnels
            </p>
            <h1 className="fade-up mt-3 max-w-2xl font-serif text-4xl leading-[1.1] [text-shadow:0_2px_14px_rgba(0,0,0,0.4)] md:text-6xl">
              Plus de clients,
              <br />
              <em className="text-accent-ink">sans commission.</em>
            </h1>
            <p className="fade-up fade-up-1 mt-4 max-w-lg text-white/80">
              Créez votre profil gratuit en 3 minutes. {metiers.length} métiers acceptés, de la
              plomberie à la couture.
            </p>
            <div className="fade-up fade-up-2 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pro/inscription"
                className="group flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 font-bold text-accent-foreground transition hover:brightness-95"
              >
                <Hammer className="size-5" /> Je suis artisan
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/pro/inscription?type=boutique"
                className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-4 font-bold ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
              >
                <Store className="size-5" /> J’ai une quincaillerie
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/70">
              Déjà inscrit ?{" "}
              <Link href="/pro/espace" className="font-bold text-white underline underline-offset-4">
                Accéder à mon espace artisan
              </Link>{" "}
              ·{" "}
              <Link href="/pro/boutique" className="font-bold text-white underline underline-offset-4">
                mon espace boutique
              </Link>
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mt-12 md:mt-16">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase md:text-[11px]">
            Pourquoi nous rejoindre
          </p>
          <h2 className="mt-2 text-xl font-bold md:text-2xl">Tout est fait pour vous faire travailler</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {avantages.map(({ Icon, t, d }) => (
              <li key={t} className="flex gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mt-12 mb-14 grid gap-4 md:mt-16 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-black/[0.03]">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-muted-foreground uppercase">Gratuit</p>
            <p className="mt-2 font-serif text-3xl">Profil standard</p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Profil et badges", "Messages et appels illimités", "Galerie de réalisations", "Avis clients et réponses"].map((x) => (
                <li key={x} className="flex gap-2">
                  <BadgeCheck className="size-4 shrink-0 text-success" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-foreground p-6 text-white shadow-sm">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Optionnel</p>
            <p className="mt-2 font-serif text-3xl">Premium</p>
            <ul className="mt-4 space-y-2 text-sm text-white/85">
              {["Réalisations illimitées et mises en avant", "Badge Premium et statistiques détaillées", "Visibilité prioritaire (sans modifier votre note)"].map((x) => (
                <li key={x} className="flex gap-2">
                  <BadgeCheck className="size-4 shrink-0 text-accent-ink" /> {x}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-white/60">
              <Lock className="size-3.5" /> Les profils sponsorisés restent clairement identifiés.
            </p>
          </div>
        </Reveal>
      </div>
    </>
  );
}
