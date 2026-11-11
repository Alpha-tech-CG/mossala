import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Clock, FileText, MapPin, Phone } from "lucide-react";
import { BackHeader, BoutiquePhoto } from "@/components/ui";
import { boutiques, rayonsBoutique } from "@/lib/data";
import { Rayons } from "./Rayons";

// Toutes les boutiques sont pré-générées : la navigation peut attendre le rendu.
export const instant = false;

export function generateStaticParams() {
  return boutiques.map((b) => ({ id: b.id }));
}

const trouver = (id: string) => boutiques.find((b) => b.id === id);

export async function generateMetadata(props: PageProps<"/quincaillerie/boutique/[id]">): Promise<Metadata> {
  const b = trouver((await props.params).id);
  return { title: b ? `${b.nom} : produits et prix — Artopif` : "Quincaillerie — Artopif" };
}

export default async function BoutiquePage(props: PageProps<"/quincaillerie/boutique/[id]">) {
  const b = trouver((await props.params).id);
  if (!b) notFound();
  const rayons = rayonsBoutique(b.id);

  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-10 md:pt-8">
      <BackHeader title="Quincaillerie" href="/quincaillerie" />

      <header className="mt-5 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03] md:grid md:grid-cols-[2fr_3fr]">
        <BoutiquePhoto b={b} className="aspect-[16/7] w-full md:aspect-auto md:h-full" sizes="(min-width: 768px) 400px, 100vw" />
        <div className="p-5">
          <h1 className="font-serif text-3xl">{b.nom}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" /> {b.adresse}, {b.quartier}, {b.ville}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 shrink-0" /> {b.horaires}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-sm">
            <a
              href={`tel:${b.telephone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold"
            >
              <Phone className="size-4" /> Appeler
            </a>
            <Link
              href={`/devis/nouveau?boutique=${b.id}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground"
            >
              <FileText className="size-4" /> Devis
            </Link>
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-card" />}>
        <Rayons boutique={b.nom} rayons={rayons} />
      </Suspense>
    </div>
  );
}
