"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, Crown, Eye, Lock, Star, UserPlus, X } from "lucide-react";
import {
  DUREE_PREMIUM_JOURS,
  PRIX_PREMIUM_CLIENT_FCFA,
  PROFILS_GRATUITS_PAR_MOIS,
  fcfa,
} from "@/lib/data";
import { useCompte } from "@/lib/compte";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

/**
 * Inscription du client en deux temps : prénom + téléphone, puis choix de la formule
 * (Gratuit ou Premium). Le compte n'est créé qu'une fois la formule choisie.
 */
export function InscriptionClient({ titre, intro }: { titre?: string; intro?: string }) {
  const c = useCompte();
  const [prenom, setPrenom] = useState("");
  const [tel, setTel] = useState("");
  const [etape, setEtape] = useState<"coordonnees" | "formule">("coordonnees");

  if (etape === "formule")
    return (
      <div>
        <h2 id="acces-titre" className="mb-1 font-serif text-2xl leading-tight">
          Bienvenue {prenom.trim()} !
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">Choisissez votre formule. Vous pourrez changer à tout moment.</p>
        <ChoixFormules
          onGratuit={() => c.inscrire(prenom, tel)}
          onPremium={() => {
            c.inscrire(prenom, tel);
            c.activerPremium();
          }}
        />
        <button
          type="button"
          onClick={() => setEtape("coordonnees")}
          className="mt-3 w-full text-center text-sm font-semibold text-muted-foreground"
        >
          Modifier mes informations
        </button>
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setEtape("formule");
      }}
      className="space-y-3"
    >
      {titre && (
        <h2 id="acces-titre" className="text-center font-serif text-2xl leading-tight">
          {titre}
        </h2>
      )}
      {intro && <p className={`text-sm text-muted-foreground ${titre ? "text-center" : ""}`}>{intro}</p>}
      <div>
        <label htmlFor="ins-prenom" className="mb-1.5 block text-sm font-semibold">
          Votre prénom
        </label>
        <input
          id="ins-prenom"
          required
          autoComplete="given-name"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          placeholder="Ex. Grâce"
          className={field}
        />
      </div>
      <div>
        <label htmlFor="ins-tel" className="mb-1.5 block text-sm font-semibold">
          Votre numéro de téléphone
        </label>
        <input
          id="ins-tel"
          type="tel"
          required
          autoComplete="tel"
          pattern="[0-9 +]{9,}"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          placeholder="06 000 00 00"
          className={field}
        />
      </div>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground transition hover:brightness-95 active:scale-[0.98]"
      >
        <UserPlus className="size-5" /> Continuer
      </button>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Votre numéro sert à vous connecter et n’est jamais affiché.{" "}
        <Link href="/confidentialite" target="_blank" className="underline">
          Politique de confidentialité
        </Link>
      </p>
    </form>
  );
}

const AVANTAGES_GRATUIT = [
  "Recherche et avis clients",
  `${PROFILS_GRATUITS_PAR_MOIS} profils complets par mois`,
  "Messages illimités aux artisans",
  "Favoris et évaluations",
];
const AVANTAGES_PREMIUM = [
  "Profils d’artisans illimités",
  "Mise en relation accompagnée : nous trouvons l’artisan pour vous",
  "Devis comparés, artisans Premium sélectionnés et vérifiés",
  "Sans renouvellement automatique",
];

/**
 * Les deux formules côte à côte, avec leurs avantages.
 * `gratuitEpuise` : le client a déjà utilisé ses profils gratuits du mois.
 */
