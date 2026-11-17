"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Flag,
  Hammer,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { BACKEND_ACTIF } from "@/lib/backend/actif";
import { messageErreur } from "@/lib/backend/erreurs";
import { useSession } from "@/lib/session";
import type * as Api from "@/lib/backend/admin";
import type { AvisDoc, ContactDoc, SignalementDoc } from "@/lib/backend/modele";
import { PanneauAvis, PanneauClients, PanneauContacts, PanneauPros, PanneauRealisations, PanneauSignalements, TableauDeBord } from "./Panneaux";

export type Donnees = {
  avis: AvisDoc[];
  pros: Api.ProAdmin[];
  realisations: Api.RealisationAdmin[];
  contacts: ContactDoc[];
  signalements: SignalementDoc[];
  comptes: Api.CompteAdmin[];
};

const ONGLETS = [
  { id: "accueil", label: "Tableau de bord", Icon: LayoutDashboard },
  { id: "avis", label: "Avis", Icon: Star },
  { id: "pros", label: "Professionnels", Icon: Hammer },
  { id: "realisations", label: "Réalisations", Icon: ImageIcon },
  { id: "contacts", label: "Messages", Icon: Mail },
  { id: "signalements", label: "Signalements", Icon: Flag },
  { id: "clients", label: "Clients", Icon: Users },
] as const;
export type Onglet = (typeof ONGLETS)[number]["id"];

/** Le module Firebase n'est chargé que dans le backoffice. */
const api = () => import("@/lib/backend/admin");

export function Backoffice() {
  const session = useSession();
  const [acces, setAcces] = useState<"verification" | "refuse" | "ok">("verification");
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [onglet, setOnglet] = useState<Onglet>("accueil");

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const a = await api();
      // chaque liste est chargée séparément : une erreur n'empêche pas d'afficher les autres
      const [avis, pros, realisations, contacts, signalements, comptes] = await Promise.allSettled([
        a.listerAvis(),
        a.listerPros(),
        a.listerRealisations(),
        a.listerContacts(),
        a.listerSignalements(),
        a.listerComptes(),
      ]);
      const val = <T,>(r: PromiseSettledResult<T[]>) => (r.status === "fulfilled" ? r.value : []);
      const echec = [avis, pros, realisations, contacts, signalements, comptes].find((r) => r.status === "rejected");
      if (echec?.status === "rejected") setErreur(messageErreur(echec.reason));
      setDonnees({
        avis: val(avis),
        pros: val(pros),
        realisations: val(realisations),
        contacts: val(contacts),
        signalements: val(signalements),
        comptes: val(comptes),
      });
    } finally {
      setChargement(false);
    }
  }, []);

  // Vérifie l'accès (jeton admin) dès que la session est connue, puis charge les données.
  useEffect(() => {
    if (!session.pret) return;
    let annule = false;
    (async () => {
      const ok = BACKEND_ACTIF && !session.session ? false : await (await api()).verifierAcces().catch(() => false);
      if (annule) return;
      setAcces(ok ? "ok" : "refuse");
      if (ok) await charger();
    })();
    return () => {
      annule = true;
    };
  }, [session.pret, session.session, charger]);

  /** Lance une action du backoffice puis recharge les listes. */
  const agir = useCallback(
    async (action: (a: typeof Api) => Promise<void>) => {
      try {
        await action(await api());
        await charger();
      } catch (e) {
        setErreur(messageErreur(e));
      }
    },
    [charger],
  );

  if (acces === "verification")
    return (
      <p className="flex items-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Vérification de l’accès…
      </p>
    );

  if (acces === "refuse")
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl bg-card p-8 text-center shadow-sm">
        <Lock className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 font-serif text-3xl">Accès réservé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session.session
            ? "Ce compte n’a pas accès au backoffice. Demandez l’accès à l’administrateur d’Artopif."
            : "Connectez-vous avec le compte de l’équipe Artopif pour ouvrir le backoffice."}
        </p>
        {!session.session && (
          <Link href="/profil" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3.5 font-bold text-accent-foreground">
            Se connecter
          </Link>
        )}
      </div>
    );

  const compte = (o: Onglet): number | null => {
    if (!donnees) return null;
    switch (o) {
      case "avis":
        return donnees.avis.filter((v) => v.statut === "a_moderer").length;
      case "pros":
        return donnees.pros.filter((p) => p.statut === "en_verification").length;
      case "realisations":
        return donnees.realisations.filter((r) => !r.verifiee).length;
      case "contacts":
        return donnees.contacts.filter((c) => c.statut === "nouveau").length;
      case "signalements":
        return donnees.signalements.filter((s) => s.statut === "nouveau").length;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
            <ShieldCheck className="size-4" /> Équipe Artopif
          </p>
          <h1 className="mt-1 font-serif text-4xl">Backoffice</h1>
        </div>
        <button
          type="button"
          onClick={() => void charger()}
          disabled={chargement}
          className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold shadow-sm ring-1 ring-border disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${chargement ? "animate-spin" : ""}`} /> Actualiser
        </button>
      </div>

      {!BACKEND_ACTIF && (
        <p className="mt-4 rounded-xl bg-secondary px-4 py-3 text-sm text-primary">
          <strong>Mode maquette</strong> : Firebase n’est pas configuré, les données sont celles enregistrées dans ce
          navigateur (avis, messages et signalements envoyés depuis le site). En production, l’accès demande un compte
          administrateur.
        </p>
      )}
      {erreur && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {erreur}
        </p>
      )}

      <nav className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1" aria-label="Sections du backoffice">
        {ONGLETS.map(({ id, label, Icon }) => {
          const n = compte(id);
          const actif = onglet === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setOnglet(id)}
              aria-current={actif ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                actif ? "bg-foreground text-white" : "bg-card text-foreground shadow-sm ring-1 ring-border hover:ring-primary"
              }`}
            >
              <Icon className="size-4" />
              {label}
              {n ? (
                <span className={`rounded-full px-1.5 text-xs ${actif ? "bg-white text-foreground" : "bg-accent text-accent-foreground"}`}>
                  {n}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {!donnees ? (
          <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement…
          </p>
        ) : onglet === "accueil" ? (
          <TableauDeBord d={donnees} ouvrir={setOnglet} />
        ) : onglet === "avis" ? (
          <PanneauAvis avis={donnees.avis} agir={agir} />
        ) : onglet === "pros" ? (
          <PanneauPros pros={donnees.pros} agir={agir} />
        ) : onglet === "realisations" ? (
          <PanneauRealisations realisations={donnees.realisations} agir={agir} />
        ) : onglet === "contacts" ? (
          <PanneauContacts contacts={donnees.contacts} agir={agir} />
        ) : onglet === "signalements" ? (
          <PanneauSignalements signalements={donnees.signalements} avis={donnees.avis} agir={agir} ouvrir={setOnglet} />
        ) : (
          <PanneauClients comptes={donnees.comptes} />
        )}
      </div>
    </div>
  );
}
