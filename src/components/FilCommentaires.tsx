"use client";

import { useCallback, useRef, useState } from "react";
import { CornerDownRight, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { useCompte } from "@/lib/compte";
import { estMonCommentaire, lireCommentaires, messageErreur, publierCommentaire, retirerCommentaire } from "@/lib/backend";
import type { CommentaireDoc } from "@/lib/backend/modele";
import { InscriptionClient } from "./Acces";
import { Signaler } from "./Engagement";

/** « Grâce » + « Ngoma » → « Grâce N. » (le nom complet n'est jamais publié). */
const nomAuteur = (prenom: string, nom?: string | null) =>
  nom?.trim() ? `${prenom.trim()} ${nom.trim()[0].toUpperCase()}.` : prenom.trim();

const quand = (ms: number) => {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(ms);
};

function Bulle({
  c,
  reponse,
  proNom,
  onRepondre,
  onSupprimer,
}: {
  c: CommentaireDoc;
  reponse?: boolean;
  proNom: string;
  onRepondre?: () => void;
  onSupprimer: (c: CommentaireDoc) => void;
}) {
  return (
    <div className={reponse ? "flex gap-2" : ""}>
      {reponse && <CornerDownRight className="mt-2 size-4 shrink-0 text-muted-foreground" />}
      <div className="flex-1">
        <div className="rounded-2xl bg-muted/70 px-3.5 py-2.5">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
            {c.auteurNom}
            {c.estPro && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {proNom} · pro
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm whitespace-pre-line">{c.texte}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-1.5 text-xs text-muted-foreground">
          <span>{quand(c.creeLe)}</span>
          {onRepondre && (
            <button type="button" onClick={onRepondre} className="font-semibold hover:text-primary">
              Répondre
            </button>
          )}
          {estMonCommentaire(c) && (
            <button type="button" onClick={() => onSupprimer(c)} className="flex items-center gap-1 font-semibold hover:text-destructive">
              <Trash2 className="size-3" /> Supprimer
            </button>
          )}
          <Signaler cible="commentaire" cibleId={c.id} libelle={`Commentaire de ${c.auteurNom}`} label="Signaler" />
        </div>
      </div>
    </div>
  );
}

/** Fil de commentaires d'une réalisation : façon réseau social (commentaires + réponses). */
export function FilCommentaires({ proId, realisationId, proNom }: { proId: string; realisationId: string; proNom: string }) {
  const c = useCompte();
  const [ouvert, setOuvert] = useState(false);
  const [liste, setListe] = useState<CommentaireDoc[] | null>(null);
  const [texte, setTexte] = useState("");
  const [repondA, setRepondA] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const champReponse = useRef<HTMLTextAreaElement>(null);

  const charger = useCallback(async () => {
    try {
      setListe(await lireCommentaires(proId, realisationId));
    } catch (e) {
      setErreur(messageErreur(e));
      setListe([]);
    }
  }, [proId, realisationId]);

  const ouvrir = () => {
    setOuvert(true);
    if (liste === null) void charger();
  };

  const moi = c.compte ? nomAuteur(c.compte.prenom, c.compte.nom) : "";

  const envoyer = async (parentId: string | null, valeur: string) => {
    const t = valeur.trim();
    if (!t || !moi) return;
    setErreur("");
    setEnvoi(true);
    try {
      await publierCommentaire({ proId, realisationId, texte: t, parentId, auteurNom: moi });
      setTexte("");
      setRepondA(null);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (com: CommentaireDoc) => {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    try {
      await retirerCommentaire(com);
      await charger();
    } catch (e) {
      setErreur(messageErreur(e));
    }
  };

  const racines = (liste ?? []).filter((x) => !x.parentId);
  const reponses = (id: string) => (liste ?? []).filter((x) => x.parentId === id);
  const total = liste?.length ?? 0;

  if (!ouvert)
    return (
      <button
        type="button"
        onClick={ouvrir}
        className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-sm font-semibold text-primary"
      >
        <MessageCircle className="size-4" /> Commentaires
      </button>
    );

  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="flex items-center gap-2 text-sm font-bold">
        <MessageCircle className="size-4 text-primary" /> Commentaires {total ? `· ${total}` : ""}
      </p>

      {liste === null ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Chargement…
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {racines.length === 0 && <p className="text-sm text-muted-foreground">Soyez le premier à commenter.</p>}
          {racines.map((r) => (
            <div key={r.id} className="space-y-2">
              <Bulle
                c={r}
                proNom={proNom}
                onRepondre={c.inscrit ? () => { setRepondA(r.id); setTimeout(() => champReponse.current?.focus(), 0); } : undefined}
                onSupprimer={supprimer}
              />
              {reponses(r.id).map((rep) => (
                <div key={rep.id} className="ml-6">
                  <Bulle c={rep} reponse proNom={proNom} onSupprimer={supprimer} />
                </div>
              ))}
              {repondA === r.id && c.inscrit && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void envoyer(r.id, champReponse.current?.value ?? "");
                  }}
                  className="ml-6 flex items-end gap-2"
                >
                  <textarea
                    ref={champReponse}
                    rows={1}
                    maxLength={1000}
                    placeholder={`Répondre à ${r.auteurNom}…`}
                    className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm"
                  />
                  <button type="submit" disabled={envoi} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50">
                    {envoi ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {erreur && <p className="mt-3 text-xs font-semibold text-destructive">{erreur}</p>}

      {/* Zone de rédaction d'un nouveau commentaire */}
      {!c.pret ? null : c.inscrit ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void envoyer(null, texte);
          }}
          className="mt-4 flex items-end gap-2"
        >
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={1}
            maxLength={1000}
            placeholder="Écrire un commentaire…"
            className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm"
          />
          <button type="submit" disabled={envoi || !texte.trim()} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground disabled:opacity-50">
            {envoi ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-2xl bg-muted/60 p-4">
          <p className="mb-3 text-sm font-semibold">Connectez-vous pour laisser un commentaire.</p>
          <InscriptionClient />
        </div>
      )}
    </div>
  );
}
