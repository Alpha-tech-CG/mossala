import type { Metadata } from "next";
import { Suspense } from "react";
import { BackHeader } from "@/components/ui";
import { MesDevis } from "./MesDevis";

export const metadata: Metadata = { title: "Mes devis — Artopif" };

export default function DevisRecus() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-10 md:pt-8">
      <div className="print:hidden">
        <BackHeader title="Mes devis" />
        <p className="mt-3 text-sm text-muted-foreground">
          Vos demandes aux artisans et aux quincailleries, et les devis détaillés qu’ils vous ont envoyés.
        </p>
      </div>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-2xl bg-card" />}>
        <MesDevis />
      </Suspense>
    </div>
  );
}
