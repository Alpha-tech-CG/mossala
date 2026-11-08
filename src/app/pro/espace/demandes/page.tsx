import type { Metadata } from "next";
import { BellRing } from "lucide-react";
import { demandes } from "@/lib/pro-data";
import { DemandeCard } from "../shared";

export const metadata: Metadata = { title: "Demandes reçues — ArtisanBrazza" };

export default function Demandes() {
  const groupes = [
    { t: "Nouvelles", l: demandes.filter((d) => d.statut === "nouvelle") },
    { t: "Traitées", l: demandes.filter((d) => d.statut !== "nouvelle") },
  ];
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.3em] text-accent uppercase">Messages clients</p>
      <h1 className="mt-1 font-serif text-3xl">Demandes reçues</h1>
      <p className="mt-3 flex gap-2 rounded-2xl bg-secondary p-4 text-sm text-primary">
        <BellRing className="mt-0.5 size-4 shrink-0" />
        Chaque nouvelle demande vous est aussi envoyée par WhatsApp et SMS.
      </p>
      {groupes.map(
        (g) =>
          g.l.length > 0 && (
            <section key={g.t} className="mt-8">
              <h2 className="text-sm font-bold text-muted-foreground">
                {g.t} · {g.l.length}
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {g.l.map((d) => (
                  <DemandeCard key={d.id} d={d} />
                ))}
              </div>
            </section>
          ),
      )}
    </div>
  );
}
