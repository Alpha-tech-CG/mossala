import type { Metadata } from "next";
import { BoiteDevisPro } from "@/components/devis/BoiteDevisPro";
import { ARTISAN_DEMO_ID } from "@/lib/pro-data";

export const metadata: Metadata = { title: "Mes devis — Espace artisan Artopif" };

export default function DevisArtisan() {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Chiffrage</p>
      <h1 className="mt-1 mb-4 font-serif text-3xl">Demandes de devis</h1>
      <BoiteDevisPro pro={{ type: "artisan", id: ARTISAN_DEMO_ID }} />
    </div>
  );
}
