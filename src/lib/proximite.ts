import type { Artisan } from "./data";

/**
 * Proximité dans Brazzaville : centre approximatif de chaque quartier (à quelques centaines
 * de mètres près). Sert à « Artisans près de moi » : on situe le client par le GPS du
 * téléphone, on retrouve son quartier, puis on classe les artisans par distance de leur
 * quartier (ou zéro s'ils interviennent dans le sien).
 */
export const CENTRES_QUARTIERS: Record<string, { lat: number; lng: number }> = {
  "Centre-ville": { lat: -4.2687, lng: 15.2829 },
  Bacongo: { lat: -4.2846, lng: 15.2639 },
  Makélékélé: { lat: -4.2958, lng: 15.2419 },
  "Poto-Poto": { lat: -4.2588, lng: 15.2847 },
  Moungali: { lat: -4.2569, lng: 15.2672 },
  Ouenzé: { lat: -4.2391, lng: 15.2782 },
  Talangaï: { lat: -4.2152, lng: 15.2873 },
  Mfilou: { lat: -4.2686, lng: 15.2203 },
  Madibou: { lat: -4.3203, lng: 15.2236 },
  Djiri: { lat: -4.1734, lng: 15.2731 },
};

export type Position = { lat: number; lng: number };

/** Distance à vol d'oiseau, en km (formule de haversine). */
export function distanceKm(a: Position, b: Position): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Quartier connu le plus proche d'une position, et à quelle distance. */
export function quartierLePlusProche(p: Position): { quartier: string; km: number } {
  let meilleur = { quartier: "Centre-ville", km: Infinity };
  for (const [quartier, c] of Object.entries(CENTRES_QUARTIERS)) {
    const km = distanceKm(p, c);
    if (km < meilleur.km) meilleur = { quartier, km };
  }
  return meilleur;
}

/** Plus de 25 km du quartier le plus proche : le client n'est pas à Brazzaville. */
export const HORS_BRAZZAVILLE_KM = 25;

/**
 * Distance entre le client et un artisan : 0 s'il intervient dans le quartier du client,
 * sinon la distance au plus proche de ses quartiers (le sien et ses zones). null si inconnu.
 */
export function distanceArtisan(a: Artisan, p: Position, quartierClient: string): number | null {
  const lieux = [a.quartier, ...a.zones];
  if (lieux.includes(quartierClient)) return 0;
  const d = lieux
    .map((q) => CENTRES_QUARTIERS[q])
    .filter(Boolean)
    .map((c) => distanceKm(p, c));
  return d.length ? Math.min(...d) : null;
}

/** « dans votre quartier », « à 800 m », « à 3,2 km ». */
export function libelleDistance(km: number | null): string {
  if (km === null) return "distance inconnue";
  if (km === 0) return "intervient dans votre quartier";
  if (km < 1) return `à ${Math.max(100, Math.round(km * 10) * 100)} m`;
  return `à ${km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;
}

/** Position du téléphone (GPS). Rejette avec un message lisible. */
export function positionActuelle(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Votre téléphone ne donne pas sa position."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Position refusée. Autorisez la localisation pour Artopif dans les réglages du téléphone, ou choisissez votre quartier."
              : "Position introuvable pour le moment. Choisissez votre quartier.",
          ),
        ),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  });
}
