"use client";

import Link from "next/link";
import { ExternalLink, Hourglass } from "lucide-react";
import { majProfilPro } from "@/lib/backend/pros";
import { metierLabel } from "@/lib/data";
import { rechargerProConnecte, useProConnecte } from "@/lib/pro-connecte";
import { ProfilEditor } from "./ProfilEditor";

/**
 * Profil de l'artisan connecté (Supabase). Sans compte pro réel, on affiche `demo`
 * (le profil de démonstration rendu par le serveur).
 */
export function ProfilConnecte({ demo }: { demo: React.ReactNode }) {
  const { pret, pro } = useProConnecte("artisan");
  if (!pret) return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-2xl bg-card" aria-busy />;
  if (!pro) return <>{demo}</>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary font-serif text-2xl text-white shadow">
          {pro.nom[0]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Mon profil</p>
          <h1 className="font-serif text-3xl leading-tight">{pro.nom}</h1>
        </div>
        {pro.statut === "verifie" && (
          <Link
            href={`/artisans/${pro.id}`}
            className="flex basis-full items-center justify-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-border sm:basis-auto"
          >
            Voir mon profil public <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>

      {pro.statut !== "verifie" && (
        <p className="mt-5 flex gap-2 rounded-2xl bg-secondary p-4 text-sm text-primary">
          <Hourglass className="mt-0.5 size-4 shrink-0" />
          {pro.statut === "suspendu"
            ? "Votre profil est suspendu. Contactez l’équipe Artopif."
            : "Notre équipe vérifie votre identité (48 h). Votre profil sera visible des clients dès la vérification ; vous pouvez déjà le compléter."}
        </p>
      )}

      <ProfilEditor
        artisanId={pro.id}
        nom={pro.nom}
        metier={pro.metier ? metierLabel(pro.metier).label : ""}
        description={pro.description}
        zones={pro.zones.length ? pro.zones : [pro.quartier]}
        telephone={pro.telephone_public ?? ""}
        numeroPublic={pro.numero_public}
        realisations={[]}
        avis={[]}
        onSauver={async ({ description, zones, numeroPublic }) => {
          const { sessionActuelle } = await import("@/lib/session");
          const tel = sessionActuelle()?.telephone ?? null;
          await majProfilPro(pro.id, {
            description,
            zones,
            numero_public: numeroPublic,
            telephone_public: numeroPublic ? tel : null,
          });
          await rechargerProConnecte();
        }}
      />
    </div>
  );
}
