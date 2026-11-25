"use client";

import { useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { useSession } from "@/lib/session";
import { messageErreur, repondreAvis } from "@/lib/backend";

/**
 * Réponse publique du professionnel sous un avis. Tout le monde voit la réponse ; seul le
 * professionnel ciblé (compte connecté == cibleId) voit l'éditeur pour répondre ou corriger.
 */
export function ReponseAvis({
  avisId,
  cibleId,
  reponse,
  proPrenom,
}: {
  avisId?: string;
  cibleId: string;
  reponse?: string;
  proPrenom: string;
}) {
  const s = useSession();
  const [valeur, setValeur] = useState(reponse ?? "");
  const [enregistre, setEnregistre] = useState<string | null>(reponse ?? null);
  const [edition, setEdition] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const estLePro = Boolean(avisId) && s.session?.id === cibleId;

  return (
    <>
      {enregistre && !edition && (
        <p className="mt-3 border-l-2 border-primary pl-3 text-sm text-muted-foreground">
          <span className="font-bold text-foreground">Réponse de {proPrenom} : </span>
          {enregistre}
        </p>
      )}
      {estLePro && !edition && (
        <button
          type="button"
          onClick={() => {
            setValeur(enregistre ?? "");
            setEdition(true);
          }}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
        >
          <PenLine className="size-3.5" /> {enregistre ? "Modifier votre réponse" : "Répondre publiquement"}
        </button>
      )}
      {estLePro && edition && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErreur("");
            setEnvoi(true);
            try {
              await repondreAvis(avisId as string, valeur);
              setEnregistre(valeur.trim() || null);
              setEdition(false);
            } catch (err) {
              setErreur(messageErreur(err));
            } finally {
              setEnvoi(false);
            }
          }}
          className="mt-2 space-y-2"
        >
          <textarea
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Votre réponse publique…"
            className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm"
          />
          {erreur && <p className="text-xs font-semibold text-destructive">{erreur}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={envoi}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {envoi && <Loader2 className="size-3.5 animate-spin" />} Publier la réponse
            </button>
            <button type="button" onClick={() => setEdition(false)} className="px-2 text-xs font-semibold text-muted-foreground">
              Annuler
            </button>
          </div>
        </form>
      )}
    </>
  );
}
