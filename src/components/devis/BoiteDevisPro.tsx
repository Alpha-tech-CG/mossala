"use client";

import { useState } from "react";
import { BellRing, ChevronRight, FileText, MapPin } from "lucide-react";
import { fcfa } from "@/lib/data";
import { libelleStatut, totalDevis, useDemandesDevis, type ArticleCatalogue, type StatutDemande, type TypePro } from "@/lib/devis";
import { EditeurDevis } from "./EditeurDevis";

const quand = (t: number) => {
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 60 * 24) return `il y a ${Math.round(min / 60)} h`;
  return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const A_TRAITER: StatutDemande[] = ["nouvelle", "brouillon"];

/** Demandes de devis reçues par un artisan ou une boutique, et l'éditeur pour y répondre. */
export function BoiteDevisPro({ pro, catalogue }: { pro: { type: TypePro; id: string }; catalogue?: ArticleCatalogue[] }) {
  const demandes = useDemandesDevis(pro);
  const [ouverte, setOuverte] = useState<string | null>(null);

  if (!demandes) return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-card" aria-busy />;

  const d = demandes.find((x) => x.id === ouverte);
  if (d) return <EditeurDevis key={d.id} demande={d} catalogue={catalogue} onFermer={() => setOuverte(null)} />;

  const groupes = [
    { t: "À chiffrer", l: demandes.filter((x) => A_TRAITER.includes(x.statut)) },
    { t: "Envoyés", l: demandes.filter((x) => x.statut === "envoyee") },
    { t: "Terminés", l: demandes.filter((x) => !A_TRAITER.includes(x.statut) && x.statut !== "envoyee") },
  ];

  return (
    <div>
      <p className="flex gap-2 rounded-2xl bg-secondary p-4 text-sm text-primary">
        <BellRing className="mt-0.5 size-4 shrink-0" />
        Les clients décrivent leur besoin avec leurs mots. Vous répondez par un devis détaillé : rubriques, quantités, prix
        unitaires et total. Le client le reçoit sur Artopif et par WhatsApp.
      </p>

      {!demandes.length && (
        <div className="mt-6 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
          <FileText className="size-10 text-muted-foreground" />
          <p className="mt-3 font-bold">Aucune demande de devis pour l’instant</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les demandes envoyées depuis votre profil public apparaîtront ici.
          </p>
        </div>
      )}

      {groupes.map(
        (g) =>
          g.l.length > 0 && (
            <section key={g.t} className="mt-7">
              <h2 className="text-sm font-bold text-muted-foreground">
                {g.t} · {g.l.length}
              </h2>
              <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {g.l.map((x) => {
                  const [label, cls] = libelleStatut[x.statut];
                  return (
                    <li key={x.id}>
                      <button
                        onClick={() => setOuverte(x.id)}
                        className="group block w-full rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate font-bold">{x.client.prenom}</p>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" /> {x.quartier} · {quand(x.creeLe)}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm">{x.texte}</p>
                        <p className="mt-3 flex items-center justify-between gap-1 text-sm font-bold text-primary">
                          <span>{x.devis ? fcfa(totalDevis(x.devis)) : ""}</span>
                          <span className="flex items-center gap-1">
                            {A_TRAITER.includes(x.statut) ? "Faire le devis" : "Voir"}
                            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}
