"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  ExternalLink,
  Flag,
  Hammer,
  History,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Presentation,
  RefreshCw,
  Star,
  Tags,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { BACKEND_ACTIF } from "@/lib/backend/actif";
import { messageErreur } from "@/lib/backend/erreurs";
import { useSession } from "@/lib/session";
import type * as Api from "@/lib/backend/admin";
import type {
  AvisDoc,
  CommentaireDoc,
  ContactDoc,
  DemandeAnnonceurDoc,
  EntreeJournal,
  MembreDoc,
  Permission,
  ProfilEquipe,
  PropositionMetierDoc,
  PubDoc,
  SignalementDoc,
} from "@/lib/backend/modele";
import { PROFIL_OWNER, profilPeut } from "@/lib/backend/modele";
import { PanneauAvis, PanneauClients, PanneauContacts, PanneauPros, PanneauRealisations, PanneauSignalements } from "./Panneaux";
import { PanneauAnnonceurs, PanneauJournal, PanneauMetiers, PanneauPublicites } from "./PanneauxSite";
import { PanneauCommentaires } from "./PanneauCommentaires";
import { PanneauEquipe } from "./PanneauEquipe";
import { TableauDeBord } from "./TableauDeBord";
import { PanneauAudience, PanneauIntelligence, PanneauMonitoring } from "./PanneauxIntelligence";

export type Donnees = {
  avis: AvisDoc[];
  commentaires: CommentaireDoc[];
  pros: Api.ProAdmin[];
  realisations: Api.RealisationAdmin[];
  contacts: ContactDoc[];
  signalements: SignalementDoc[];
  comptes: Api.CompteAdmin[];
  demandesAnnonceurs: DemandeAnnonceurDoc[];
  propositionsMetiers: PropositionMetierDoc[];
  publicites: PubDoc[];
  journal: EntreeJournal[];
  membres: MembreDoc[];
};

/**
 * Menu de la console, regroupé par métier de l'équipe.
 * `perm` : permission requise pour un membre ; `ownerOnly` : réservé au responsable.
 * Une section sans l'un ni l'autre (tableau de bord) est visible par tous.
 */
const GROUPES = [
  {
    titre: "Pilotage",
    sections: [
      { id: "accueil", label: "Tableau de bord", Icon: LayoutDashboard },
      { id: "equipe", label: "Équipe", Icon: UserCog, ownerOnly: true },
      { id: "journal", label: "Journal", Icon: History, ownerOnly: true },
    ],
  },
  {
    titre: "Intelligence",
    sections: [
      { id: "audience", label: "Audience", Icon: BarChart3, ownerOnly: true },
      { id: "monitoring", label: "Monitoring", Icon: Activity, ownerOnly: true },
      { id: "intelligence", label: "Analyses ML", Icon: BrainCircuit, ownerOnly: true },
    ],
  },
  {
    titre: "Modération",
    sections: [
      { id: "avis", label: "Avis", Icon: Star, perm: "avis" },
      { id: "commentaires", label: "Commentaires", Icon: MessageSquare, perm: "commentaires" },
      { id: "signalements", label: "Signalements", Icon: Flag, perm: "signalements" },
      { id: "realisations", label: "Réalisations", Icon: ImageIcon, perm: "realisations" },
    ],
  },
  {
    titre: "Professionnels et clients",
    sections: [
      { id: "pros", label: "Professionnels", Icon: Hammer, perm: "pros" },
      { id: "clients", label: "Clients", Icon: Users, perm: "clients" },
    ],
  },
  {
    titre: "Commercial",
    sections: [
      { id: "publicites", label: "Publicités", Icon: Presentation, perm: "publicites" },
      { id: "annonceurs", label: "Annonceurs", Icon: Megaphone, perm: "annonceurs" },
    ],
  },
  {
    titre: "Demandes",
    sections: [
      { id: "contacts", label: "Messages", Icon: Mail, perm: "contacts" },
      { id: "metiers", label: "Métiers proposés", Icon: Tags, perm: "metiers" },
    ],
  },
] as const;

export type Onglet = (typeof GROUPES)[number]["sections"][number]["id"];
type Section = { id: Onglet; label: string; Icon: LucideIcon; perm?: Permission; ownerOnly?: boolean };
const SECTIONS: Section[] = GROUPES.flatMap((g): readonly Section[] => g.sections);
const estOnglet = (x: string): x is Onglet => SECTIONS.some((s) => s.id === x);