export function ChoixFormules({
  onGratuit,
  onPremium,
  gratuitEpuise,
  actuelle,
}: {
  onGratuit?: () => void;
  onPremium?: () => void;
  gratuitEpuise?: boolean;
  actuelle?: "gratuit";
}) {
  const c = useCompte();
  const [paiement, setPaiement] = useState(false);
  const [operateur, setOperateur] = useState<"MTN MoMo" | "Airtel Money">("MTN MoMo");
  const [enCours, setEnCours] = useState(false);

  const payer = () => {
    setEnCours(true);
    // MAQUETTE : simulation du paiement Mobile Money, à remplacer par l'API de l'opérateur
    setTimeout(() => {
      if (onPremium) onPremium();
      else c.activerPremium();
      setEnCours(false);
    }, 1200);
  };

  return (
    <div className="grid gap-3">
      {/* Gratuit */}
      <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-bold">Gratuit</p>
          <p className="font-serif text-2xl">0 FCFA</p>
        </div>
        <ul className="mt-2 space-y-1.5 text-sm">
          {AVANTAGES_GRATUIT.map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success" /> {t}
            </li>
          ))}
        </ul>
        {gratuitEpuise ? (
          <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
            Profils gratuits utilisés ce mois-ci · retour le 1er
          </p>
        ) : actuelle === "gratuit" ? (
          <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-center text-xs font-semibold text-muted-foreground">
            Votre formule actuelle
          </p>
        ) : (
          onGratuit && (
            <button
              type="button"
              onClick={onGratuit}
              className="mt-3 w-full rounded-xl border border-primary py-3 text-sm font-bold text-primary"
            >
              Continuer gratuitement
            </button>
          )
        )}
      </div>

      {/* Premium */}
      <div className="relative rounded-2xl bg-foreground p-4 text-white ring-2 ring-accent">
        <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-accent-foreground uppercase">
          Recommandé
        </span>
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex items-center gap-1.5 font-bold">
            <Crown className="size-4 text-accent" /> Premium
          </p>
          <p className="font-serif text-2xl">
            {fcfa(PRIX_PREMIUM_CLIENT_FCFA)}
            <span className="font-sans text-xs text-white/60"> / {DUREE_PREMIUM_JOURS} j</span>
          </p>
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-white/85">
          {AVANTAGES_PREMIUM.map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-accent" /> {t}
            </li>
          ))}
        </ul>
        {!paiement ? (
          <button
            type="button"
            onClick={() => setPaiement(true)}
            className="mt-3 w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground"
          >
            Choisir Premium
          </button>
        ) : (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-white/70">Payer avec</p>
            <div className="grid grid-cols-2 gap-2">
              {(["MTN MoMo", "Airtel Money"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={operateur === o}
                  onClick={() => setOperateur(o)}
                  className={`rounded-xl border-2 py-2.5 text-sm font-bold ${
                    operateur === o ? "border-accent bg-white/10" : "border-white/20"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={payer}
              disabled={enCours}
              className="mt-3 w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground disabled:opacity-70"
            >
              {enCours ? "Confirmez sur votre téléphone…" : `Payer ${fcfa(PRIX_PREMIUM_CLIENT_FCFA)} avec ${operateur}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Compteur « Profils consultés en novembre : 2 / 5 ». */
export function CompteurProfils() {
  const c = useCompte();
  if (!c.pret || !c.inscrit) return null;
  if (c.premium)
    return (
      <p className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2.5 text-sm font-semibold text-success">
        <Crown className="size-4" /> Premium : profils illimités jusqu’au{" "}
        {c.premiumJusqua?.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
      </p>
    );
  const vus = PROFILS_GRATUITS_PAR_MOIS - c.restants;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-card px-4 py-2.5 text-sm ring-1 ring-border">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Eye className="size-4" /> Profils consultés en {c.mois} :{" "}
        <strong className={c.restants ? "text-foreground" : "text-destructive"}>
          {vus} / {PROFILS_GRATUITS_PAR_MOIS}
        </strong>
      </span>
      <Link href="/profil#formules" className="font-bold text-accent-ink hover:underline">
        Voir les formules
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

/** Fenêtre pop-up : inscription gratuite, ou offre Premium quand les 5 profils sont utilisés. */
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
              {c.inscrit ? <Crown className="size-4" /> : <Lock className="size-4" />}
            </span>
          </span>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
            {a.metier} · {a.quartier}
          </p>
          <p className="font-bold">{a.nom}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-star text-star" /> {a.note.toFixed(1).replace(".", ",")} · {a.nbAvis} avis
          </p>
          {c.inscrit && (
            <>
              <h2 id="acces-titre" className="mt-4 font-serif text-2xl leading-tight">
                Vos {PROFILS_GRATUITS_PAR_MOIS} profils gratuits sont utilisés
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {c.compte!.prenom}, passez Premium pour ouvrir tous les profils, ou attendez le 1er du mois.
              </p>
            </>
          )}
        </div>
        <div className="px-6 pt-2 pb-6">{c.inscrit ? (
            <ChoixFormules gratuitEpuise />
          ) : (
            <InscriptionClient
              titre="Inscrivez-vous pour voir ce profil"
              intro={`Gratuit et rapide : ${PROFILS_GRATUITS_PAR_MOIS} profils complets chaque mois, messages illimités.`}
            />
          )}</div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Verrou du profil complet : il faut un compte, puis il reste des profils gratuits ce mois-ci
 * (ou le Premium). Un profil déjà ouvert ce mois-ci reste accessible.
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
          <Lock className="size-4" /> {c.inscrit ? "Débloquer ce profil" : "S’inscrire pour voir le profil"}
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
  if (c.inscrit) return <CompteurProfils />;
  return (
    <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm text-primary">
      <span className="flex items-center gap-2">
        <Lock className="size-4 shrink-0" /> Compte gratuit : {PROFILS_GRATUITS_PAR_MOIS} profils complets par mois.
      </span>
      <Link href="/profil" className="font-bold underline-offset-2 hover:underline">
        Je m’inscris
      </Link>
    </p>
  );
}
