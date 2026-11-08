import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { getBoutique, produits } from "@/lib/data";
import { BOUTIQUE_DEMO_ID, reservationsBoutique } from "@/lib/pro-data";
import { EspaceBoutique } from "./EspaceBoutique";

export const metadata: Metadata = { title: "Mon espace boutique — ArtisanBrazza" };

export default function BoutiquePage() {
  const b = getBoutique(BOUTIQUE_DEMO_ID);
  return (
    <div className="mx-auto max-w-4xl px-5 pt-5 pb-14 md:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-accent uppercase">Espace boutique</p>
          <h1 className="mt-1 font-serif text-3xl leading-tight">{b.nom}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {b.adresse} · {b.horaires}
          </p>
        </div>
        <Link
          href="/quincaillerie"
          className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-border"
        >
          Voir ma vitrine <ExternalLink className="size-3.5" />
        </Link>
      </div>
      <div className="mt-6">
        <EspaceBoutique reservations={reservationsBoutique} produits={produits.filter((p) => p.boutique === b.id)} />
      </div>
    </div>
  );
}
