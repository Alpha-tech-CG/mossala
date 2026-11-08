import type { Metadata } from "next";
import { BackHeader } from "@/components/ui";
import { MessagesQuota } from "./MessagesQuota";

export const metadata: Metadata = { title: "Mes messages — ArtisanBrazza" };

export default function Messages() {
  return (
    <div className="mx-auto max-w-xl px-5 pt-4 pb-12 md:pt-8">
      <BackHeader title="Mes messages" />
      <p className="mt-3 text-sm text-muted-foreground">
        L’historique de vos échanges apparaîtra ici une fois votre compte connecté.
      </p>
      <MessagesQuota />
    </div>
  );
}
