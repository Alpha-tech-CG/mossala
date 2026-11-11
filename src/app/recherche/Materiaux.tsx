import Image from "next/image";
import Link from "next/link";
import { ChevronRight, MapPin, SearchX, Store } from "lucide-react";
import { ProduitFallback, ProduitIcon } from "@/components/ui";
import {
  categoriesProduits,
  chercherProduits,
  fcfa,
  libelleProximite,
  lienLieu,
  offresProduit,
  prixOffre,
  produits,
  type Lieu,
} from "@/lib/data";

/** Nombre de boutiques montrées par produit avant « voir toutes ». */
const MAX_BOUTIQUES = 4;

/**
 * Recherche de produits : chaque produit avec le prix de chaque quincaillerie de la ville,
 * de la moins chère à la plus chère. Sans recherche ni type, on propose d'abord de choisir un type.
 */
export function ResultatsMateriaux({ q, cat, lieu }: { q: string; cat: string; lieu: Lieu }) {
  const type = categoriesProduits.includes(cat) ? cat : undefined;
  const ou = lieu.quartier ? `${lieu.quartier}, ${lieu.ville}` : lieu.ville;

  if (!q && !type) {
    return (
      <section className="mt-5 mb-10 px-5">
        <h1 className="text-2xl font-bold">Quel type de produit ?</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez un type pour voir les produits et le prix de chaque quincaillerie à {lieu.ville}.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categoriesProduits.map((t) => {
            const n = produits.filter((p) => p.categorie === t).length;
            return (
              <Link
                key={t}
                href={lienLieu("/recherche", lieu, { quoi: "materiaux", cat: t })}
                className="flex flex-col items-start gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
                  <ProduitIcon categorie={t} className="size-5" />
                </span>
                <span>
                  <span className="block font-bold">{t}</span>
                  <span className="text-xs text-muted-foreground">
                    {n} produit{n > 1 ? "s" : ""}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  const trouves = chercherProduits(q, type)
    .map((p) => ({ p, offres: offresProduit(p.id, lieu, "prix") }))
    // les produits disponibles dans la ville d'abord
    .sort((x, y) => Number(!x.offres.length) - Number(!y.offres.length));

  return (
    <>
      <section className="px-5 pt-5">
        <h1 className="text-2xl font-bold">{type ?? "Résultats"}</h1>
        <p className="text-sm text-muted-foreground">
          {trouves.length} produit{trouves.length > 1 ? "s" : ""}
          {q ? ` pour « ${q} »` : ""} · prix des quincailleries de {ou}, du moins cher au plus cher
        </p>
      </section>

      {!trouves.length ? (
        <div className="mx-5 mt-8 mb-10 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
          <SearchX className="size-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Aucun produit ne correspond</p>
          <p className="mt-1 text-sm text-muted-foreground">Essayez un autre mot ou choisissez un type de produit.</p>
          <Link
            href={lienLieu("/recherche", lieu, { quoi: "materiaux" })}
            className="mt-5 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground"
          >
            Voir les types de produits
          </Link>
        </div>
      ) : (
        <ul className="mt-5 mb-10 space-y-4 px-5">
          {trouves.map(({ p, offres }) => {
            const min = offres.length ? prixOffre(offres[0]) : 0;
            const max = offres.length ? prixOffre(offres[offres.length - 1]) : 0;
            const fiche = lienLieu(`/quincaillerie/${p.id}`, lieu);
            return (
              <li key={p.id} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03] md:grid md:grid-cols-[200px_minmax(0,1fr)]">
                <Link href={fiche} className="flex gap-4 p-4 md:flex-col md:border-r md:border-border">
                  <span className="size-20 shrink-0 overflow-hidden rounded-xl md:aspect-square md:size-auto md:w-full">
                    {p.image ? (
                      <Image src={p.image} alt="" width={320} height={320} className="h-full w-full object-cover" />
                    ) : (
                      <ProduitFallback categorie={p.categorie} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold leading-snug">{p.nom}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.marque} · le {p.unite}
                    </span>
                    {offres.length > 0 && (
                      <span className="mt-1 block text-sm font-bold text-primary">
                        {min === max ? fcfa(min) : `${fcfa(min)} – ${fcfa(max)}`}
                      </span>
                    )}
                  </span>
                </Link>

                <div className="border-t border-border md:border-t-0">
                  {offres.length ? (
                    <ol className="divide-y divide-border">
                      {offres.slice(0, MAX_BOUTIQUES).map((of, i) => (
                        <li key={of.boutique}>
                          <Link
                            href={`${lienLieu(`/quincaillerie/boutique/${of.boutique}`, lieu)}#${p.id}`}
                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-secondary/40"
                          >
                            <Store className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{of.b.nom}</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3 shrink-0" />
                                {of.distance < 2 ? libelleProximite(of.b, lieu) : of.b.quartier}
                                {" · "}
                                {of.stock > 10 ? "En stock" : `Plus que ${of.stock}`}
                              </span>
                            </span>
                            {i === 0 && min !== max && (
                              <span className="hidden rounded-full bg-success px-2 py-0.5 text-[11px] font-bold text-white sm:inline">
                                Moins cher
                              </span>
                            )}
                            <span className="shrink-0 text-right">
                              <span className="block font-bold text-primary">{fcfa(prixOffre(of))}</span>
                              {of.promo && <span className="block text-[11px] text-muted-foreground line-through">{fcfa(of.prix)}</span>}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">Pas encore disponible à {lieu.ville}.</p>
                  )}
                  {offres.length > 0 && (
                    <Link href={fiche} className="flex items-center justify-center gap-1 border-t border-border px-4 py-3 text-sm font-bold text-primary">
                      {offres.length > MAX_BOUTIQUES ? `Voir les ${offres.length} quincailleries et réserver` : "Réserver"}
                      <ChevronRight className="size-4" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
