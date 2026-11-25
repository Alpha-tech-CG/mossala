"use client";

import Link from "next/link";
import { useState } from "react";
import { CornerDownRight, ExternalLink, Eye, EyeOff, Trash2 } from "lucide-react";
import type { CommentaireDoc } from "@/lib/backend/modele";
import { Action, Carte, Filtres, Pastille, Vide, correspond, dateHeure } from "./Panneaux";
import type { Agir } from "./Panneaux";
import { dateCsv, telechargerCsv } from "./csv";

export function PanneauCommentaires({ commentaires, agir }: { commentaires: CommentaireDoc[]; agir: Agir }) {
  const [filtre, setFiltre] = useState<"visible" | "masque" | "tous">("visible");
  const [recherche, setRecherche] = useState("");
  const liste = commentaires.filter(
    (c) => (filtre === "tous" || c.statut === filtre) && correspond(recherche, c.auteurNom, c.texte, c.proId),
  );

  return (
    <div className="space-y-4">
      <Filtres
        valeur={filtre}
        onChange={setFiltre}
        recherche={recherche}
        onRecherche={setRecherche}
        exporter={() =>
          telechargerCsv(
            "commentaires",
            liste.map((c) => ({
              date: dateCsv(c.creeLe),
              statut: c.statut,
              auteur: c.auteurNom,
              est_pro: c.estPro,
              reponse: c.parentId ? "oui" : "non",
              professionnel: c.proId,
              realisation: c.realisationId,
              texte: c.texte,
            })),
          )
        }
        options={[
          { id: "visible", label: "Visibles", n: commentaires.filter((c) => c.statut === "visible").length },
          { id: "masque", label: "Masqués", n: commentaires.filter((c) => c.statut === "masque").length },
          { id: "tous", label: "Tous", n: commentaires.length },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Les commentaires sont publiés aussitôt (pas de validation a priori). Masquez un commentaire pour le retirer du
        site sans le supprimer, ou supprimez-le définitivement. Les réponses d’un commentaire supprimé disparaissent aussi.
      </p>
      {liste.length === 0 ? (
        <Vide>Aucun commentaire ici.</Vide>
      ) : (
        <ul className="space-y-3">
          {liste.map((c) => (
            <Carte key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {c.parentId && <CornerDownRight className="size-4 text-muted-foreground" />}
                  {c.auteurNom}
                  {c.estPro && <Pastille ton="ok">Professionnel</Pastille>}
                  {c.parentId && <Pastille ton="neutre">Réponse</Pastille>}
                  {c.statut === "masque" && <Pastille ton="non">Masqué</Pastille>}
                </p>
                <p className="text-xs text-muted-foreground">{dateHeure(c.creeLe)}</p>
              </div>
              <p className="mt-2 text-sm whitespace-pre-line">{c.texte}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                {c.statut === "visible" ? (
                  <Action ton="danger" onClick={() => agir((a) => a.masquerCommentaire(c, "masque"))}>
                    <EyeOff className="size-3.5" /> Masquer
                  </Action>
                ) : (
                  <Action onClick={() => agir((a) => a.masquerCommentaire(c, "visible"))}>
                    <Eye className="size-3.5" /> Réafficher
                  </Action>
                )}
                <Action
                  ton="danger"
                  confirmer="Supprimer définitivement ce commentaire ? Cette action est irréversible."
                  onClick={() => agir((a) => a.supprimerCommentaire(c))}
                >
                  <Trash2 className="size-3.5" /> Supprimer
                </Action>
                <Link
                  href={`/artisans/${c.proId}`}
                  target="_blank"
                  className="flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-primary hover:underline"
                >
                  Profil <ExternalLink className="size-3.5" />
                </Link>
              </div>
            </Carte>
          ))}
        </ul>
      )}
    </div>
  );
}
