import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Clock, MapPin, Phone, Store, TrendingDown } from "lucide-react";
import { BackHeader, ProduitCard } from "@/components/ui";
import { ChoixLieu } from "@/components/ChoixLieu";
import {
  boutiques,
  categoriesProduits,
  lienLieu,
  libelleProximite,
  lieuDepuis,
  offres,
  offresProduit,
  prixOffre,
  produits,
  proximite,
  type Lieu,
} from "@/lib/data";

export const metadata: Metadata = { title: "Quincaillerie — Artico" };

export default function QuincailleriePage(props: PageProps<"/quincaillerie">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-6xl" />}>
      <Quincaillerie searchParams={props.searchParams} />
    </Suspense>
  );
}

/** Boutiques de la ville, de la plus proche à la plus lointaine, avec leurs meilleurs prix. */
function boutiquesDeLaVille(lieu: Lieu) {
  return boutiques
    .filter((b) => b.ville === lieu.ville)
    .map((b) => {
      const siennes = offres.filter((of) => of.boutique === b.id);
      const meilleursPrix = siennes.filter((of) => {
        const min = Math.min(...offresProduit(of.produit, lieu).map(prixOffre));
        return prixOffre(of) === min;
      }).length;
      return { b, nbProduits: siennes.length, meilleursPrix, distance: proximite(b, lieu) };
    })
    .sort((x, y) => x.distance - y.distance || y.meilleursPrix - x.meilleursPrix);
}

async function Quincaillerie(props: Pick<PageProps<"/quincaillerie">, "searchParams">) {
  const sp = await props.searchParams;
  const cat = typeof sp.cat === "string" && categoriesProduits.includes(sp.cat) ? sp.cat : undefined;
  const lieu = lieuDepuis(sp);
  const types = cat ? [cat] : categoriesProduits;
  const shops = boutiquesDeLaVille(lieu);
  const ou = lieu.quartier ? `${lieu.quartier}, ${lieu.ville}` : lieu.ville;

  return (
    <div className="mx-auto max-w-6xl pt-4 pb-10 md:pt-8">
      <div className="px-5">
        <BackHeader title="Quincaillerie" />
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Comparez les prix des quincailleries de votre ville, choisissez la plus proche ou la moins chère, et
          réservez : vous payez le montant exact au retrait.
        </p>
        <ChoixLieu types={categoriesProduits} className="mt-5" />
      </div>

      {/* Produits classés par type */}
      {types.map((t) => {
        const liste = produits.filter((p) => p.categorie === t);
        if (!liste.length) return null;
        return (
          <section key={t} className="mt-8 px-5" aria-labelledby={`type-${t}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`type-${t}`} className="font-serif text-2xl">
                {t} <span className="text-base font-normal text-muted-foreground">· {liste.length}</span>
              </h2>
              {!cat && (
                <Link
                  href={lienLieu("/quincaillerie", lieu, { cat: t })}
                  scroll={false}
                  className="flex shrink-0 items-center text-sm font-semibold text-primary"
                >
                  Voir tout <ChevronRight className="size-4" />
                </Link>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {liste.map((p) => (
                <ProduitCard key={p.id} p={p} lieu={lieu} wide />
              ))}
            </div>
          </section>
        );
      })}

      {/* Quincailleries proches */}
      <section className="mt-12 px-5" aria-labelledby="boutiques">
        <h2 id="boutiques" className="font-serif text-2xl">
          Quincailleries près de vous
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {shops.length
            ? `Les plus proches de ${ou} en premier.`
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
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {shops.map(({ b, nbProduits, meilleursPrix, distance }) => (
            <article key={b.id} className="flex flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">{b.nom}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    distance === 0 ? "bg-success text-white" : distance === 1 ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {distance === 2 ? b.quartier : libelleProximite(b, lieu)}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" /> {b.adresse}, {b.quartier}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" /> {b.horaires}
              </p>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>
                  <strong>{nbProduits}</strong> produits
                </span>
                {meilleursPrix > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-success">
                    <TrendingDown className="size-4" /> Meilleur prix sur {meilleursPrix} produit
                    {meilleursPrix > 1 ? "s" : ""}
                  </span>
                )}
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