/** Une section est-elle accessible au profil (owner : tout ; membre : ses permissions) ? */
const sectionVisible = (s: Section, profil: ProfilEquipe) =>
  profil.role === "owner" ? true : s.ownerOnly ? false : s.perm ? profilPeut(profil, s.perm) : true;

/** Le module Firebase n'est chargé que dans la console. */
const api = () => import("@/lib/backend/admin");

/** Section ouverte, gardée dans l'adresse (#avis…) : on peut la mettre en favori ou la partager. */
const sectionDeLAdresse = (): Onglet => {
  if (typeof window === "undefined") return "accueil";
  const h = window.location.hash.slice(1);
  return estOnglet(h) ? h : "accueil";
};

export function Backoffice() {
  const session = useSession();
  const router = useRouter();
  const [acces, setAcces] = useState<"verification" | "refuse" | "ok">("verification");
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [onglet, setOngletEtat] = useState<Onglet>(sectionDeLAdresse);
  const [menuOuvert, setMenuOuvert] = useState(false);
  // Droits réels du compte connecté, et aperçu « vue d'un membre » que le responsable peut activer.
  const [profil, setProfil] = useState<ProfilEquipe | null>(null);
  const [apercu, setApercu] = useState<ProfilEquipe | null>(null);

  const ouvrir = useCallback((o: Onglet) => {
    setOngletEtat(o);
    setMenuOuvert(false);
    window.history.replaceState(null, "", `#${o}`);
    window.scrollTo({ top: 0 });
  }, []);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const a = await api();
      const listes = {
        avis: a.listerAvis(),
        commentaires: a.listerCommentaires(),
        pros: a.listerPros(),
        realisations: a.listerRealisations(),
        contacts: a.listerContacts(),
        signalements: a.listerSignalements(),
        comptes: a.listerComptes(),
        demandesAnnonceurs: a.listerDemandesAnnonceurs(),
        propositionsMetiers: a.listerPropositionsMetiers(),
        publicites: a.listerPublicites(),
        journal: a.listerJournal(),
        membres: a.listerMembres(),
      };
      const cles = Object.keys(listes) as (keyof Donnees)[];
      // chaque liste est chargée séparément : une erreur n'empêche pas d'afficher les autres
      const resultats = await Promise.allSettled(Object.values(listes));
      const echec = resultats.find((r) => r.status === "rejected");
      if (echec?.status === "rejected") setErreur(messageErreur(echec.reason));
      setDonnees(
        Object.fromEntries(cles.map((c, i) => [c, resultats[i].status === "fulfilled" ? resultats[i].value : []])) as unknown as Donnees,
      );
    } finally {
      setChargement(false);
    }
  }, []);

  // Vérifie l'accès (jeton admin) dès que la session est connue, puis charge les données.
  useEffect(() => {
    if (!session.pret) return;
    let annule = false;
    (async () => {
      const a = await api();
      const ok = BACKEND_ACTIF && !session.session ? false : await a.verifierAcces().catch(() => false);
      if (annule) return;
      // Maquette (site sans Firebase) : données de démonstration dès la première ouverture.
      if (ok && !BACKEND_ACTIF) (await import("@/lib/backend/demo-console")).remplirDemoUneFois();
      // Droits du compte : connus avant d'afficher la console, pour ne montrer que les sections permises.
      if (ok) {
        const p = await a.monProfilEquipe().catch(() => PROFIL_OWNER);
        if (annule) return;
        setProfil(p);
      }
      setAcces(ok ? "ok" : "refuse");
      if (ok) await charger();
    })();
    return () => {
      annule = true;
    };
  }, [session.pret, session.session, charger]);

  // Échap ferme le menu sur mobile.
  useEffect(() => {
    if (!menuOuvert) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && setMenuOuvert(false);
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [menuOuvert]);

  /** Lance une action de la console puis recharge les listes. */
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Vérification de l’accès…
        </p>
      </div>
    );

  if (acces === "refuse")
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-sm">
          <Lock className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 font-serif text-3xl">Accès réservé</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {session.session
              ? "Ce compte n’a pas accès à la console d’administration. Demandez l’accès à l’administrateur d’Artopif."
              : "Connectez-vous avec le compte de l’équipe Artopif pour ouvrir la console d’administration."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!session.session && (
              <Link href="/profil" className="rounded-xl bg-accent px-6 py-3.5 font-bold text-accent-foreground">
                Se connecter
              </Link>
            )}
            <Link href="/" className="rounded-xl px-6 py-3.5 font-bold text-primary ring-1 ring-border">
              Retour au site
            </Link>
          </div>
        </div>
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
      case "annonceurs":
        return donnees.demandesAnnonceurs.filter((d) => d.statut === "nouveau").length;
      case "metiers":
        return donnees.propositionsMetiers.filter((p) => p.statut === "nouveau").length;
      default:
        return null;
    }
  };
  // Droits appliqués : l'aperçu « vue d'un membre » l'emporte sur les droits réels du responsable.
  const profilActif = apercu ?? profil ?? PROFIL_OWNER;
  const groupesVisibles = GROUPES.map((g) => ({
    titre: g.titre,
    sections: (g.sections as readonly Section[]).filter((s) => sectionVisible(s, profilActif)),
  })).filter((g) => g.sections.length > 0);
  const sectionDemandee = SECTIONS.find((s) => s.id === onglet);
  // Onglet ramené à une section autorisée (sinon le tableau de bord).
  const section = sectionDemandee && sectionVisible(sectionDemandee, profilActif) ? sectionDemandee : SECTIONS[0];
  const vue = section.id;
  const qui = session.session ? session.session.telephone || session.session.email : "Mode maquette";

  const menu = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <Image src="/images/artopif-embleme.png" alt="" width={1076} height={470} className="h-8 w-auto brightness-0 invert" />
        <div className="leading-tight">
          <p className="font-serif text-lg font-bold tracking-[0.2em] uppercase">Artopif</p>
          <p className="text-[11px] text-white/60">Console d’administration</p>
        </div>
      </div>
      <nav aria-label="Console d’administration" className="flex-1 overflow-y-auto px-3 pb-4">
        {groupesVisibles.map((g) => (
          <div key={g.titre} className="mt-4">
            <p className="px-3 text-[10px] font-semibold tracking-[0.2em] text-white/45 uppercase">{g.titre}</p>
            <ul className="mt-1.5 space-y-0.5">
              {g.sections.map(({ id, label, Icon }) => {
                const n = compte(id);
                const actif = onglet === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => ouvrir(id)}
                      aria-current={actif ? "page" : undefined}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                        actif ? "bg-white text-foreground" : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1">{label}</span>
                      {n ? (
                        <span className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none font-bold ${actif ? "bg-accent text-accent-foreground" : "bg-accent text-accent-foreground"}`}>
                          {n}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
          <ExternalLink className="size-4" /> Voir le site
        </Link>
        <div className="mt-1 flex items-center justify-between gap-2 px-3 py-2">
          <span className="min-w-0 truncate text-xs text-white/60">{qui}</span>
          {session.session && (
            <button
              type="button"
              onClick={async () => {
                const { deconnexion } = await import("@/lib/backend/firebase");
                await deconnexion();
                router.push("/");
              }}
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-white/80 hover:text-white"
            >
              <LogOut className="size-3.5" /> Se déconnecter
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      {/* Grand écran : menu fixe à gauche */}
      <aside className="sticky top-0 hidden h-screen bg-foreground text-white lg:block">{menu}</aside>

      {/* Mobile et tablette : menu burger qui s'ouvre depuis la gauche */}
      <div
        aria-hidden
        onClick={() => setMenuOuvert(false)}
        className={`fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm transition-opacity lg:hidden ${menuOuvert ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        id="menu-console"
        aria-label="Menu de la console"
        inert={!menuOuvert}
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] bg-foreground text-white shadow-2xl transition-transform duration-300 lg:hidden ${
          menuOuvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setMenuOuvert(false)}
          aria-label="Fermer le menu"
          className="absolute top-4 right-3 rounded-full p-2 text-white/70 hover:bg-white/10"
        >
          <X className="size-5" />
        </button>
        {menu}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOuvert}
            aria-controls="menu-console"
            className="flex size-10 items-center justify-center rounded-lg bg-card shadow-sm ring-1 ring-border lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="flex min-w-0 items-center gap-2 truncate text-lg font-bold md:text-xl">
            <section.Icon className="hidden size-5 text-primary sm:block" /> {section.label}
          </h1>
          <button
            type="button"
            onClick={() => void charger()}
            disabled={chargement}
            className="ml-auto flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-bold shadow-sm ring-1 ring-border disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${chargement ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </header>

        <div className="px-4 py-6 lg:px-8">
          {!BACKEND_ACTIF && (
            <MaquetteBandeau recharger={charger} />
          )}
          {apercu && (
            <div className="mb-5 flex flex-col items-start gap-3 rounded-xl bg-accent/15 px-4 py-3 text-sm text-accent-ink sm:flex-row sm:items-center">
              <p className="min-w-0 sm:flex-1">
                <strong>Aperçu membre</strong> : vous voyez la console comme un membre ayant ces droits
                {apercu.permissions.length ? "" : " (aucun droit)"}. Vos droits de responsable ne changent pas.
              </p>
              <button
                type="button"
                onClick={() => setApercu(null)}
                className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground"
              >
                Quitter l’aperçu
              </button>
            </div>
          )}
          {erreur && (
            <p role="alert" className="mb-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              {erreur}
            </p>
          )}

          {!donnees ? (
            <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </p>
          ) : (
            // pendant une actualisation, l'écran garde son contenu, légèrement estompé
            <div className={`transition-opacity ${chargement ? "opacity-60" : ""}`}>
              {vue === "accueil" ? (
                <TableauDeBord d={donnees} ouvrir={ouvrir} />
              ) : vue === "equipe" ? (
                <PanneauEquipe membres={donnees.membres} agir={agir} apercu={apercu} onApercu={setApercu} />
              ) : vue === "avis" ? (
                <PanneauAvis avis={donnees.avis} agir={agir} />
              ) : vue === "commentaires" ? (
                <PanneauCommentaires commentaires={donnees.commentaires} agir={agir} />
              ) : vue === "pros" ? (
                <PanneauPros pros={donnees.pros} agir={agir} />
              ) : vue === "realisations" ? (
                <PanneauRealisations realisations={donnees.realisations} agir={agir} />
              ) : vue === "contacts" ? (
                <PanneauContacts contacts={donnees.contacts} agir={agir} />
              ) : vue === "signalements" ? (
                <PanneauSignalements signalements={donnees.signalements} avis={donnees.avis} agir={agir} ouvrir={ouvrir} />
              ) : vue === "publicites" ? (
                <PanneauPublicites publicites={donnees.publicites} agir={agir} />
              ) : vue === "annonceurs" ? (
                <PanneauAnnonceurs demandes={donnees.demandesAnnonceurs} agir={agir} />
              ) : vue === "metiers" ? (
                <PanneauMetiers propositions={donnees.propositionsMetiers} agir={agir} />
              ) : vue === "audience" ? (
                <PanneauAudience />
              ) : vue === "monitoring" ? (
                <PanneauMonitoring />
              ) : vue === "intelligence" ? (
                <PanneauIntelligence d={donnees} ouvrir={ouvrir} />
              ) : vue === "journal" ? (
                <PanneauJournal journal={donnees.journal} />
              ) : (
                <PanneauClients comptes={donnees.comptes} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Maquette : rappel du mode, et données de démonstration pour voir la console remplie. */
function MaquetteBandeau({ recharger }: { recharger: () => Promise<void> }) {
  const [occupe, setOccupe] = useState(false);
  return (
    <div className="mb-5 flex flex-col items-start gap-3 rounded-xl bg-secondary px-4 py-3 text-sm text-primary sm:flex-row sm:items-center">
      <p className="min-w-0 sm:flex-1">
        <strong>Mode maquette</strong> : Firebase n’est pas configuré, la console travaille sur les données de ce
        navigateur. En production, l’accès demande un compte administrateur.
      </p>
      <button
        type="button"
        disabled={occupe}
        onClick={async () => {
          setOccupe(true);
          const { remplirDemo } = await import("@/lib/backend/demo-console");
          remplirDemo();
          await recharger();
          setOccupe(false);
        }}
        className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
      >
        Remplir avec des données de démonstration
      </button>
    </div>
  );
}
