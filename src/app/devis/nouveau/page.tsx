import type { Metadata } from "next";
import { Suspense } from "react";
import { BackHeader } from "@/components/ui";
import { DevisForm } from "./DevisForm";

export const metadata: Metadata = { title: "Demander un devis — Artico" };

export default function NouveauDevis() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-4 pb-10 md:pt-8">
      <BackHeader title="Demande de devis" href="/recherche" />
      <Suspense>
        <DevisForm />
      </Suspense>
    </div>
  );
}
