"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Plus, Search } from "lucide-react";
import { CategorieIcon, MetierIcon } from "@/components/ui";
import { categories, slug } from "@/lib/metiers";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function MetiersExplorer() {
  const [q, setQ] = useState("");
  const n = norm(q.trim());
  const visibles = categories
    .map((c) => ({ ...c, metiers: n ? c.metiers.filter((m) => norm(m).includes(n)) : c.metiers }))
    .filter((c) => c.metiers.length);

  return (
    <>
      {/* Barre collante : recherche + raccourcis vers chaque secteur */}
      <div className="sticky top-16 z-20 -mx-5 mt-5 bg-background/90 px-5 pt-1 pb-3 backdrop-blur-md">
        <label className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-5 text-primary" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un métier : tresseuse, soudeur…"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </label>
        {!n && (
          <nav aria-label="Secteurs" className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-border transition hover:bg-primary hover:text-white"
              >
                <CategorieIcon id={c.id} className="size-3.5" />
                {c.court}
              </a>
            ))}
          </nav>
        )}
      </div>

      <div className="mt-4 space-y-10">
        {visibles.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-52">
            {/* En-tête du secteur */}
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white">
                <CategorieIcon id={c.id} className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg leading-tight font-bold">{c.label}</h2>
                <p className="text-xs text-muted-foreground">
                  {c.metiers.length} métier{c.metiers.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {/* Grille d'icônes, même style que l'accueil */}
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {c.metiers.map((m) => (
                <li key={m}>
                  <Link
                    href={`/recherche?metier=${slug(m)}`}
                    className="group flex h-full flex-col items-center gap-2 rounded-2xl bg-card px-2 py-4 text-center shadow-sm ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <MetierIcon id={slug(m)} className="size-6" />
                    </span>
                    <span className="line-clamp-3 text-[12px] leading-tight font-semibold md:text-[13px]">
                      {m}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!visibles.length && (
          <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
            Aucun métier ne correspond à « {q} ». Proposez-le ci-dessous.
          </p>
        )}
      </div>

      <ProposerMetier initial={visibles.length ? "" : q} key={visibles.length ? "a" : q} />
    </>
  );
}

/** « Possibilité d'en ajouter » : un artisan ou un client propose un métier manquant. */
function ProposerMetier({ initial }: { initial: string }) {
  const [envoye, setEnvoye] = useState(false);
  return (
    <section id="proposer" className="mt-10 rounded-2xl bg-foreground p-6 text-white md:p-8">
      <p className="text-[10px] font-semibold tracking-[0.3em] text-accent uppercase">
        Votre métier n’est pas dans la liste ?
      </p>
      <h2 className="mt-2 font-serif text-3xl">Proposez un métier</h2>
      {envoye ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-white/85">
          <CheckCircle2 className="size-5 text-success" /> Merci ! Notre équipe l’ajoutera à la liste
          après vérification.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO Supabase : enregistrer la proposition pour validation dans le back-office
            setEnvoye(true);
          }}
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
        >
          <input
            required
            defaultValue={initial}
            placeholder="Nom du métier"
            aria-label="Nom du métier"
            className="w-full min-w-0 rounded-xl bg-white px-4 py-3.5 text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent"
          />
          <select
            required
            defaultValue=""
            aria-label="Catégorie"
            className="w-full min-w-0 rounded-xl bg-white px-4 py-3.5 text-foreground outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="" disabled>
              Catégorie
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-bold sm:col-span-2 lg:col-span-1">
            <Plus className="size-5" /> Proposer
          </button>
        </form>
      )}
    </section>
  );
}
