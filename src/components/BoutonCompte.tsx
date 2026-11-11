"use client";

import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useCompte } from "@/lib/compte";

/** « Se connecter » pour un visiteur, « Mon compte » une fois connecté. Mène à /profil. */
export function BoutonCompte({ className }: { className: string }) {
  const { inscrit, compte } = useCompte();
  const Icon = inscrit ? UserRound : LogIn;
  return (
    <Link href="/profil" className={className}>
      <Icon className="size-4" />
      {inscrit ? `Mon compte${compte?.prenom ? ` · ${compte.prenom}` : ""}` : "Se connecter"}
    </Link>
  );
}
