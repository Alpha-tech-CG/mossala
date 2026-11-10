import type { Metadata } from "next";
import { Suspense } from "react";
import { BoiteArtisan } from "./BoiteArtisan";

export const metadata: Metadata = { title: "Mes messages — Espace artisan — Artopif" };

export default function MessagesProPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Les clients qui vous écrivent sur Artopif. Vous êtes aussi prévenu par WhatsApp et SMS à chaque nouveau message.
      </p>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-2xl bg-card" />}>
        <BoiteArtisan />
      </Suspense>
    </div>
  );
}
