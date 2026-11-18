"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, ChevronRight, ImagePlus, LoaderCircle, MapPin, Search, Star, X } from "lucide-react";
import { Avatar, MetierIcon, VerifiedBadge } from "@/components/ui";
import { useCompte } from "@/lib/compte";
import { type Artisan, type Metier, metierLabel, metiers } from "@/lib/data";
import { PHOTOS_MAX, deposerBrouillon } from "@/lib/photos-devis";
import { CENTRES_QUARTIERS, distanceArtisan, libelleDistance } from "@/lib/proximite";
import { compresserPhoto } from "@/lib/realisations";

const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

type Etape = "photos" | "metier" | "artisan";

/**
 * Devis en photo (application mobile) : on photographie le problème, on choisit le métier,
 * puis l'artisan (les plus proches d'abord). Le formulaire de devis s'ouvre avec les photos.
 */
export function DevisPhoto({ artisans }: { artisans: Artisan[] }) {
  const router = useRouter();
  const { compte } = useCompte();
  const [etape, setEtape] = useState<Etape>("photos");
  const [photos, setPhotos] = useState<string[]>([]);
  const [texte, setTexte] = useState("");
  const [metier, setMetier] = useState<Metier | null>(null);
  const [quartier, setQuartier] = useState(compte?.quartier && CENTRES_QUARTIERS[compte.quartier] ? compte.quartier : "");
  const [erreur, setErreur] = useState("");

  const choisirArtisan = (a: Artisan) => {
    if (!deposerBrouillon({ photos, texte })) {
      setErreur("Photos trop lourdes pour être gardées. Retirez-en une et réessayez.");
      return;
    }
    router.push(`/devis/nouveau?artisan=${a.id}`);
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-6">
      <div className="flex items-center gap-3">
        {etape !== "photos" && (
          <button
            type="button"
            aria-label="Étape précédente"
            onClick={() => setEtape(etape === "artisan" ? "metier" : "photos")}
            className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Devis en photo</h1>
          <p className="text-xs font-semibold text-muted-foreground">
            Étape {etape === "photos" ? 1 : etape === "metier" ? 2 : 3} sur 3 ·{" "}
            {etape === "photos" ? "Le problème" : etape === "metier" ? "Le métier" : "L’artisan"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {(["photos", "metier", "artisan"] as Etape[]).map((e, i) => (
          <span
            key={e}
            className={`h-1 flex-1 rounded-full ${i <= ["photos", "metier", "artisan"].indexOf(etape) ? "bg-accent" : "bg-muted"}`}
          />
        ))}
      </div>

      {etape === "photos" && (
        <EtapePhotos
          photos={photos}
          setPhotos={setPhotos}
          texte={texte}
          setTexte={setTexte}
          suivant={() => setEtape("metier")}
        />
      )}
      {etape === "metier" && (
        <EtapeMetier
          artisans={artisans}
          choisir={(m) => {
            setMetier(m);
            setEtape("artisan");
          }}
        />
      )}
      {etape === "artisan" && metier && (
        <EtapeArtisan
          artisans={artisans}
          metier={metier}
          quartier={quartier}
          setQuartier={setQuartier}
          choisir={choisirArtisan}
        />
      )}
      {erreur && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{erreur}</p>}
    </div>
  );
}

function EtapePhotos({
  photos,
  setPhotos,
  texte,
  setTexte,
  suivant,
}: {
  photos: string[];
  setPhotos: (p: string[]) => void;
  texte: string;
  setTexte: (t: string) => void;
  suivant: () => void;
}) {
  const appareil = useRef<HTMLInputElement>(null);
  const galerie = useRef<HTMLInputElement>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const plein = photos.length >= PHOTOS_MAX;

  const ajouter = async (fichiers: FileList | null) => {
    if (!fichiers?.length) return;
    setErreur("");
    setChargement(true);
    try {
      const nouvelles = await Promise.all(
        [...fichiers].slice(0, PHOTOS_MAX - photos.length).map((f) => compresserPhoto(f, 1000)),
      );
      setPhotos([...photos, ...nouvelles]);
    } catch {
      setErreur("Cette photo n’a pas pu être lue. Essayez-en une autre.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="mt-5">
      <p className="text-sm text-muted-foreground">
        Fuite, mur fissuré, panne… Photographiez le problème : l’artisan comprend tout de suite et chiffre plus juste.
      </p>

      {photos.length === 0 ? (
        <button
          type="button"
          onClick={() => appareil.current?.click()}
          className="mt-4 flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-sand bg-card text-primary"
        >
          {chargement ? (
            <LoaderCircle className="size-10 animate-spin" />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg">
              <Camera className="size-9" />
            </span>
          )}
          <span className="text-lg font-bold">Prendre une photo</span>
        </button>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((src, i) => (
            <li key={i} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                aria-label={`Retirer la photo ${i + 1}`}
                onClick={() => setPhotos(photos.filter((_, k) => k !== i))}
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
          {!plein && (
            <li>
              <button
                type="button"
                onClick={() => appareil.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-sand text-xs font-semibold text-primary"
              >
                {chargement ? <LoaderCircle className="size-6 animate-spin" /> : <Camera className="size-6" />}
                Autre photo
              </button>
            </li>
          )}
        </ul>
      )}

      {!plein && (
        <button
          type="button"
          onClick={() => galerie.current?.click()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-card py-3 text-sm font-semibold text-primary ring-1 ring-border"
        >
          <ImagePlus className="size-5" /> Choisir dans la galerie
        </button>
      )}
      <input ref={appareil} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void ajouter(e.target.files).then(() => (e.target.value = ""))} />
      <input ref={galerie} type="file" accept="image/*" multiple hidden onChange={(e) => void ajouter(e.target.files).then(() => (e.target.value = ""))} />

      <label htmlFor="texte-photo" className="mt-5 block text-sm font-semibold">
        En quelques mots (facultatif)
      </label>
      <textarea
        id="texte-photo"
        rows={3}
        maxLength={2000}
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Ex. Le tuyau sous l’évier fuit depuis hier."
        className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring"
      />

      {erreur && <p className="mt-3 text-sm text-destructive">{erreur}</p>}
      <button
        type="button"
        disabled={photos.length === 0}
        onClick={suivant}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground disabled:opacity-40"
      >
        Choisir le métier <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

function EtapeMetier({ artisans, choisir }: { artisans: Artisan[]; choisir: (m: Metier) => void }) {
  const [q, setQ] = useState("");
  // Métiers qui ont au moins un artisan, les plus représentés d'abord.
  const disponibles = useMemo(() => {
    const compte = new Map<string, number>();
    artisans.forEach((a) => compte.set(a.metier, (compte.get(a.metier) ?? 0) + 1));
    return metiers
      .filter((m) => compte.has(m.id))
      .sort((a, b) => (compte.get(b.id) ?? 0) - (compte.get(a.id) ?? 0));
  }, [artisans]);
  const nq = norm(q);
  const liste = nq ? metiers.filter((m) => norm(m.label).includes(nq)) : disponibles;

  return (
    <div className="mt-5">
      <p className="font-bold">Quel métier pour ce travail ?</p>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Plombier, électricien, maçon…"
          className="w-full rounded-xl border border-border bg-white py-3.5 pr-4 pl-12 text-base outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-sm">
        {liste.slice(0, 30).map((m) => {
          const n = artisans.filter((a) => a.metier === m.id).length;
          return (
            <li key={m.id}>
              <button type="button" onClick={() => choisir(m)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <MetierIcon id={m.id} className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{m.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {n ? `${n} artisan${n > 1 ? "s" : ""} disponible${n > 1 ? "s" : ""}` : "Pas encore d’artisan inscrit"}
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
            </li>
          );
        })}
        {liste.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun métier ne correspond.</li>}
      </ul>
    </div>
  );
}

function EtapeArtisan({
  artisans,
  metier,
  quartier,
  setQuartier,
  choisir,
}: {
  artisans: Artisan[];
  metier: Metier;
  quartier: string;
  setQuartier: (q: string) => void;
  choisir: (a: Artisan) => void;
}) {
  const liste = useMemo(() => {
    const duMetier = artisans.filter((a) => a.metier === metier.id);
    if (!quartier) return duMetier.map((a) => ({ a, km: null as number | null })).sort((x, y) => y.a.note - x.a.note);
    const pos = CENTRES_QUARTIERS[quartier];
    return duMetier
      .map((a) => ({ a, km: distanceArtisan(a, pos, quartier) }))
      .sort((x, y) => (x.km ?? 99) - (y.km ?? 99) || y.a.note - x.a.note);
  }, [artisans, metier, quartier]);

  return (
    <div className="mt-5">
      <p className="font-bold">À quel {metierLabel(metier.id).artisan.toLowerCase()} l’envoyer ?</p>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <MapPin className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">Travaux à</span>
        <select
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 font-semibold"
        >
          <option value="">choisir le quartier</option>
          {Object.keys(CENTRES_QUARTIERS).map((q) => (
            <option key={q}>{q}</option>
          ))}
        </select>
      </label>

      {liste.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground">
          Pas encore de {metier.label.toLowerCase()} inscrit sur Artopif. Revenez en arrière pour choisir un métier proche.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {liste.map(({ a, km }) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => choisir(a)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm ring-1 ring-black/[0.03] active:scale-[0.99]"
              >
                <Avatar a={a} className="size-14 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-bold">{a.nom}</span>
                    <VerifiedBadge />
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {a.nbAvis > 0 && (
                      <span className="flex items-center gap-0.5 font-semibold text-foreground">
                        <Star className="size-3.5 fill-star text-star" />
                        {a.note.toLocaleString("fr-FR")}
                      </span>
                    )}
                    <span>{a.quartier}</span>
                  </span>
                  {quartier && <span className={`text-xs font-semibold ${km === 0 ? "text-success" : "text-muted-foreground"}`}>{libelleDistance(km)}</span>}
                </span>
                <span className="shrink-0 rounded-full bg-accent px-3 py-2 text-xs font-bold text-accent-foreground">Choisir</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
