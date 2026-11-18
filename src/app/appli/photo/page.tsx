import type { Metadata } from "next";
import { Suspense } from "react";
import { artisansInscrits } from "@/lib/backend/serveur";
import { artisans } from "@/lib/data";
import { DevisPhoto } from "./DevisPhoto";

export const metadata: Metadata = { title: "Devis en photo — Artopif" };

export default function DevisPhotoPage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[70vh] max-w-xl" />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const inscrits = await artisansInscrits();
  return <DevisPhoto artisans={[...inscrits, ...artisans]} />;
}
