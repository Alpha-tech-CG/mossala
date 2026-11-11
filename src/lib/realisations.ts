"use client";

import { useSyncExternalStore } from "react";
import type { Realisation } from "./data";

/**
 * Réalisations publiées par les artisans depuis leur espace (photos de chantiers).
 * MAQUETTE : gardées dans le navigateur, photos réduites en JPEG. Avec Supabase : table
 * realisations + photos dans Storage (voir supabase/migrations/0002_devis_realisations.sql).
 */

const CLE = "artico-realisations";

/** Liste publiée par artisan. Absente = l'artisan n'a rien modifié : on montre ses données de départ. */
type Etat = Record<string, Realisation[]>;

let cache: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(CLE) ?? "{}") as Etat;
  } catch {
    cache = {};
  }
  return cache;
}

/** false si le navigateur a refusé (stockage plein : trop de photos). */
function ecrire(e: Etat): boolean {
  let ok = true;
  try {
    localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    ok = false;
  }
  if (ok) {
    cache = e;
    abonnes.forEach((f) => f());
  }
  return ok;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== CLE) return;
    cache = null;
    abonnes.forEach((f) => f());
  });
}

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

/** Réalisations d'un artisan : celles qu'il a publiées, sinon `initiales`. `null` côté serveur. */
export function useRealisations(artisanId: string, initiales: Realisation[]): Realisation[] | null {
  const etat = useSyncExternalStore(abonner, lire, () => null);
  if (!etat) return null;
  return etat[artisanId] ?? initiales;
}

/** Remplace la liste publiée d'un artisan. Renvoie false si l'enregistrement a échoué. */
export function enregistrerRealisations(artisanId: string, liste: Realisation[]): boolean {
  return ecrire({ ...lire(), [artisanId]: liste });
}

/** Réduit une photo (1200 px de large au plus, JPEG) pour l'enregistrer dans la maquette. */
export function compresserPhoto(fichier: File, largeurMax = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const echelle = Math.min(1, largeurMax / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * echelle);
      canvas.height = Math.round(img.height * echelle);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Photo illisible"));
    };
    img.src = url;
  });
}
