"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarX, Clock, Inbox, MapPin } from "lucide-react";
import { JOUR_DEMO, type RendezVous, demandes, rendezVous, semaine } from "@/lib/pro-data";

const statutStyle: Record<RendezVous["statut"], [string, string]> = {
  confirme: ["Confirmé", "bg-success/10 text-success"],
  "en-cours": ["En cours", "bg-accent/10 text-accent-ink"],
  "a-preparer": ["À préparer", "bg-secondary text-primary"],
};

const NOMS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export function Agenda() {
  const [jour, setJour] = useState(JOUR_DEMO);
  const liste = rendezVous.filter((r) => r.jour === jour);
  const i = semaine.findIndex((s) => s.jour === jour);
  const aConfirmer = demandes.filter((d) => d.statut === "nouvelle").length;

  return (
    <>
      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-7 md:px-0">
        {semaine.map((s) => {
          const nb = rendezVous.filter((r) => r.jour === s.jour).length;
          const actif = s.jour === jour;
          return (
            <button
              key={s.jour}
              onClick={() => setJour(s.jour)}
              aria-pressed={actif}
              className={`flex w-14 shrink-0 flex-col items-center rounded-2xl py-3 transition md:w-auto ${
                actif ? "bg-primary text-white shadow-md" : "bg-card shadow-sm ring-1 ring-black/[0.03]"
              }`}
            >
              <span className={`text-xs ${actif ? "text-white/80" : "text-muted-foreground"}`}>{s.court}</span>
              <span className="mt-0.5 text-lg font-bold">{s.num}</span>
              <span className={`mt-1 size-1.5 rounded-full ${nb ? (actif ? "bg-white" : "bg-accent") : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      {aConfirmer > 0 && (
        <Link
          href="/pro/espace/demandes"
          className="mt-5 flex items-center gap-3 rounded-2xl bg-accent/10 p-4 text-sm ring-1 ring-accent/30"
        >
          <Inbox className="size-5 shrink-0 text-accent-ink" />
          <span className="flex-1">
            <strong>{aConfirmer} demande{aConfirmer > 1 ? "s" : ""} à traiter</strong> avant de compléter votre agenda
          </span>
          <span className="font-bold text-accent-ink">Voir</span>
        </Link>
      )}

      <h2 className="mt-7 font-bold capitalize">
        {NOMS[i]} {semaine[i].num} novembre
      </h2>
      {liste.length ? (
        <ol className="mt-3 space-y-3">
          {liste.map((r) => {
            const [label, cls] = statutStyle[r.statut];
            return (
              <li key={r.id} className="flex gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
                <div className="w-14 shrink-0 border-r border-border pr-3 text-center">
                  <p className="font-bold">{r.heure}</p>
                  <p className="flex items-center justify-center gap-0.5 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {r.duree}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-snug">{r.titre}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" /> {r.lieu} · {r.client}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-3 rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-black/[0.03]">
          <CalendarX className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-2 font-bold">Journée libre</p>
          <p className="mt-1 text-sm text-muted-foreground">Restez disponible pour recevoir de nouvelles demandes.</p>
        </div>
      )}
    </>
  );
}
