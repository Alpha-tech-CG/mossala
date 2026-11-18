import type { Metadata } from "next";
import { Suspense } from "react";
import { artisansInscrits } from "@/lib/backend/serveur";
import { artisans } from "@/lib/data";
import { Proches } from "./Proches";

export const metadata: Metadata = { title: "Artisans près de moi — Artopif" };

export default function ProchesPage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[70vh] max-w-xl" />}>
      <Liste />
    </Suspense>
  );
}

async function Liste() {
  const inscrits = await artisansInscrits();
  return <Proches artisans={[...inscrits, ...artisans]} />;
}
