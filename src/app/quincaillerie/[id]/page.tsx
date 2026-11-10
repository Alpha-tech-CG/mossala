import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Store } from "lucide-react";
import { BackHeader, ProduitFallback } from "@/components/ui";
import { getProduit, offres, produits } from "@/lib/data";
import { Comparateur } from "./Comparateur";

// Toutes les fiches sont pré-générées : la navigation peut attendre le rendu.
export const instant = false;

export function generateStaticParams() {
  return produits.map((p) => ({ id: p.id }));
}

export async function generateMetadata(props: PageProps<"/quincaillerie/[id]">): Promise<Metadata> {
  const p = getProduit((await props.params).id);
  return { title: p ? `${p.nom} : comparer les prix — Artico` : "Produit — Artico" };
}

export default async function ProduitPage(props: PageProps<"/quincaillerie/[id]">) {
  const p = getProduit((await props.params).id);
  if (!p) notFound();
  const nbBoutiques = offres.filter((of) => of.produit === p.id).length;

  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-10 md:pt-8">
      <BackHeader title="Fiche produit" href="/quincaillerie" />
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03] md:sticky md:top-24">
          {p.image ? (
            <Image src={p.image} alt={p.nom} width={800} height={800} priority className="h-full w-full object-cover" />
          ) : (
            <ProduitFallback categorie={p.categorie} big />
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
            {p.categorie} · {p.marque}
          </p>
          <h1 className="mt-2 font-serif text-4xl">{p.nom}</h1>
          <p className="mt-3 text-sm">{p.description}</p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Store className="size-4" /> Vendu au {p.unite} dans {nbBoutiques} quincaillerie{nbBoutiques > 1 ? "s" : ""}{" "}
            partenaire{nbBoutiques > 1 ? "s" : ""} au Congo
          </p>

          <Suspense fallback={<div className="mt-6 h-72 animate-pulse rounded-2xl bg-card" />}>
            <Comparateur p={{ id: p.id, unite: p.unite }} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
