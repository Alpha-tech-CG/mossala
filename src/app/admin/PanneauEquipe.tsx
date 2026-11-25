"use client";

import { useState } from "react";
import { Check, Eye, Pencil, RotateCcw, Save, ShieldOff, Trash2, UserPlus, Users, X } from "lucide-react";
import {
  type MembreDoc,
  type Permission,
  type ProfilEquipe,
  LIBELLES_PERMISSIONS,
  PERMISSIONS,
} from "@/lib/backend/modele";
import { Action, Carte, Pastille, Vide, correspond, dateHeure } from "./Panneaux";
import type { Agir } from "./Panneaux";

/** Grille de cases à cocher : les tâches que l'on confie à un membre. */
function ChoixPermissions({
  valeur,
  onChange,
}: {
  valeur: Permission[];
  onChange: (p: Permission[]) => void;
}) {
  const basculer = (p: Permission) =>
    onChange(valeur.includes(p) ? valeur.filter((x) => x !== p) : [...valeur, p]);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PERMISSIONS.map((p) => (
        <label key={p} className="flex items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <input type="checkbox" checked={valeur.includes(p)} onChange={() => basculer(p)} className="size-4" />
          {LIBELLES_PERMISSIONS[p]}
        </label>
      ))}
    </div>
  );
}

/** Formulaire d'invitation d'un membre (replié par défaut). */
function Inviter({ agir }: { agir: Agir }) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [identifiant, setIdentifiant] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);

  if (!ouvert)
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
      >
        <UserPlus className="size-4" /> Ajouter un membre
      </button>
    );

  const reinitialiser = () => {
    setNom("");
    setIdentifiant("");
    setPermissions([]);
    setOuvert(false);
  };

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          <UserPlus className="size-4 text-primary" /> Nouveau membre
        </h2>
        <button type="button" onClick={reinitialiser} aria-label="Fermer" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        La personne doit s’être connectée au moins une fois sur le site (par SMS ou par email). Saisissez le numéro
        ou l’email de ce compte, puis cochez les tâches que vous lui confiez.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Nom du membre
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex. Merveille Okemba"
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-base"
          />
        </label>
        <label className="block text-sm font-semibold">
          Numéro ou email du compte
          <input
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
            placeholder="+242 06 … ou membre@exemple.cg"
            className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-base"
          />
        </label>
      </div>
      <p className="mt-4 mb-2 text-sm font-semibold">Tâches confiées</p>
      <ChoixPermissions valeur={permissions} onChange={setPermissions} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Action
          ton="principal"
          onClick={async () => {
            if (!nom.trim() || !identifiant.trim()) return;
            await agir((a) => a.inviterMembre(nom.trim(), identifiant.trim(), permissions));
            reinitialiser();
          }}
        >
          <Check className="size-3.5" /> Ajouter le membre
        </Action>
        <button type="button" onClick={reinitialiser} className="px-2 py-2 text-xs font-semibold text-muted-foreground">
          Annuler
        </button>
      </div>
    </div>
  );
}

