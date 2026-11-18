"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Crosshair, LoaderCircle, MapPin } from "lucide-react";
import { ArtisanCardRow } from "@/components/ui";
import { useCompte } from "@/lib/compte";
import { type Artisan, categories, metierLabel } from "@/lib/data";
import {
  CENTRES_QUARTIERS,
  HORS_BRAZZAVILLE_KM,
  type Position,
  distanceArtisan,
  libelleDistance,
  positionActuelle,
  quartierLePlusProche,
} from "@/lib/proximite";

type Lieu = { position: Position; quartier: string; parGps: boolean };

/**
 * Artisans près de moi (application mobile) : le GPS situe le client dans son quartier de
 * Brazzaville, puis les artisans sont classés du plus proche au plus éloigné.
 * Sans GPS (refusé, ou hors de Brazzaville), on choisit son quartier à la main.
 */
export function Proches({ artisans }: { artisans: Artisan[] }) {
  const { compte } = useCompte();
  const quartierCompte = compte?.quartier && CENTRES_QUARTIERS[compte.quartier] ? compte.quartier : null;
  const [lieuChoisi, setLieu] = useState<Lieu | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [erreur, setErreur] = useState("");
  const [secteur, setSecteur] = useState("tout");

  // Sans position, on part du quartier du compte (s'il est connu).
  const lieu = useMemo<Lieu | null>(
    () =>
      lieuChoisi ??
      (quartierCompte ? { position: CENTRES_QUARTIERS[quartierCompte], quartier: quartierCompte, parGps: false } : null),
    [lieuChoisi, quartierCompte],
  );

  const localiser = async () => {
    setErreur("");
    setRecherche(true);
    try {
      const position = await positionActuelle();
      const { quartier, km } = quartierLePlusProche(position);
      if (km > HORS_BRAZZAVILLE_KM) {
        setErreur("Vous semblez hors de Brazzaville : choisissez le quartier où vous avez besoin d’un artisan.");
      } else {
        setLieu({ position, quartier, parGps: true });
      }
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setRecherche(false);
    }
  };

  const classes = useMemo(() => {
    if (!lieu) return [];
    return artisans
      .filter((a) => secteur === "tout" || metierLabel(a.metier).categorie.id === secteur)
      .map((a) => ({ a, km: distanceArtisan(a, lieu.position, lieu.quartier) }))
      .sort((x, y) => (x.km ?? 99) - (y.km ?? 99) || y.a.note - x.a.note);
  }, [artisans, lieu, secteur]);

  const secteurs = useMemo(() => {
    const ids = new Set(artisans.map((a) => metierLabel(a.metier).categorie.id));
    return categories.filter((c) => ids.has(c.id));
  }, [artisans]);

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold">Près de moi</h1>

      <div className="mt-3 rounded-2xl bg-foreground p-4 text-white">
        {lieu ? (
          <p className="flex items-center gap-2 text-sm">
            <MapPin className="size-5 shrink-0 text-accent" />
            <span>
              {lieu.parGps ? "Vous êtes à" : "Quartier choisi :"} <strong>{lieu.quartier}</strong>
            </span>
          </p>
        ) : (
          <p className="text-sm">Trouvez les artisans les plus proches de chez vous, en un geste.</p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={localiser}
            disabled={recherche}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground disabled:opacity-70"
          >
            {recherche ? <LoaderCircle className="size-5 animate-spin" /> : <Crosshair className="size-5" />}
            {lieu?.parGps ? "Actualiser" : "Me localiser"}
          </button>
          <div className="relative flex-1">
            <select
              aria-label="Choisir un quartier"
              value={lieu && !lieu.parGps ? lieu.quartier : ""}
              onChange={(e) => {
                const q = e.target.value;
                setErreur("");
                setLieu({ position: CENTRES_QUARTIERS[q], quartier: q, parGps: false });
              }}
              className="h-full w-full appearance-none rounded-xl bg-white/10 py-3 pr-9 pl-3 text-sm font-semibold text-white ring-1 ring-white/20"
            >
              <option value="" disabled className="text-foreground">
                Mon quartier…
              </option>
              {Object.keys(CENTRES_QUARTIERS).map((q) => (
                <option key={q} className="text-foreground">
                  {q}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </div>
        </div>
        {erreur && <p className="mt-3 rounded-lg bg-white/10 p-2.5 text-xs">{erreur}</p>}
      </div>

      {lieu && (
        <>
          <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {[{ id: "tout", court: "Tous les métiers" }, ...secteurs].map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={secteur === s.id}
                onClick={() => setSecteur(s.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  secteur === s.id ? "bg-foreground text-white" : "bg-card ring-1 ring-border"
                }`}
              >
                {s.court}
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {classes.length} artisan{classes.length > 1 ? "s" : ""}, du plus proche au plus éloigné
          </p>
          <ul className="mt-2 space-y-3">
            {classes.map(({ a, km }) => (
              <li key={a.id}>
                <p
                  className={`mb-1 flex items-center gap-1 px-1 text-xs font-bold ${
                    km === 0 ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  <MapPin className="size-3.5" /> {libelleDistance(km)}
                </p>
                <ArtisanCardRow a={a} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
