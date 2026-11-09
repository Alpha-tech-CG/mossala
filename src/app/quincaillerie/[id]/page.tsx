import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, MapPin, Package, Phone } from "lucide-react";
import { BackHeader, ProduitFallback } from "@/components/ui";
import { fcfa, getBoutique, getProduit, produits } from "@/lib/data";
import { Reservation } from "./Reservation";

// Toutes les fiches sont pré-générées : la navigation peut attendre le rendu.
export const instant = false;

export function generateStaticParams() {
  return produits.map((p) => ({ id: p.id }));
}

export default async function ProduitPage(props: PageProps<"/quincaillerie/[id]">) {
  const p = getProduit((await props.params).id);
  if (!p) notFound();
  const b = getBoutique(p.boutique);

  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-10 md:pt-8">
      <BackHeader title="Fiche produit" href="/quincaillerie" />
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03] md:sticky md:top-24">
          {p.image ? (
            <Image
              src={p.image}
              alt={p.nom}
              width={800}
              height={800}
              priority
              className="h-full w-full object-cover"
            />
          ) : (
            <ProduitFallback categorie={p.categorie} big />
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
            {p.categorie} · {p.marque}
          </p>
          <h1 className="mt-2 font-serif text-4xl">{p.nom}</h1>
          <p className="mt-3 text-3xl font-bold text-primary">
            {fcfa(p.promo ?? p.prix)}{" "}
            <span className="text-base font-medium text-muted-foreground">/ {p.unite}</span>
          </p>
          {p.promo && (
            <p className="mt-1 flex items-center gap-2 text-sm">
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white uppercase">
                Promotion
              </span>
              <span className="text-muted-foreground line-through">{fcfa(p.prix)}</span>
            </p>
          )}
          <p className="mt-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Prix indicatif, à confirmer en boutique
          </p>
          <p className="mt-4 text-sm">{p.description}</p>
          <p className="mt-3 flex items-center gap-2 text-sm">
            <Package className="size-4 text-muted-foreground" />
            {p.stock > 10 ? "En stock" : `Plus que ${p.stock} en stock`}
          </p>

          <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm">
            <p className="font-bold">{b.nom}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" /> {b.adresse}, {b.quartier}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" /> {b.horaires}
            </p>
            <a
              href={`tel:${b.telephone.replace(/\s/g, "")}`}
              className="mt-2 flex items-center gap-2 text-sm font-bold text-primary"
            >
              <Phone className="size-4" /> {b.telephone}
            </a>
          </div>

          <Reservation prix={p.promo ?? p.prix} stock={p.stock} unite={p.unite} boutique={b.nom} />
        </div>
      </div>
    </div>
  );
}
