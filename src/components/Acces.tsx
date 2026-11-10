"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Eye, Lock, Star, UserPlus, X } from "lucide-react";
import { PROFILS_SANS_COMPTE } from "@/lib/data";
import { useCompte } from "@/lib/compte";
import { ChampsIdentite, ChoixProfil, identitePropre, identiteValide, identiteVide, type Identite } from "./Identite";


/**
 * Inscription d'un client : type de compte + identité. Le compte gratuit donne accès
 * à tous les profils, sans limite. Artisans et magasins vont vers l'inscription pro.
 */
export function InscriptionClient({ titre, intro }: { titre?: string; intro?: string }) {
  const c = useCompte();
  const router = useRouter();
  const [identite, setIdentite] = useState<Identite>(() => identiteVide());
  const valide = identiteValide(identite);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valide) c.inscrire(identitePropre(identite));
      }}
      className="space-y-4"
    >
      {titre && (
        <h2 id="acces-titre" className="text-center font-serif text-2xl leading-tight">
          {titre}
        </h2>
      )}
      {intro && <p className={`text-sm text-muted-foreground ${titre ? "text-center" : ""}`}>{intro}</p>}
      <ChoixProfil
        actuel="client"
        onChoisir={(t) => {
          if (t !== "client") router.push(`/pro/inscription${t === "magasin" ? "?type=boutique" : ""}`);
        }}
      />
      <ChampsIdentite id="ins" value={identite} onChange={setIdentite} />
      <button
        type="submit"
        disabled={!valide}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground transition hover:brightness-95 active:scale-[0.98] disabled:opacity-40"
      >
        <UserPlus className="size-5" /> Créer mon compte gratuit
      </button>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Vos coordonnées servent à vous connecter et à être rappelé par les artisans ; elles ne sont jamais affichées
        publiquement.{" "}
        <Link href="/confidentialite" target="_blank" className="underline">
          Politique de confidentialité
        </Link>
      </p>
    </form>
  );
}

/** Compteur des profils vus sans compte (« 2 / 3 ») ; rien une fois inscrit. */
export function CompteurProfils() {
  const c = useCompte();
  if (!c.pret || c.inscrit) return null;
  const vus = PROFILS_SANS_COMPTE - c.restantsSansCompte;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm text-primary">
      <span className="flex items-center gap-2">
        <Eye className="size-4 shrink-0" /> Profils vus sans compte :{" "}
        <strong className={c.restantsSansCompte ? "" : "text-destructive"}>
          {vus} / {PROFILS_SANS_COMPTE}
        </strong>
      </span>
      <Link href="/profil" className="font-bold underline-offset-2 hover:underline">
        Créer mon compte
      </Link>
    </div>
  );
}

export type Apercu = {
  id: string;
  nom: string;
  metier: string;
  quartier: string;
  image?: string;
  note: number;
  nbAvis: number;
};

type Demande = { a: Apercu; suite: () => void } | null;
let demande: Demande = null;
const abonnesDemande = new Set<() => void>();
const setDemande = (d: Demande) => {
  demande = d;
  abonnesDemande.forEach((f) => f());
};

/** Ouvre la fenêtre d'inscription (ou Premium) ; `suite` s'exécute dès que l'accès est accordé. */
export function demanderAcces(a: Apercu, suite: () => void) {
  setDemande({ a, suite });
}

/** Fenêtre globale, montée une seule fois dans le layout. */
export function AccesModal() {
  const d = useSyncExternalStore(
    (f) => {
      abonnesDemande.add(f);
      return () => abonnesDemande.delete(f);
    },
    () => demande,
    () => null,
  );
  if (!d) return null;
  return (
    <AccesDialog
      a={d.a}
      onClose={() => setDemande(null)}
      onAcces={() => {
        setDemande(null);
        d.suite();
      }}
    />
  );
}

/** Lien vers un profil : s'il n'est pas accessible, la fenêtre d'inscription s'ouvre à la place. */
export function ProfilLink({
  a,
  className,
  children,
}: {
  a: Apercu;
  className?: string;
  children: React.ReactNode;
}) {
  const c = useCompte();
  const router = useRouter();
  const href = `/artisans/${a.id}`;
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (!c.pret || c.peutVoir(a.id)) return;
        e.preventDefault();
        demanderAcces(a, () => router.push(href));
      }}
    >
      {children}
    </Link>
  );
}

