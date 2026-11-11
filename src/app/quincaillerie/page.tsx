import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, Search, Store } from "lucide-react";
import { BackHeader, BoutiqueCard } from "@/components/ui";
import { ChoixLieu } from "@/components/ChoixLieu";
import { boutiquesProches, categoriesProduits, lieuDepuis, VILLE_DEFAUT } from "@/lib/data";

export const metadata: Metadata = { title: "Quincaillerie — Artopif" };

export default function QuincailleriePage(props: PageProps<"/quincaillerie">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-6xl" />}>
      <Quincaillerie searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Quincaillerie(props: Pick<PageProps<"/quincaillerie">, "searchParams">) {
  const lieu = lieuDepuis(await props.searchParams);
  const shops = boutiquesProches(lieu);
  const ou = lieu.quartier ? `${lieu.quartier}, ${lieu.ville}` : lieu.ville;

  return (
    <div className="mx-auto max-w-6xl pt-4 pb-10 md:pt-8">
      <div className="px-5">
        <BackHeader title="Quincaillerie" />
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Choisissez votre quincaillerie pour voir ses produits et ses prix, puis réservez : vous payez le montant exact
          au retrait. Vous cherchez un produit précis ? Comparez son prix dans toutes les boutiques.
        </p>

        {/* Recherche d'un produit dans toutes les quincailleries (résultats sur /recherche) */}
        <form
          action="/recherche"
          className="mt-5 flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border sm:flex-row"
        >
          <input type="hidden" name="quoi" value="materiaux" />
          {lieu.ville !== VILLE_DEFAUT && <input type="hidden" name="ville" value={lieu.ville} />}
          {lieu.quartier && <input type="hidden" name="quartier" value={lieu.quartier} />}
          <label className="flex min-w-0 flex-1 items-center gap-3 px-4">
            <Search className="size-5 shrink-0 text-primary" />
            <span className="sr-only">Quel produit cherchez-vous ?</span>
            <input
              name="q"
              type="search"
              placeholder="Ciment, peinture, tuyau PVC…"
              className="w-full bg-transparent py-4 text-base outline-none placeholder:text-muted-foreground"
            />
          </label>
          <label className="relative border-t border-border sm:w-48 sm:border-t-0 sm:border-l">
            <span className="sr-only">Type de produit</span>
            <select name="cat" defaultValue="" className="w-full appearance-none bg-transparent px-4 py-4 pr-10 text-sm font-semibold outline-none">
              <option value="">Tous les types</option>
              {categoriesProduits.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
          </label>
          <button type="submit" className="bg-accent px-6 py-4 text-sm font-bold text-accent-foreground">
            Comparer les prix
          </button>
        </form>
      </div>

      <section className="mt-10 px-5" aria-labelledby="boutiques">
        <h2 id="boutiques" className="font-serif text-2xl">
          Choisissez votre quincaillerie
        </h2>
        <ChoixLieu className="mt-3 max-w-md" />
        <p className="mt-3 text-sm text-muted-foreground">
          {shops.length
            ? `${shops.length} quincaillerie${shops.length > 1 ? "s" : ""} partenaire${shops.length > 1 ? "s" : ""}, les plus proches de ${ou} en premier.`
            : `Aucune quincaillerie partenaire à ${lieu.ville} pour le moment.`}
        </p>
        {!shops.length && (
          <Link
            href="/pro/inscription"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground"
          >
            <Store className="size-4" /> Vous avez une quincaillerie ? Inscrivez-la gratuitement
          </Link>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((s) => (
            <BoutiqueCard key={s.b.id} lieu={lieu} {...s} />
          ))}
        </div>
      </section>
    </div>
  );
}
