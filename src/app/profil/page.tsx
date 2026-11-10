import type { Metadata } from "next";
import { BackHeader } from "@/components/ui";
import { artisans, metierLabel } from "@/lib/data";
import { MonCompte } from "./MonCompte";

export const metadata: Metadata = { title: "Mon compte — Artopif" };

export default function Page() {
  const annuaire = artisans.map((a) => ({
    id: a.id,
    nom: a.nom,
    metier: metierLabel(a.metier).artisan,
    quartier: a.quartier,
    image: a.image,
  }));
  return (
    <div className="mx-auto max-w-2xl px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Mon compte" />
      <MonCompte annuaire={annuaire} />
    </div>
  );
}
