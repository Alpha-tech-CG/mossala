import type { Metadata } from "next";
import { Suspense } from "react";
import { filRealisations } from "@/lib/backend/serveur";
import { FilAppli } from "./FilAppli";

export const metadata: Metadata = { title: "Fil des réalisations — Artopif" };

/**
 * Accueil de l'application mobile : le fil des réalisations des artisans, à la manière d'un
 * réseau professionnel. On y voit leurs chantiers en photos, on les note, on les contacte.
 */
export default function AppliPage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[70vh] max-w-xl" />}>
      <Fil />
    </Suspense>
  );
}

async function Fil() {
  const inscrites = await filRealisations();
  return <FilAppli inscrites={inscrites} />;
}
