import type { Realisation } from "../data";

/** Ligne de la table `realisations` (supabase/migrations/0001_socle.sql). */
export type LigneRealisation = {
  id: string;
  titre: string;
  type: string;
  quartier: string;
  description: string;
  materiaux: string;
  duree: string;
  date: string | null;
  photos: string[];
  verifiee: boolean;
};

export const versRealisation = (r: LigneRealisation): Realisation => ({
  id: r.id,
  titre: r.titre,
  type: r.type,
  quartier: r.quartier,
  description: r.description,
  materiaux: r.materiaux,
  duree: r.duree,
  date: r.date ?? undefined,
  image: r.photos[0],
  photos: r.photos,
  verifiee: r.verifiee,
});
