import type { Metadata } from "next";
import { DevisArtisan } from "./DevisArtisan";

export const metadata: Metadata = { title: "Mes devis — Espace artisan Artopif" };

export default function DevisArtisanPage() {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Chiffrage</p>
      <h1 className="mt-1 mb-4 font-serif text-3xl">Demandes de devis</h1>
      <DevisArtisan />
    </div>
  );
}
