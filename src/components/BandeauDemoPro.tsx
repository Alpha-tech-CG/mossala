"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { SUPABASE_ACTIF } from "@/lib/backend/supabase";
import { useProConnecte } from "@/lib/pro-connecte";

/** Prévient le visiteur qu'il voit l'espace de démonstration, et propose de se connecter. */
export function BandeauDemoPro({ type }: { type: "artisan" | "boutique" }) {
  const { pret, demo, autreType } = useProConnecte(type);
  if (!SUPABASE_ACTIF || !pret || !demo) return null;
  return (
    <p className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-secondary p-4 text-sm text-primary">
      <Info className="size-4 shrink-0" />
      <span className="flex-1">
        {autreType
          ? `Votre compte est un compte ${autreType === "boutique" ? "boutique" : "artisan"} : ceci est l’espace ${type} de démonstration.`
          : `Vous voyez l’espace ${type} de démonstration.`}
      </span>
      <Link
        href={autreType ? (autreType === "boutique" ? "/pro/boutique" : "/pro/espace") : "/pro/connexion"}
        className="font-bold underline"
      >
        {autreType ? "Aller à mon espace" : "Se connecter à mon espace"}
      </Link>
    </p>
  );
}
