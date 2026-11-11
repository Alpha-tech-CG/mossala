"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, FileText, Printer, Store, X } from "lucide-react";
import { useState } from "react";
import { TableauDevis } from "@/components/devis/TableauDevis";
import { erreurSupabase } from "@/lib/backend/supabase";
import { fcfa } from "@/lib/data";
import { libelleStatut, libelleStatutClient, repondreDevis, totalDevis, useDemandesDevis, type DemandeDevis } from "@/lib/devis";

function Vignette({ d }: { d: DemandeDevis }) {
  return d.pro.image ? (
    <Image src={d.pro.image} alt="" width={48} height={48} className="size-12 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white">
      {d.pro.type === "boutique" ? <Store className="size-5" /> : d.pro.nom[0]}
    </span>
  );
}

/** Demandes de devis du client et devis reçus (?d=id pour en ouvrir un). */
export function MesDevis() {
  const demandes = useDemandesDevis();
  const sp = useSearchParams();
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const repondre = (id: string, accepte: boolean) => {
    setErreur("");
    repondreDevis(id, accepte).catch((e) => setErreur(erreurSupabase(e)));
  };

  if (!demandes) return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-card" aria-busy />;

  const d = demandes.find((x) => x.id === sp.get("d"));
  if (d) {
    return (
      <div className="mt-5 space-y-4">
        <button onClick={() => router.replace("/devis", { scroll: false })} className="flex items-center gap-2 text-sm font-bold text-primary print:hidden">
          <ArrowLeft className="size-4" /> Tous mes devis
        </button>
        {d.devis && d.statut !== "brouillon" ? (
          <>
            <TableauDevis demande={d} devis={d.devis} />
            {erreur && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive print:hidden">{erreur}</p>}
            <div className="flex flex-col gap-2 print:hidden sm:flex-row">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-bold"
              >
                <Printer className="size-4" /> Imprimer / PDF
              </button>
              {d.statut === "envoyee" && (
                <>
                  <button
                    onClick={() => repondre(d.id, false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm font-bold text-destructive"
                  >
                    <X className="size-4" /> Refuser
                  </button>
                  <button
                    onClick={() => repondre(d.id, true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground"
                  >
                    <Check className="size-4" /> Accepter ce devis
                  </button>
                </>
              )}
              {d.statut === "acceptee" && (
                <p className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success/10 py-3 text-sm font-bold text-success">
                  <Check className="size-4" /> Vous avez accepté ce devis. {d.pro.nom} va vous recontacter.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <p className="font-bold">{d.pro.nom}</p>
            <p className="mt-2 text-sm whitespace-pre-wrap">{d.texte}</p>
            <p className="mt-4 rounded-xl bg-secondary p-3 text-sm text-primary">
              {d.statut === "declinee"
                ? `${d.pro.nom} ne peut pas répondre à cette demande${d.motifDeclin ? ` : « ${d.motifDeclin} »` : "."}`
                : "Votre demande a bien été reçue. Le devis détaillé apparaîtra ici dès qu’il sera envoyé."}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!demandes.length) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
        <FileText className="size-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-bold">Aucune demande de devis</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Sur le profil d’un artisan ou d’une quincaillerie, touchez « Demander un devis » et décrivez votre besoin avec
          vos mots.
        </p>
        <Link href="/recherche" className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground">
          Trouver un artisan
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-5 grid gap-3 md:grid-cols-2">
      {demandes.map((x) => {
        const cls = libelleStatut[x.statut][1];
        const visible = x.devis && x.statut !== "brouillon";
        return (
          <li key={x.id}>
            <Link
              href={`/devis?d=${x.id}`}
              scroll={false}
              className={`group flex h-full flex-col rounded-2xl bg-card p-4 shadow-sm ring-1 transition hover:shadow-md ${
                x.statut === "envoyee" ? "ring-2 ring-primary" : "ring-black/[0.03]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Vignette d={x} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{x.pro.nom}</p>
                  <p className="truncate text-xs text-muted-foreground">{x.pro.sous}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{libelleStatutClient[x.statut]}</span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{x.texte}</p>
              <p className="mt-auto flex items-center justify-between pt-3 text-sm font-bold text-primary">
                <span className="text-lg">{visible ? fcfa(totalDevis(x.devis!)) : ""}</span>
                <span className="flex items-center gap-1">
                  {visible ? "Voir le devis" : "Voir la demande"}
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
