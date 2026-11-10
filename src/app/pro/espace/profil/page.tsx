import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Hourglass } from "lucide-react";
import { Avatar } from "@/components/ui";
import { getArtisan, metierLabel } from "@/lib/data";
import { ARTISAN_DEMO_ID } from "@/lib/pro-data";
import { ProfilEditor } from "./ProfilEditor";

export const metadata: Metadata = { title: "Mon profil pro — Artopif" };

const verifications = [
  ["Téléphone vérifié", "Téléphone"],
  ["Identité vérifiée", "Identité"],
  ["Références contrôlées", "Références"],
  ["Témoignages vérifiés", "Témoignages"],
] as const;

export default function ProfilPro() {
  const a = getArtisan(ARTISAN_DEMO_ID)!;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar a={a} className="size-16 rounded-2xl shadow" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Mon profil</p>
          <h1 className="font-serif text-3xl leading-tight">{a.nom}</h1>
        </div>
        <Link
          href={`/artisans/${a.id}`}
          className="flex basis-full items-center justify-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-border sm:basis-auto"
        >
          Voir mon profil public <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {/* Vérifications : ce que les clients voient comme badges */}
      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {verifications.map(([badge, court]) => {
          const ok = a.badges.includes(badge);
          return (
            <li
              key={badge}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${ok ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
            >
              {ok ? <BadgeCheck className="size-4 shrink-0" /> : <Hourglass className="size-4 shrink-0" />}
              <span className="min-w-0">
                <span className="block">{court}</span>
                <span className="block font-normal">{ok ? "Vérifié" : "En attente"}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <ProfilEditor
        nom={a.nom}
        metier={metierLabel(a.metier).label}
        description={a.description}
        zones={a.zones}
        telephone={a.telephone}
        numeroPublic={a.numeroPublic}
        realisations={a.realisations}
        avis={a.avis}
      />
    </div>
  );
}
