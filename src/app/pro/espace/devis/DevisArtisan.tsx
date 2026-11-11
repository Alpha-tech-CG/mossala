"use client";

import { BoiteDevisPro } from "@/components/devis/BoiteDevisPro";
import { useProConnecte } from "@/lib/pro-connecte";

/** Demandes de devis de l'artisan connecté (ou de l'artisan de démonstration). */
export function DevisArtisan() {
  const { id, pret } = useProConnecte("artisan");
  if (!pret) return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-card" aria-busy />;
  return <BoiteDevisPro pro={{ type: "artisan", id }} />;
}
