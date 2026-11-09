"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { InscriptionClient, OffrePremium } from "@/components/Acces";
import { useCompte } from "@/lib/compte";

export function SouscriptionPremium() {
  const c = useCompte();
  if (!c.pret) return <div className="h-80 animate-pulse rounded-xl bg-muted" />;
  if (!c.inscrit)
    return (
      <>
        <p className="font-serif text-2xl">Commencez par un compte gratuit</p>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Vous pourrez passer Premium ensuite.</p>
        <InscriptionClient />
      </>
    );
  if (c.premium)
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <p className="mt-3 font-serif text-2xl">Vous êtes Premium</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Jusqu’au {c.premiumJusqua?.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}.
        </p>
        <Link
          href="/devis/nouveau"
          className="mt-5 block rounded-xl bg-accent py-4 font-bold text-accent-foreground"
        >
          Décrire mon besoin
        </Link>
        <Link href="/recherche" className="mt-3 block text-sm font-semibold text-muted-foreground">
          Parcourir les artisans
        </Link>
      </div>
    );
  return <OffrePremium />;
}
