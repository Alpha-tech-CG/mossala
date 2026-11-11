"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { BoiteMessages } from "@/components/Messagerie";
import { useProConnecte } from "@/lib/pro-connecte";

/** Messagerie côté artisan : celui qui est connecté, sinon l'artisan de démonstration. */
export function BoiteArtisan() {
  const { id: artisanId, pret } = useProConnecte("artisan");
  if (!pret) return <div className="mt-6 h-96 animate-pulse rounded-2xl bg-card" aria-busy />;
  return (
    <BoiteMessages
      cote="artisan"
      artisanId={artisanId}
      vide={
        <div className="mt-6 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
          <MessagesSquare className="size-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Aucun message pour le moment</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Pour tester : ouvrez votre fiche publique et cliquez sur « Contactez », puis « Laisser un message ».
          </p>
          <Link
            href={`/artisans/${artisanId}`}
            className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground"
          >
            Voir ma fiche publique
          </Link>
        </div>
      }
    />
  );
}
