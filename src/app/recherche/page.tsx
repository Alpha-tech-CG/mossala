import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { ArtisanCardRow } from "@/components/ui";
import { type CategorieId, artisans, getMetier, metierLabel } from "@/lib/data";
import { FilterChips, SearchBar } from "./Filters";

export const metadata: Metadata = { title: "Rechercher un artisan — Artico" };

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export default function RecherchePage(props: PageProps<"/recherche">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-6xl" />}>
      <Recherche searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Recherche(props: Pick<PageProps<"/recherche">, "searchParams">) {
  const sp = await props.searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = norm(get("q"));
  const metier = get("metier");
  const categorie = get("categorie");
  const quartier = get("quartier");
  const dispo = get("dispo");
  const minNote = parseFloat(get("note")) || 0;

  const resultats = artisans
    .filter((a) => {
      const m = metierLabel(a.metier);
      if (q) {
        const hay = norm([a.nom, m.label, m.categorie.label, a.quartier, a.description].join(" "));
        // « plombier » doit trouver « plomberie » : on compare aussi le radical
        const words = q.split(/\s+/);
        if (!words.every((w) => hay.includes(w) || hay.includes(w.slice(0, 5)))) return false;
      }
      if (metier && a.metier !== metier) return false;
      if (categorie && !getMetier(a.metier)?.categories.includes(categorie as CategorieId)) return false;
      if (quartier && !a.zones.includes(quartier)) return false;
      if (dispo === "aujourdhui" && a.disponible !== "aujourdhui") return false;
      if (dispo === "semaine" && a.disponible === "plus-tard") return false;
      if (a.note < minNote) return false;
      return true;
    })
    // Classement naturel : note pondérée par le nombre d'avis
    .sort((a, b) => b.note * Math.log(b.nbAvis + 2) - a.note * Math.log(a.nbAvis + 2));

  return (
    <div className="mx-auto max-w-6xl pt-4 md:pt-8">
      <div className="px-5 md:max-w-2xl">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <section className="px-5 pt-5">
        <h1 className="text-2xl font-bold">Résultats</h1>
        <p className="text-sm text-muted-foreground">
          {resultats.length} artisan{resultats.length > 1 ? "s" : ""} disponible
          {resultats.length > 1 ? "s" : ""} à {quartier || "Brazzaville"}
        </p>
      </section>

      <div className="mt-4">
        <Suspense>
          <FilterChips />
        </Suspense>
      </div>

      {resultats.length ? (
        <section className="mt-5 mb-10 grid gap-4 px-5 md:grid-cols-2">
          {resultats.map((a) => (
            <ArtisanCardRow key={a.id} a={a} />
          ))}
        </section>
      ) : (
        <div className="mx-5 mt-8 mb-10 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
          <SearchX className="size-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Aucun artisan ne correspond</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Élargissez le quartier ou parcourez la liste complète des métiers.
          </p>
          <div className="mt-5 flex gap-3">
            <Link href="/recherche" className="rounded-xl border border-border px-4 py-3 text-sm font-bold">
              Effacer les filtres
            </Link>
            <Link href="/metiers" className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground">
              Tous les métiers
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
