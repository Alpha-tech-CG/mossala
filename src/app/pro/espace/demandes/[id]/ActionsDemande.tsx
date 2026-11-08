"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, CheckCircle2, MessageCircle, Phone, XCircle } from "lucide-react";
import { semaine } from "@/lib/pro-data";

const creneaux = ["08h00", "10h00", "14h00", "16h00"];

/** Actions de l'artisan sur une demande : rappeler, WhatsApp, proposer un créneau, décliner. */
export function ActionsDemande({
  prenom,
  telephone,
  statutInitial,
}: {
  prenom: string;
  telephone: string;
  statutInitial: "nouvelle" | "repondue" | "declinee";
}) {
  const [statut, setStatut] = useState(statutInitial);
  const [rdvOuvert, setRdvOuvert] = useState(false);
  const [jour, setJour] = useState(semaine[0].jour);
  const [heure, setHeure] = useState(creneaux[0]);
  const [rdv, setRdv] = useState<string | null>(null);
  const tel = telephone.replace(/\s/g, "");

  if (statut === "declinee")
    return (
      <div className="mt-5 rounded-2xl bg-card p-5 text-center shadow-sm ring-1 ring-black/[0.03]">
        <XCircle className="mx-auto size-10 text-muted-foreground" />
        <p className="mt-2 font-bold">Demande déclinée</p>
        <p className="mt-1 text-sm text-muted-foreground">{prenom} est prévenu(e) et peut contacter un autre artisan.</p>
        <button onClick={() => setStatut("nouvelle")} className="mt-3 text-sm font-semibold text-primary">
          Annuler
        </button>
      </div>
    );

  return (
    <div className="mt-5 space-y-3">
      {rdv && (
        <p className="flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-sm font-semibold text-success">
          <CheckCircle2 className="size-5 shrink-0" /> Rendez-vous proposé : {rdv}. {prenom} le reçoit par SMS et
          l’ajoute à votre agenda en confirmant.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={`tel:${tel}`}
          onClick={() => setStatut("repondue")}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground"
        >
          <Phone className="size-5" /> Rappeler
        </a>
        <a
          href={`https://wa.me/${tel.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => setStatut("repondue")}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 font-bold text-white"
        >
          <MessageCircle className="size-5" /> WhatsApp
        </a>
      </div>

      {!rdvOuvert ? (
        <button
          onClick={() => setRdvOuvert(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-4 font-bold"
        >
          <CalendarPlus className="size-5 text-primary" /> Proposer un rendez-vous
        </button>
      ) : (
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
          <p className="text-sm font-semibold">Jour</p>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {semaine.map((j) => (
              <button
                key={j.jour}
                onClick={() => setJour(j.jour)}
                aria-pressed={jour === j.jour}
                className={`flex w-12 shrink-0 flex-col items-center rounded-xl py-2 ${
                  jour === j.jour ? "bg-primary text-white" : "bg-background ring-1 ring-border"
                }`}
              >
                <span className="text-[11px]">{j.court}</span>
                <span className="font-bold">{j.num}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold">Heure</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {creneaux.map((h) => (
              <button
                key={h}
                onClick={() => setHeure(h)}
                aria-pressed={heure === h}
                className={`rounded-xl py-2.5 text-sm font-semibold ${
                  heure === h ? "bg-primary text-white" : "bg-background ring-1 ring-border"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const j = semaine.find((s) => s.jour === jour)!;
              setRdv(`${j.court}. ${j.num} nov. à ${heure}`);
              setRdvOuvert(false);
              setStatut("repondue");
            }}
            className="mt-4 w-full rounded-xl bg-primary py-3.5 font-bold text-primary-foreground"
          >
            Envoyer la proposition
          </button>
        </div>
      )}

      <button
        onClick={() => setStatut("declinee")}
        className="w-full py-3 text-sm font-semibold text-muted-foreground hover:text-destructive"
      >
        Décliner cette demande
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Vous fixez librement votre prix avec le client. <Link href="/pro" className="underline">Aucune commission</Link>.
      </p>
    </div>
  );
}
