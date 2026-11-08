import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Clock, MapPin, Phone } from "lucide-react";
import { BackHeader, ProduitCard, SectionTitle } from "@/components/ui";
import { boutiques, categoriesProduits, produits } from "@/lib/data";

export const metadata: Metadata = { title: "Quincaillerie — ArtisanBrazza" };

export default function QuincailleriePage(props: PageProps<"/quincaillerie">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-6xl" />}>
      <Quincaillerie searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Quincaillerie(props: Pick<PageProps<"/quincaillerie">, "searchParams">) {
  const { cat } = await props.searchParams;
  const liste = typeof cat === "string" ? produits.filter((p) => p.categorie === cat) : produits;

  return (
    <div className="mx-auto max-w-6xl pt-4 pb-10 md:pt-8">
      <div className="px-5">
        <BackHeader title="Quincaillerie" />
        <p className="mt-3 text-sm text-muted-foreground">
          Prix fixes affichés · Réservez en ligne, payez le montant exact au retrait.
        </p>
      </div>

      <div className="no-scrollbar mt-5 flex gap-2.5 overflow-x-auto px-5 pb-1">
        {["Tout", ...categoriesProduits].map((c) => {
          const active = c === "Tout" ? !cat : cat === c;
          return (
            <Link
              key={c}
              href={c === "Tout" ? "/quincaillerie" : `/quincaillerie?cat=${encodeURIComponent(c)}`}
              scroll={false}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold ${
                active ? "border-primary bg-secondary text-primary" : "border-border bg-card"
              }`}
            >
              {c}
            </Link>
          );
        })}
      </div>

      <section className="mt-5 grid grid-cols-2 gap-4 px-5 md:grid-cols-4">
        {liste.map((p) => (
          <ProduitCard key={p.id} p={p} wide />
        ))}
        {!liste.length && (
          <p className="col-span-full rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
            Aucun produit dans cette catégorie pour le moment.
          </p>
        )}
      </section>

      <section className="mt-10 px-5">
        <SectionTitle title="Boutiques partenaires" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {boutiques.map((b) => (
            <article key={b.id} className="rounded-2xl bg-card p-5 shadow-sm">
              <h3 className="font-bold">{b.nom}</h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" /> {b.adresse}, {b.quartier}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" /> {b.horaires}
              </p>
              <a
                href={`tel:${b.telephone.replace(/\s/g, "")}`}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold"
              >
                <Phone className="size-4" /> Appeler la boutique
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
