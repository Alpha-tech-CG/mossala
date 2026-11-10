import type { Metadata } from "next";
import { Suspense } from "react";
import { BackHeader } from "@/components/ui";
import { BoiteClient } from "./BoiteClient";

export const metadata: Metadata = { title: "Mes messages — Artico" };

export default function Messages() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-12 md:pt-8">
      <BackHeader title="Mes messages" />
      <p className="mt-3 text-sm text-muted-foreground">
        Échangez directement avec les artisans sur Artico. Chaque nouveau message les prévient par WhatsApp et SMS.
      </p>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-card" />}>
        <BoiteClient />
      </Suspense>
    </div>
  );
}
