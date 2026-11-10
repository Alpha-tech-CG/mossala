import type { Metadata } from "next";
import { BackHeader } from "@/components/ui";
import { categories, metiers } from "@/lib/metiers";
import { MetiersExplorer } from "./MetiersExplorer";

export const metadata: Metadata = { title: "Tous les métiers — Artopif" };

export default function MetiersPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-12 md:pt-8">
      <BackHeader title="Tous les métiers" />
      <p className="mt-3 text-sm text-muted-foreground">
        {metiers.length} métiers répartis en {categories.length} catégories. Touchez un métier pour
        voir les artisans disponibles.
      </p>
      <MetiersExplorer />
    </div>
  );
}
