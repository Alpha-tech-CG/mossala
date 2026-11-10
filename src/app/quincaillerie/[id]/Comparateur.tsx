"use client";

import { useState } from "react";
import { Check, Clock, MapPin, Navigation, Phone, TrendingDown } from "lucide-react";
import { ChoixLieu, useLieu } from "@/components/ChoixLieu";
import { fcfa, libelleProximite, offresProduit, prixOffre, type Produit } from "@/lib/data";
import { Reservation } from "./Reservation";

/**
 * Choix de la quincaillerie pour un produit : les boutiques de la ville du client,
 * les plus proches d'abord (ou les moins chères), avec le prix de chacune.
 */
export function Comparateur({ p }: { p: Pick<Produit, "id" | "unite"> }) {
  const lieu = useLieu();
  const [tri, setTri] = useState<"proche" | "prix">("proche");
  const liste = offresProduit(p.id, lieu, tri);
  const [choix, setChoix] = useState<string | null>(null);

  const prix = liste.map(prixOffre);
  const min = Math.min(...prix);
  const max = Math.max(...prix);
  const memePrix = liste.length > 0 && min === max;
  const plusProche = offresProduit(p.id, lieu, "proche")[0];
  const choisie = liste.find((of) => of.boutique === choix) ?? liste[0];

  return (
    <div className="mt-6">
      <h2 className="font-bold">Choisissez votre quincaillerie</h2>
      <ChoixLieu compact className="mt-3" />

      {!liste.length ? (
        <p className="mt-4 rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
          Ce produit n’est pas encore proposé par une quincaillerie partenaire à {lieu.ville}. Essayez une autre ville.
        </p>
      ) : (
        <>
          <div className="mt-4 rounded-2xl bg-secondary/60 p-4 text-sm">
            {liste.length === 1 ? (
              <p>
                <strong>Disponible dans 1 quincaillerie</strong> à {lieu.ville} : {fcfa(min)}.
              </p>
            ) : memePrix ? (
              <p>
                <strong>Même prix dans les {liste.length} quincailleries</strong>{" "}
                de {lieu.ville} : {fcfa(min)}. Choisissez simplement la plus proche.
              </p>
            ) : (
              <p>
                <strong>
                  De {fcfa(min)} à {fcfa(max)}
                </strong>{" "}
                selon la quincaillerie, soit jusqu’à <strong>{fcfa(max - min)}</strong> d’écart par {p.unite}.
              </p>
            )}
          </div>

          {!memePrix && liste.length > 1 && (
            <div className="mt-4 flex gap-2" role="group" aria-label="Trier les quincailleries">
              {(
                [
                  ["proche", "Les plus proches", Navigation],
                  ["prix", "Les moins chères", TrendingDown],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setTri(id)}
                  aria-pressed={tri === id}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold ${
                    tri === id ? "border-primary bg-secondary text-primary" : "border-border bg-card"
                  }`}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          )}

          <ul className="mt-3 space-y-2.5" role="radiogroup" aria-label="Quincailleries">
            {liste.map((of) => {
              const actif = of.boutique === choisie?.boutique;
              const moinsChere = !memePrix && prixOffre(of) === min;
              const procheBadge = of.boutique === plusProche?.boutique;
              return (
                <li key={of.boutique}>
                  <button
                    role="radio"
                    aria-checked={actif}
                    onClick={() => setChoix(of.boutique)}
                    className={`flex w-full items-start gap-3 rounded-2xl border-2 bg-card p-4 text-left transition ${
                      actif ? "border-primary shadow-md" : "border-transparent shadow-sm ring-1 ring-black/[0.04]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        actif ? "border-primary bg-primary text-white" : "border-border"
                      }`}
                    >
                      {actif && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{of.b.nom}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {of.b.quartier}
                        {of.distance < 2 && <> · {libelleProximite(of.b, lieu)}</>}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {procheBadge && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-primary">
                            La plus proche
                          </span>
                        )}
                        {moinsChere && (
                          <span className="rounded-full bg-success px-2 py-0.5 text-[11px] font-bold text-white">
                            Meilleur prix
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            of.stock > 10 ? "bg-muted text-muted-foreground" : "bg-accent/20 text-accent-ink"
                          }`}
                        >
                          {of.stock > 10 ? "En stock" : `Plus que ${of.stock}`}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-lg font-bold text-primary">{fcfa(prixOffre(of))}</span>
                      {of.promo && <span className="block text-xs text-muted-foreground line-through">{fcfa(of.prix)}</span>}
                      {!memePrix && prixOffre(of) > min && (
                        <span className="block text-[11px] text-muted-foreground">+{fcfa(prixOffre(of) - min)}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {choisie && (
            <div className="mt-5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Retrait chez</p>
              <p className="mt-0.5 font-bold">{choisie.b.nom}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" /> {choisie.b.adresse}, {choisie.b.quartier}, {choisie.b.ville}
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4 shrink-0" /> {choisie.b.horaires}
              </p>
              <a
                href={`tel:${choisie.b.telephone.replace(/\s/g, "")}`}
                className="mt-2 flex items-center gap-2 text-sm font-bold text-primary"
              >
                <Phone className="size-4" /> {choisie.b.telephone}
              </a>
              <p className="mt-2 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                Prix indicatif, à confirmer en boutique
              </p>
              <Reservation
                key={choisie.boutique}
                prix={prixOffre(choisie)}
                stock={choisie.stock}
                unite={p.unite}
                boutique={choisie.b.nom}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
