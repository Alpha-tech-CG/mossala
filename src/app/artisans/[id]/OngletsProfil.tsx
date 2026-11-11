"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { PhotoRealisation } from "@/components/PhotoRealisation";
import { ChevronLeft, ChevronRight, FileText, Images, Star, X } from "lucide-react";
import type { Realisation } from "@/lib/data";
import { useRealisations } from "@/lib/realisations";

const toutesLesPhotos = (r: Realisation) => [r.image, ...(r.photos ?? []).filter((p) => p !== r.image)];

/** Visionneuse plein écran des photos d'une réalisation. */
function Visionneuse({ r, onFermer }: { r: Realisation; onFermer: () => void }) {
  const photos = toutesLesPhotos(r);
  const [i, setI] = useState(0);
  const aller = (pas: number) => setI((x) => (x + pas + photos.length) % photos.length);

  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
      if (e.key === "ArrowRight") setI((x) => (x + 1) % photos.length);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", clavier);
    return () => window.removeEventListener("keydown", clavier);
  }, [onFermer, photos.length]);

  return (
    <div role="dialog" aria-modal aria-label={r.titre} className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-4" onClick={onFermer}>
      <div className="flex items-center justify-between gap-3 text-white">
        <p className="min-w-0 truncate font-bold">
          {r.titre}
          {photos.length > 1 && <span className="ml-2 font-normal text-white/60">{i + 1} / {photos.length}</span>}
        </p>
        <button aria-label="Fermer" onClick={onFermer} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <X className="size-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center py-4" onClick={(e) => e.stopPropagation()}>
        <PhotoRealisation src={photos[i]} alt={`${r.titre}, photo ${i + 1}`} sizes="100vw" className="max-h-full w-auto max-w-full rounded-xl object-contain" />
        {photos.length > 1 && (
          <>
            <button aria-label="Photo précédente" onClick={() => aller(-1)} className="absolute left-0 flex size-11 items-center justify-center rounded-full bg-white/15 text-white">
              <ChevronLeft className="size-6" />
            </button>
            <button aria-label="Photo suivante" onClick={() => aller(1)} className="absolute right-0 flex size-11 items-center justify-center rounded-full bg-white/15 text-white">
              <ChevronRight className="size-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CarteRealisation({ r, artisanId, onOuvrir }: { r: Realisation; artisanId: string; onOuvrir: () => void }) {
  const nb = toutesLesPhotos(r).length;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03]">
      <button onClick={onOuvrir} className="relative block" aria-label={`Voir les photos : ${r.titre}`}>
        <PhotoRealisation src={r.image} alt={r.titre} sizes="(min-width: 768px) 448px, 100vw" className="h-52 w-full object-cover" />
        {nb > 1 && (
          <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
            <Images className="size-3.5" /> {nb} photos
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold">{r.titre}</h3>
          {r.verifiee && (
            <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">Réalisation vérifiée</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{[r.type, r.quartier, r.duree, r.date].filter(Boolean).join(" · ")}</p>
        {r.description && <p className="mt-2 text-sm">{r.description}</p>}
        {r.materiaux && <p className="mt-1 text-xs text-muted-foreground">Matériaux : {r.materiaux}</p>}
        <div className="mt-auto pt-3">
          <Link
            href={`/devis/nouveau?artisan=${artisanId}&similaire=${encodeURIComponent(r.titre)}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary py-2.5 text-sm font-bold text-primary"
          >
            <FileText className="size-4" /> Devis pour un travail similaire
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Onglets du profil public : « Réalisations » (photos des chantiers, publiées par l'artisan
 * depuis son espace) et « Avis ». Les avis sont rendus côté serveur et passés en `avis`.
 */
export function OngletsProfil({
  artisanId,
  realisations,
  nbAvis,
  avis,
}: {
  artisanId: string;
  realisations: Realisation[];
  nbAvis: number;
  avis: React.ReactNode;
}) {
  const liste = useRealisations(artisanId, realisations) ?? realisations;
  // Lien direct vers les avis (…/artisans/x#avis) ; sinon les réalisations d'abord.
  const ancreAvis = useSyncExternalStore(
    (f) => {
      window.addEventListener("hashchange", f);
      return () => window.removeEventListener("hashchange", f);
    },
    () => window.location.hash === "#avis",
    () => false,
  );
  const [choix, setOnglet] = useState<"realisations" | "avis" | null>(null);
  const onglet = choix ?? (ancreAvis ? "avis" : "realisations");
  const [vue, setVue] = useState<Realisation | null>(null);

  const onglets = [
    { id: "realisations" as const, label: "Réalisations", n: liste.length, Icon: Images },
    { id: "avis" as const, label: "Avis", n: nbAvis, Icon: Star },
  ];

  return (
    <section className="mt-8">
      <div role="tablist" aria-label="Profil de l’artisan" className="flex gap-1 border-b border-border">
        {onglets.map(({ id, label, n, Icon }) => {
          const actif = onglet === id;
          return (
            <button
              key={id}
              role="tab"
              id={`onglet-${id}`}
              aria-selected={actif}
              aria-controls={`panneau-${id}`}
              onClick={() => setOnglet(id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors ${
                actif ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" /> {label}
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${actif ? "bg-primary text-white" : "bg-muted"}`}>{n}</span>
              {actif && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="panneau-realisations" aria-labelledby="onglet-realisations" hidden={onglet !== "realisations"} className="mt-5">
        {liste.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {liste.map((r, i) => (
              <CarteRealisation key={`${r.titre}-${i}`} r={r} artisanId={artisanId} onOuvrir={() => setVue(r)} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">Pas encore de réalisation publiée.</p>
        )}
      </div>

      <div role="tabpanel" id="panneau-avis" aria-labelledby="onglet-avis" hidden={onglet !== "avis"} className="mt-5">
        {avis}
      </div>

      {vue && <Visionneuse r={vue} onFermer={() => setVue(null)} />}
    </section>
  );
}
