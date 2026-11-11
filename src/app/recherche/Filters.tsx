"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Hammer, Search, Users } from "lucide-react";
import { type Quoi, categories, categoriesProduits, getMetier, getVille, metiers, quoiDepuis, villes } from "@/lib/data";

type Opt = { value: string; label: string; group?: string };

/** Métiers proposés dans le filtre : ceux de la catégorie choisie, sinon tous, groupés. */
const optionsMetier = (categorie: string): Opt[] =>
  categories
    .filter((c) => !categorie || c.id === categorie)
    .flatMap((c) =>
      metiers
        .filter((m) => m.categories[0] === c.id || (categorie && m.categories.includes(c.id)))
        .map((m) => ({ value: m.id, label: m.label, group: c.label })),
    );

const filtresFixes: { key: string; label: string; options: Opt[] }[] = [
  {
    key: "dispo",
    label: "Disponibilité",
    options: [
      { value: "aujourdhui", label: "Aujourd’hui" },
      { value: "semaine", label: "Cette semaine" },
    ],
  },
  {
    key: "note",
    label: "Note",
    options: [
      { value: "4.5", label: "4,5+" },
      { value: "4.8", label: "4,8+" },
    ],
  },
];


/** Filtres gardés quand on passe d'un mode à l'autre (le lieu), les autres sont propres à chaque mode. */
const FILTRES: Record<Quoi, string[]> = {
  artisans: ["categorie", "metier", "ville", "quartier", "dispo", "note"],
  materiaux: ["cat", "ville", "quartier"],
};

/** Barre de recherche avec le choix Artisans / Quincaillerie, + puces de filtres. */
export function SearchBar() {
  const params = useSearchParams();
  const router = useRouter();
  const quoi = quoiDepuis(params.get("quoi"));

  const changer = (q: Quoi) => {
    if (q === quoi) return;
    const p = new URLSearchParams();
    for (const k of ["ville", "quartier"]) if (params.get(k)) p.set(k, params.get(k)!);
    if (params.get("q")) p.set("q", params.get("q")!);
    if (q === "materiaux") p.set("quoi", "materiaux");
    router.replace(`/recherche?${p.toString()}`, { scroll: false });
  };

  return (
    <div>
      <div className="mb-3 inline-flex sm:ml-14 rounded-full bg-card p-1 shadow-sm ring-1 ring-border" role="group" aria-label="Que cherchez-vous ?">
        {(
          [
            ["artisans", "Artisans", Users],
            ["materiaux", "Matériaux", Hammer],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => changer(id)}
            aria-pressed={quoi === id}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              quoi === id ? "bg-primary text-white" : "text-muted-foreground"
            }`}
          >
            <Icon className="size-4" /> {id === "materiaux" && <span className="hidden sm:inline">Quincaillerie / </span>}
            {label}
          </button>
        ))}
      </div>
      <form key={quoi} action="/recherche" className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Retour"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <label className="flex flex-1 items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-border focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-5 text-primary" />
          <input
            name="q"
            type="search"
            defaultValue={params.get("q") ?? ""}
            placeholder={quoi === "materiaux" ? "Ciment, peinture, tuyau PVC…" : "Quel artisan cherchez-vous ?"}
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {quoi === "materiaux" && <input type="hidden" name="quoi" value="materiaux" />}
          {FILTRES[quoi].map((k) =>
            params.get(k) ? <input key={k} type="hidden" name={k} value={params.get(k)!} /> : null,
          )}
        </label>
      </form>
    </div>
  );
}

export function FilterChips() {
  const router = useRouter();
  const params = useSearchParams();

  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    // changer de catégorie efface un métier qui n'en fait pas partie
    if (key === "categorie" && p.get("metier")) {
      const m = getMetier(p.get("metier")!);
      if (value && !m?.categories.includes(value as never)) p.delete("metier");
    }
    // changer de ville efface le quartier
    if (key === "ville") p.delete("quartier");
    router.replace(`/recherche?${p.toString()}`, { scroll: false });
  };

  const categorie = params.get("categorie") ?? "";
  const ville = params.get("ville") ?? "";
  const quartiers = getVille(ville || (quoiDepuis(params.get("quoi")) === "materiaux" ? "Brazzaville" : ""))?.quartiers ?? [];
  const lieu = [
    { key: "ville", label: "Ville", options: villes.map((v) => ({ value: v.nom, label: v.nom })) },
    ...(quartiers.length
      ? [{ key: "quartier", label: "Quartier", options: quartiers.map((q) => ({ value: q, label: q })) }]
      : []),
  ];
  const filtres =
    quoiDepuis(params.get("quoi")) === "materiaux"
      ? [{ key: "cat", label: "Type de produit", options: categoriesProduits.map((t) => ({ value: t, label: t })) }, ...lieu]
      : [
          ...lieu,
          {
            key: "categorie",
            label: "Catégorie",
            options: categories.map((c) => ({ value: c.id, label: c.court })),
          },
          { key: "metier", label: "Métier", options: optionsMetier(categorie) },
          ...filtresFixes,
        ];

  return (
    <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-5 pb-1">
      {filtres.map((f) => {
        const v = params.get(f.key) ?? "";
        const active = !!v;
        const current = f.options.find((o) => o.value === v);
        return (
          <label
            key={f.key}
            className={`relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold ${
              active ? "border-primary bg-secondary text-primary" : "border-border bg-card"
            }`}
          >
            {current ? `${f.label} : ${current.label}` : f.label}
            <ChevronDown className="size-4" />
            <select
              aria-label={f.label}
              value={v}
              onChange={(e) => set(f.key, e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="">Tous</option>
              {groupes(f.options).map(([g, opts]) =>
                g ? (
                  <optgroup key={g} label={g}>
                    {opts.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  opts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))
                ),
              )}
            </select>
          </label>
        );
      })}
    </div>
  );
}

/** Regroupe les options par `group` (pour les <optgroup>), en gardant l'ordre. */
function groupes(options: Opt[]): [string, Opt[]][] {
  const out: [string, Opt[]][] = [];
  for (const o of options) {
    const g = o.group ?? "";
    const last = out[out.length - 1];
    if (last && last[0] === g) last[1].push(o);
    else out.push([g, [o]]);
  }
  return out;
}
