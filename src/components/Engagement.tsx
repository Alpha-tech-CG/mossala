"use client";

import { useState } from "react";
import { CheckCircle2, Flag, Heart } from "lucide-react";
import { useCompte } from "@/lib/compte";
import { envoyerSignalement, messageErreur } from "@/lib/backend";

/** Cœur « Ajouter aux favoris » (compte client requis, ce qui est le cas sur un profil ouvert). */
export function FavoriButton({ id, className = "" }: { id: string; className?: string }) {
  const c = useCompte();
  const actif = c.favoris.includes(id);
  if (!c.inscrit) return null;
  return (
    <button
      type="button"
      onClick={() => c.basculerFavori(id)}
      aria-pressed={actif}
      className={`flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold shadow-sm ring-1 ring-border transition hover:ring-primary ${className}`}
    >
      <Heart className={`size-4 ${actif ? "fill-destructive text-destructive" : ""}`} />
      {actif ? "Dans mes favoris" : "Ajouter aux favoris"}
    </button>
  );
}

const MOTIFS = {
  profil: ["Faux profil ou usurpation", "Arnaque ou demande d’argent suspecte", "Coordonnées incorrectes", "Autre"],
  avis: ["Avis faux ou acheté", "Propos injurieux", "Ne concerne pas cet artisan", "Autre"],
  commentaire: ["Propos injurieux ou haineux", "Spam ou publicité", "Fausse information", "Autre"],
};

/** Signalement d'un profil ou d'un avis, transmis à la modération. */
export function Signaler({
  cible,
  cibleId,
  libelle,
  label,
}: {
  cible: keyof typeof MOTIFS;
  /** identifiant du profil ou de l'avis signalé */
  cibleId: string;
  /** ce que l'équipe verra dans le backoffice (« Avis de Grâce N. sur Jean-Claude Mbemba ») */
  libelle: string;
  label: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  if (envoye)
    return (
      <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success">
        <CheckCircle2 className="size-3.5" /> Merci, notre équipe de modération va vérifier.
      </p>
    );

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
      >
        <Flag className="size-3.5" /> {label}
      </button>
      {ouvert && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErreur("");
            setEnvoi(true);
            try {
              await envoyerSignalement({ cible, cibleId, libelle, motif });
              setEnvoye(true);
            } catch (err) {
              setErreur(messageErreur(err));
            } finally {
              setEnvoi(false);
            }
          }}
          className="mt-2 space-y-2 rounded-xl bg-muted/60 p-3"
        >
          {MOTIFS[cible].map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <input type="radio" name={`motif-${cible}`} required value={m} onChange={() => setMotif(m)} />
              {m}
            </label>
          ))}
          {erreur && <p className="text-xs font-semibold text-destructive">{erreur}</p>}
          <button
            type="submit"
            disabled={!motif || envoi}
            className="rounded-lg bg-foreground px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Envoyer le signalement
          </button>
        </form>
      )}
    </div>
  );
}
