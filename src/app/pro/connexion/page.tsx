import type { Metadata } from "next";
import { BackHeader } from "@/components/ui";
import { ConnexionPro } from "./ConnexionPro";

export const metadata: Metadata = { title: "Connexion professionnels — Artopif" };

export default function Page() {
  return (
    <div className="mx-auto max-w-md px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Espace professionnels" href="/pro" />
      <ConnexionPro />
    </div>
  );
}
