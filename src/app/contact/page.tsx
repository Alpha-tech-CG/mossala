import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Flag, MapPin, Megaphone, Store } from "lucide-react";
import { BackHeader } from "@/components/ui";
import { FormulaireContact } from "./FormulaireContact";

export const metadata: Metadata = {
  title: "Nous contacter — Artopif",
  description:
    "Une question, une suggestion, un problème avec un avis ? Écrivez à l’équipe Artopif, nous vous répondons par téléphone, WhatsApp ou email.",
};

const RACCOURCIS = [
  [Store, "Vous êtes artisan ou boutiquier ?", "Créez gratuitement votre profil professionnel.", "/pro/inscription"],
  [Megaphone, "Publicité et visibilité", "Découvrez nos espaces et nos offres Premium.", "/services"],
  [Flag, "Un avis vous semble faux ?", "Utilisez « Signaler » sur la fiche, ou écrivez-nous ici.", "/recherche"],
] as const;

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Nous contacter" />

      <div className="mt-6 grid gap-10 md:mt-10 md:grid-cols-[1fr_minmax(0,28rem)] md:gap-14">
        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">L’équipe Artopif</p>
          <h2 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">
            Une question ? <em className="text-primary">Parlons-en.</em>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Une suggestion, un souci avec un professionnel, un avis à signaler ou une demande de partenariat :
            laissez-nous un message, notre équipe vous recontacte par téléphone, WhatsApp ou email.
          </p>

          <ul className="mt-8 space-y-3">
            {RACCOURCIS.map(([Icon, t, d, href]) => (
              <li key={t}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{t}</span>
                    <span className="text-sm text-muted-foreground">{d}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 text-primary" /> Brazzaville, République du Congo
          </p>
        </section>

        <section className="h-fit rounded-3xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03] md:p-7">
          <FormulaireContact />
        </section>
      </div>
    </div>
  );
}