/** Fenêtre pop-up : inscription gratuite, une fois les profils sans compte utilisés. */
export function AccesDialog({
  a,
  onClose,
  onAcces,
}: {
  a: Apercu;
  onClose: () => void;
  onAcces?: () => void;
}) {
  const c = useCompte();
  const accorde = c.pret && c.peutVoir(a.id);
  const { consulter } = c;

  useEffect(() => {
    if (!accorde) return;
    consulter(a.id);
    onAcces?.();
  }, [accorde, a.id, consulter, onAcces]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!c.pret || accorde) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6">
      <div onClick={onClose} aria-hidden className="absolute inset-0 bg-foreground/55 backdrop-blur-sm" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="acces-titre"
        className="sheet-in relative max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-background shadow-2xl md:max-w-md md:rounded-[28px]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <X className="size-5" />
        </button>
        <div className="flex flex-col items-center bg-gradient-to-b from-cream to-background px-6 pt-8 pb-4 text-center">
          <span className="relative">
            {a.image ? (
              <Image
                src={a.image}
                alt=""
                width={88}
                height={88}
                className="size-20 rounded-full object-cover ring-4 ring-background"
              />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full bg-primary font-serif text-3xl text-white ring-4 ring-background">
                {a.nom[0]}
              </span>
            )}
            <span className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground ring-4 ring-background">
              <Lock className="size-4" />
            </span>
          </span>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
            {a.metier} · {a.quartier}
          </p>
          <p className="font-bold">{a.nom}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-star text-star" /> {a.note.toFixed(1).replace(".", ",")} · {a.nbAvis} avis
          </p>
        </div>
        <div className="px-6 pt-2 pb-6">
          <InscriptionClient
            titre={`Vous avez vu vos ${PROFILS_SANS_COMPTE} profils gratuits`}
            intro="Créez votre compte gratuit pour continuer : tous les profils sans limite, messages illimités."
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Verrou du profil complet : 3 profils sans compte, puis un compte gratuit (sans limite).
 * Un profil déjà ouvert sans compte reste accessible.
 * Accès direct par l'adresse : aperçu flouté + la même fenêtre d'inscription par-dessus.
 * MAQUETTE : contrôle côté navigateur ; avec Supabase, le serveur ne renverra le téléphone
 * et les détails que si l'accès est accordé.
 */
export function ProfilVerrou({ a, children }: { a: Apercu; children: React.ReactNode }) {
  const c = useCompte();
  const ouvert = c.pret && c.peutVoir(a.id);
  const { consulter } = c;
  const [ferme, setFerme] = useState(false);

  useEffect(() => {
    if (ouvert) consulter(a.id);
  }, [ouvert, a.id, consulter]);

  if (!c.pret) return <div className="mt-5 h-96 animate-pulse rounded-2xl bg-card" aria-busy />;
  if (ouvert)
    return (
      <>
        <div className="mt-4">
          <CompteurProfils />
        </div>
        {children}
      </>
    );

  return (
    <>
      <div className="relative mt-5 overflow-hidden rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
        <div className="flex items-center gap-4">
          {a.image ? (
            <Image src={a.image} alt="" width={96} height={96} className="size-20 rounded-2xl object-cover" />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-2xl bg-primary font-serif text-3xl text-white">
              {a.nom[0]}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">{a.metier}</p>
            <p className="font-serif text-2xl">{a.nom}</p>
          </div>
        </div>
        <div aria-hidden className="mt-6 space-y-3 blur-[6px] select-none">
          <div className="h-3 w-4/5 rounded bg-muted" />
          <div className="h-3 w-3/5 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-12 rounded-xl bg-accent/40" />
            <div className="h-12 rounded-xl bg-[#25D366]/40" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-28 rounded-xl bg-muted" />
            <div className="h-28 rounded-xl bg-muted" />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setFerme(false)}
          className="absolute inset-x-5 bottom-5 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground"
        >
          <Lock className="size-4" /> S’inscrire pour voir le profil
        </button>
      </div>
      {!ferme && <AccesDialog a={a} onClose={() => setFerme(true)} />}
    </>
  );
}

/** Bandeau de la page de recherche : rappelle la règle d'accès aux profils. */
export function BandeauAcces() {
  const c = useCompte();
  if (!c.pret) return null;
  if (c.inscrit) return null;
  if (c.restantsSansCompte < PROFILS_SANS_COMPTE) return <CompteurProfils />;
  return (
    <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm text-primary">
      <span className="flex items-center gap-2">
        <Lock className="size-4 shrink-0" /> {PROFILS_SANS_COMPTE} profils offerts sans compte, puis
        illimités avec un compte gratuit.
      </span>
      <Link href="/profil" className="font-bold underline-offset-2 hover:underline">
        Je m’inscris
      </Link>
    </p>
  );
}
