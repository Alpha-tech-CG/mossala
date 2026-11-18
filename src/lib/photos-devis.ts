"use client";

/**
 * Demande de devis en photo (application mobile) : les photos prises dans /appli/photo
 * attendent ici le formulaire de devis (/devis/nouveau), le temps de l'onglet.
 */
const CLE = "artopif-devis-photo";

export type BrouillonPhoto = { photos: string[]; texte: string };

/** Nombre maximal de photos jointes à une demande. */
export const PHOTOS_MAX = 3;

export function deposerBrouillon(b: BrouillonPhoto): boolean {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(b));
    return true;
  } catch {
    return false;
  }
}

export function lireBrouillon(): BrouillonPhoto | null {
  try {
    const b = JSON.parse(sessionStorage.getItem(CLE) ?? "null") as BrouillonPhoto | null;
    return b && Array.isArray(b.photos) ? { photos: b.photos.slice(0, PHOTOS_MAX), texte: b.texte ?? "" } : null;
  } catch {
    return null;
  }
}

export function viderBrouillon() {
  try {
    sessionStorage.removeItem(CLE);
  } catch {
    /* rien à faire */
  }
}