/** Ligne d'un membre : droits, aperçu de sa vue, activation et retrait. */
function LigneMembre({
  m,
  agir,
  onApercu,
}: {
  m: MembreDoc;
  agir: Agir;
  onApercu: (p: ProfilEquipe | null) => void;
}) {
  const [edition, setEdition] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>(m.permissions);

  if (m.role === "owner")
    return (
      <Carte>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold">{m.nom || m.identifiant}</p>
          <Pastille ton="ok">Responsable</Pastille>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{m.identifiant} · accès complet à la console</p>
      </Carte>
    );

  return (
    <Carte>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold">
            {m.nom || m.identifiant}
            {m.actif ? <Pastille ton="ok">Actif</Pastille> : <Pastille ton="non">Désactivé</Pastille>}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{m.identifiant}</p>
        </div>
        <p className="text-xs text-muted-foreground">{m.majLe ? `Modifié le ${dateHeure(m.majLe)}` : ""}</p>
      </div>

      {edition ? (
        <div className="mt-3">
          <ChoixPermissions valeur={permissions} onChange={setPermissions} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Action
              ton="principal"
              onClick={async () => {
                await agir((a) => a.modifierMembre(m, { permissions }));
                setEdition(false);
              }}
            >
              <Save className="size-3.5" /> Enregistrer les droits
            </Action>
            <button
              type="button"
              onClick={() => {
                setPermissions(m.permissions);
                setEdition(false);
              }}
              className="px-2 py-2 text-xs font-semibold text-muted-foreground"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.permissions.length ? (
            m.permissions.map((p) => (
              <span key={p} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                {LIBELLES_PERMISSIONS[p]}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Aucune tâche confiée pour l’instant.</span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        {!edition && (
          <Action onClick={async () => setEdition(true)}>
            <Pencil className="size-3.5" /> Modifier les droits
          </Action>
        )}
        <Action onClick={async () => onApercu({ role: "membre", permissions: m.permissions })}>
          <Eye className="size-3.5" /> Prévisualiser sa vue
        </Action>
        {m.actif ? (
          <Action
            ton="danger"
            confirmer={`Désactiver ${m.nom || m.identifiant} ? Il n’aura plus accès à la console.`}
            onClick={() => agir((a) => a.modifierMembre(m, { actif: false }))}
          >
            <ShieldOff className="size-3.5" /> Désactiver
          </Action>
        ) : (
          <Action onClick={() => agir((a) => a.modifierMembre(m, { actif: true }))}>
            <RotateCcw className="size-3.5" /> Réactiver
          </Action>
        )}
        <Action
          ton="danger"
          confirmer={`Retirer définitivement ${m.nom || m.identifiant} de l’équipe ? Son accès est supprimé.`}
          onClick={() => agir((a) => a.revoquerMembre(m))}
        >
          <Trash2 className="size-3.5" /> Retirer
        </Action>
      </div>
    </Carte>
  );
}

export function PanneauEquipe({
  membres,
  agir,
  apercu,
  onApercu,
}: {
  membres: MembreDoc[];
  agir: Agir;
  apercu: ProfilEquipe | null;
  onApercu: (p: ProfilEquipe | null) => void;
}) {
  const [recherche, setRecherche] = useState("");
  const liste = membres.filter((m) => correspond(recherche, m.nom, m.identifiant));
  const actifs = membres.filter((m) => m.role !== "owner" && m.actif).length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm ring-1 ring-black/[0.03]">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <Users className="size-4 text-primary" /> Déléguez les tâches de la console
        </p>
        <p className="mt-1.5">
          Vous êtes le responsable : vous seul voyez cette page. Ajoutez des membres et confiez à chacun des tâches
          précises (modérer les avis, vérifier les réalisations, répondre aux messages…). Un membre ne voit dans la
          console <strong>que</strong> les sections que vous lui avez confiées. Utilisez « Prévisualiser sa vue » pour
          voir la console exactement comme lui.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Inviter agir={agir} />
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-card px-3 py-1.5 ring-1 ring-border sm:max-w-xs">
          <span className="sr-only">Rechercher un membre</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un membre…"
            className="w-full min-w-0 bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        {actifs} membre{actifs > 1 ? "s" : ""} actif{actifs > 1 ? "s" : ""}
        {apercu ? " · aperçu membre en cours (bandeau en haut)" : ""}
      </p>

      {liste.length === 0 ? (
        <Vide>Aucun membre pour l’instant. Ajoutez la première personne de votre équipe.</Vide>
      ) : (
        <ul className="space-y-3">
          {liste.map((m) => (
            <LigneMembre key={m.id} m={m} agir={agir} onApercu={onApercu} />
          ))}
        </ul>
      )}
    </div>
  );
}
