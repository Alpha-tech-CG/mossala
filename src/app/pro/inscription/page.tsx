import type { Metadata } from "next";
import { Suspense } from "react";
import { BackHeader } from "@/components/ui";
import { Inscription } from "./Inscription";

export const metadata: Metadata = { title: "Inscription professionnelle — Artopif" };

export default function InscriptionPage() {
  return (
    <div className="mx-auto max-w-xl px-5 pt-4 pb-12 md:pt-8">
      <BackHeader title="Créer mon profil pro" href="/pro" />
      <Suspense>
        <Inscription />
      </Suspense>
    </div>
  );
}
