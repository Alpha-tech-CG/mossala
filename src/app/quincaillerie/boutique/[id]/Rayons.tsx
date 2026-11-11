"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { useLieu } from "@/components/ChoixLieu";
import { ProduitFallback } from "@/components/ui";
import { fcfa, lienLieu, prixOffre, type Offre, type Produit } from "@/lib/data";
import { Reservation } from "../../[id]/Reservation";

type Rayon = Offre & { p: Produit; meilleurPrix: boolean };

const sansAccents = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Produits d'une quincaillerie, par type, avec son prix ; toucher un produit ouvre la réservation. */
export function Rayons({ boutique, rayons }: { boutique: string; rayons: Rayon[] }) {
  const lieu = useLieu();
  const types = [...new Set(rayons.map((r) => r.p.categorie))];
  const [type, setType] = useState("");
  const [texte, setTexte] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);

  const mots = sansAccents(texte).split(/\s+/).filter(Boolean);
  const liste = rayons.filter(
    (r) =>
      (!type || r.p.categorie === type) &&
      mots.every((m) => sansAccents(`${r.p.nom} ${r.p.marque} ${r.p.categorie}`).includes(m)),
  );
  const groupes = types
    .map((t) => [t, liste.filter((r) => r.p.categorie === t)] as const)
    .filter(([, l]) => l.length);

  if (!rayons.length)
    return (
      <p className="mt-6 rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
        Cette quincaillerie n’a pas encore mis ses produits en ligne. Appelez-la ou demandez-lui un devis.
      </p>
    );

  return (
    <section className="mt-8" aria-labelledby="produits">
      <h2 id="produits" className="font-serif text-2xl">
        Produits et prix <span className="text-base font-normal text-muted-foreground">· {rayons.length}</span>
      </h2>

      <label className="mt-4 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-5 text-primary" />
        <span className="sr-only">Chercher dans cette quincaillerie</span>
        <input
          type="search"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Chercher dans cette quincaillerie"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Type de produit">
        {["", ...types].map((t) => (
          <button
            key={t || "tous"}
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
              type === t ? "border-primary bg-secondary text-primary" : "border-border bg-card"
            }`}
          >
            {t || "Tout"}
          </button>
        ))}
      </div>

      {!groupes.length && <p className="mt-6 text-sm text-muted-foreground">Aucun produit ne correspond.</p>}

      {groupes.map(([t, l]) => (
        <div key={t} className="mt-6">
          <h3 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">{t}</h3>
          <ul className="mt-2 space-y-2.5">
            {l.map((r) => {
              const actif = ouvert === r.produit;
              return (
                <li key={r.produit} id={r.produit} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.04]">
                  <button
                    onClick={() => setOuvert(actif ? null : r.produit)}
                    aria-expanded={actif}
                    className="flex w-full items-center gap-3 p-3 text-left sm:p-4"
                  >
                    <span className="size-16 shrink-0 overflow-hidden rounded-xl">
                      {r.p.image ? (
                        <Image src={r.p.image} alt="" width={128} height={128} className="h-full w-full object-cover" />
                      ) : (
                        <ProduitFallback categorie={r.p.categorie} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug">{r.p.nom}</span>
                      <span className="block text-xs text-muted-foreground">{r.p.marque}</span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {r.meilleurPrix && (
                          <span className="rounded-full bg-success px-2 py-0.5 text-[11px] font-bold text-white">
                            Meilleur prix de la ville
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            r.stock > 10 ? "bg-muted text-muted-foreground" : "bg-accent/20 text-accent-ink"
                          }`}
                        >
                          {r.stock > 10 ? "En stock" : `Plus que ${r.stock}`}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-lg font-bold text-primary">{fcfa(prixOffre(r))}</span>
                      {r.promo && <span className="block text-xs text-muted-foreground line-through">{fcfa(r.prix)}</span>}
                      <span className="block text-[11px] text-muted-foreground">le {r.p.unite}</span>
                    </span>
                  </button>
                  {actif && (
                    <div className="border-t border-border px-4 pb-4">
                      <button
                        onClick={() => setOuvert(null)}
                        className="mt-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                      >
                        <X className="size-3.5" /> Fermer
                      </button>
                      <Reservation prix={prixOffre(r)} stock={r.stock} unite={r.p.unite} boutique={boutique} />
                      <Link
                        href={lienLieu(`/quincaillerie/${r.produit}`, lieu)}
                        className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-primary"
                      >
                        Comparer avec les autres quincailleries <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
