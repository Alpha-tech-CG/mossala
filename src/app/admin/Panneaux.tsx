"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  Check,
  ExternalLink,
  EyeOff,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  Search,
  ShieldOff,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { boutiques } from "@/lib/data";
import type * as Api from "@/lib/backend/admin";
import { type AvisDoc, type ContactDoc, type SignalementDoc, moisLisible } from "@/lib/backend/modele";
import type { Donnees, Onglet } from "./Backoffice";

type Agir = (action: (a: typeof Api) => Promise<void>) => Promise<void>;

// ——— Outils d'affichage ———

const dateHeure = (ms: number) =>
  ms
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(ms)
    : "";

const sansAccents = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const correspond = (recherche: string, ...champs: (string | null | undefined)[]) =>
  !recherche.trim() || sansAccents(champs.filter(Boolean).join(" ")).includes(sansAccents(recherche.trim()));

/** Page publique d'un artisan ou d'un magasin (les boutiques inscrites n'en ont pas encore). */
function lienPublic(type: "artisan" | "magasin" | "boutique", id: string): string | null {
  if (type === "artisan") return `/artisans/${id}`;
  return boutiques.some((b) => b.id === id) ? `/quincaillerie/boutique/${id}` : null;
}

function Pastille({ ton, children }: { ton: "attente" | "ok" | "non" | "neutre"; children: React.ReactNode }) {
  const tons = {
    attente: "bg-accent/20 text-accent-ink",
    ok: "bg-success/10 text-success",
    non: "bg-destructive/10 text-destructive",
    neutre: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tons[ton]}`}>{children}</span>;
}

/** Bouton d'action : affiche un sablier pendant l'opération. */
function Action({
  onClick,
  children,
  ton = "neutre",
  confirmer,
}: {
  onClick: () => Promise<void>;
  children: React.ReactNode;
  ton?: "principal" | "neutre" | "danger";
  /** question posée avant une action irréversible */
  confirmer?: string;
}) {
  const [occupe, setOccupe] = useState(false);
  const tons = {
    principal: "bg-primary text-primary-foreground",
    neutre: "bg-card text-foreground ring-1 ring-border hover:ring-primary",
    danger: "bg-card text-destructive ring-1 ring-destructive/40 hover:bg-destructive/5",
  };
  return (
    <button
      type="button"
      disabled={occupe}
      onClick={async () => {
        if (confirmer && !window.confirm(confirmer)) return;
        setOccupe(true);
        try {
          await onClick();
        } finally {
          setOccupe(false);
        }
      }}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${tons[ton]}`}
    >
      {occupe && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function Filtres<T extends string>({
  valeur,
  options,
  onChange,
  recherche,
  onRecherche,
}: {
  valeur: T;
  options: { id: T; label: string; n: number }[];
  onChange: (v: T) => void;
  recherche: string;
  onRecherche: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={valeur === o.id}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
            valeur === o.id ? "bg-secondary text-primary ring-1 ring-primary" : "bg-card ring-1 ring-border"
          }`}
        >
          {o.label} <span className="text-muted-foreground">· {o.n}</span>
        </button>
      ))}
      <label className="flex min-w-0 basis-full items-center gap-2 rounded-full bg-card px-3 py-1.5 ring-1 ring-border sm:ml-auto sm:max-w-xs sm:flex-1 sm:basis-auto">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">Rechercher</span>
        <input
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder="Rechercher…"
          className="w-full min-w-0 bg-transparent text-sm outline-none"
        />
      </label>
    </div>
  );
}

const Vide = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">{children}</p>
);

const Carte = ({ children }: { children: React.ReactNode }) => (
  <li className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03] md:p-5">{children}</li>
);

function Etoiles({ note }: { note: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${note} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`size-3.5 ${i < Math.round(note) ? "fill-star text-star" : "text-border"}`} />
      ))}
      <strong className="ml-1 text-sm">{note.toFixed(1).replace(".", ",")}</strong>
    </span>
  );
}

// ——— Tableau de bord ———

export function TableauDeBord({ d, ouvrir }: { d: Donnees; ouvrir: (o: Onglet) => void }) {
  const publies = d.avis.filter((v) => v.statut === "publie");
  const moyenne = publies.length ? publies.reduce((s, v) => s + v.note, 0) / publies.length : 0;
  const aFaire = [
    { o: "avis" as const, n: d.avis.filter((v) => v.statut === "a_moderer").length, t: "avis à modérer" },
    { o: "pros" as const, n: d.pros.filter((p) => p.statut === "en_verification").length, t: "professionnels à vérifier" },
    { o: "realisations" as const, n: d.realisations.filter((r) => !r.verifiee).length, t: "réalisations à vérifier" },
    { o: "contacts" as const, n: d.contacts.filter((c) => c.statut === "nouveau").length, t: "messages non traités" },
    { o: "signalements" as const, n: d.signalements.filter((s) => s.statut === "nouveau").length, t: "signalements à traiter" },
  ];
  const chiffres = [
    { o: "avis" as const, n: String(publies.length), t: "avis publiés" },
    { o: "avis" as const, n: publies.length ? `${moyenne.toFixed(1).replace(".", ",")}/5` : "–", t: "note moyenne des avis" },
    { o: "pros" as const, n: String(d.pros.filter((p) => p.statut === "verifie").length), t: "professionnels vérifiés" },
    { o: "clients" as const, n: String(d.comptes.length), t: "comptes clients" },
  ];
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold">À traiter</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {aFaire.map((x) => (
            <li key={x.t}>
              <button
                type="button"
                onClick={() => ouvrir(x.o)}
                className={`h-full w-full rounded-2xl p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  x.n ? "bg-foreground text-white" : "bg-card"
                }`}
              >
                <p className="font-serif text-4xl">{x.n}</p>
                <p className={`mt-1 text-sm ${x.n ? "text-white/75" : "text-muted-foreground"}`}>{x.t}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-bold">La plateforme</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {chiffres.map((x) => (
            <li key={x.t}>
              <button
                type="button"
                onClick={() => ouvrir(x.o)}
                className="h-full w-full rounded-2xl bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="font-serif text-3xl text-primary">{x.n}</p>
                <p className="mt-1 text-sm text-muted-foreground">{x.t}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ——— Avis ———

const MOTIFS_REFUS = [
  "Propos injurieux ou diffamatoires",
  "Avis faux ou suspect",
  "Ne concerne pas ce professionnel",
  "Contient des données personnelles",
  "Autre",
];
const RECO = { oui: "Recommande", reserves: "Recommande avec réserves", non: "Ne recommande pas" } as const;
const EXPERIENCE = {
  prestation: "Dit avoir bénéficié de la prestation",
  achat: "Dit avoir acheté dans le magasin",
  devis: "A seulement demandé un devis",
  contact: "A seulement pris contact",
} as const;

function Refuser({ onRefuser, libelle = "Refuser" }: { onRefuser: (motif: string) => Promise<void>; libelle?: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState(MOTIFS_REFUS[0]);
  if (!ouvert)
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-xs font-bold text-destructive ring-1 ring-destructive/40"
      >
        <X className="size-3.5" /> {libelle}
      </button>
    );
  return (
    <span className="flex flex-wrap items-center gap-2 rounded-lg bg-destructive/5 p-1.5">
      <label className="sr-only" htmlFor="motif-refus">
        Motif du refus
      </label>
      <select id="motif-refus" value={motif} onChange={(e) => setMotif(e.target.value)} className="rounded-md border border-border bg-white px-2 py-1.5 text-xs">
        {MOTIFS_REFUS.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>
      <Action ton="danger" onClick={() => onRefuser(motif)}>
        Confirmer
      </Action>
      <button type="button" onClick={() => setOuvert(false)} className="px-1 text-xs font-semibold text-muted-foreground">
        Annuler
      </button>
    </span>
  );
}

export function PanneauAvis({ avis, agir }: { avis: AvisDoc[]; agir: Agir }) {
  const [filtre, setFiltre] = useState<"a_moderer" | "publie" | "refuse" | "tous">("a_moderer");
  const [recherche, setRecherche] = useState("");
  const liste = avis.filter(
    (v) => (filtre === "tous" || v.statut === filtre) && correspond(recherche, v.auteur, v.cibleNom, v.texte),
  );
  const moderer = (v: AvisDoc, champs: Partial<Pick<AvisDoc, "statut" | "verifie" | "motifRefus">>) =>
    agir((a) =>
      a.modererAvis(v.id, {
        statut: champs.statut ?? v.statut,
        verifie: champs.verifie ?? v.verifie,
        motifRefus: champs.motifRefus === undefined ? v.motifRefus : champs.motifRefus,
      }),
    );

  return (
    <div className="space-y-4">
      <Filtres
        valeur={filtre}
        onChange={setFiltre}
        recherche={recherche}
        onRecherche={setRecherche}
        options={[
          { id: "a_moderer", label: "À modérer", n: avis.filter((v) => v.statut === "a_moderer").length },
          { id: "publie", label: "Publiés", n: avis.filter((v) => v.statut === "publie").length },
          { id: "refuse", label: "Refusés", n: avis.filter((v) => v.statut === "refuse").length },
          { id: "tous", label: "Tous", n: avis.length },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Un avis n’est visible qu’une fois publié. « Expérience confirmée » ajoute le badge « Prestation confirmée » ou
        « Achat confirmé » : à cocher seulement après avoir vérifié la prestation ou l’achat. Ne retirez jamais un avis
        négatif parce qu’il est négatif.
      </p>
      {liste.length === 0 ? (
        <Vide>Aucun avis ici.</Vide>
      ) : (
        <ul className="space-y-3">
          {liste.map((v) => {
            const lien = lienPublic(v.cibleType, v.cibleId);
            return (
              <Carte key={v.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {v.cibleType === "magasin" ? "Magasin" : "Artisan"} ·{" "}
                      {lien ? (
                        <Link href={lien} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
                          {v.cibleNom} <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        v.cibleNom
                      )}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 font-bold">
                      {v.auteur}
                      {v.statut === "a_moderer" && <Pastille ton="attente">À modérer</Pastille>}
                      {v.statut === "publie" && <Pastille ton="ok">Publié</Pastille>}
                      {v.statut === "refuse" && <Pastille ton="non">Refusé</Pastille>}
                      {v.verifie && <Pastille ton="ok">Expérience confirmée</Pastille>}
                    </p>
                  </div>
                  <div className="text-right">
                    <Etoiles note={v.note} />
                    <p className="mt-1 text-xs text-muted-foreground">Reçu le {dateHeure(v.creeLe)}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm whitespace-pre-line">{v.texte || <em className="text-muted-foreground">Sans commentaire</em>}</p>

                <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold text-foreground">Expérience : </dt>
                    <dd className="inline">
                      {EXPERIENCE[v.experience]}
                      {v.date ? ` (${moisLisible(v.date)})` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-foreground">Recommandation : </dt>
                    <dd className="inline">{RECO[v.recommandation]}</dd>
                  </div>
                  {Object.entries(v.notes).map(([c, n]) => (
                    <div key={c}>
                      <dt className="inline">{c} : </dt>
                      <dd className="inline font-semibold text-foreground">{n}/5</dd>
                    </div>
                  ))}
                  {v.motifRefus && (
                    <div className="sm:col-span-2">
                      <dt className="inline font-semibold text-destructive">Motif du refus : </dt>
                      <dd className="inline">{v.motifRefus}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  {v.statut !== "publie" && (
                    <>
                      <Action ton="principal" onClick={() => moderer(v, { statut: "publie", motifRefus: null })}>
                        <Check className="size-3.5" /> Publier
                      </Action>
                      {!v.verifie && (v.experience === "prestation" || v.experience === "achat") && (
                        <Action onClick={() => moderer(v, { statut: "publie", verifie: true, motifRefus: null })}>
                          <BadgeCheck className="size-3.5" /> Publier avec expérience confirmée
                        </Action>
                      )}
                    </>
                  )}
                  {v.statut === "publie" &&
                    (v.verifie ? (
                      <Action onClick={() => moderer(v, { verifie: false })}>Retirer la confirmation</Action>
                    ) : (
                      (v.experience === "prestation" || v.experience === "achat") && (
                        <Action onClick={() => moderer(v, { verifie: true })}>
                          <BadgeCheck className="size-3.5" /> Confirmer l’expérience
                        </Action>
                      )
                    ))}
                  {v.statut !== "refuse" && (
                    <Refuser
                      libelle={v.statut === "publie" ? "Dépublier" : "Refuser"}
                      onRefuser={(motif) => moderer(v, { statut: "refuse", motifRefus: motif })}
                    />
                  )}
                  {v.statut === "refuse" && (
                    <Action
                      ton="danger"
                      confirmer="Supprimer définitivement cet avis ? Cette action est irréversible."
                      onClick={() => agir((a) => a.supprimerAvis(v.id))}
                    >
                      <Trash2 className="size-3.5" /> Supprimer
                    </Action>
                  )}
                </div>
              </Carte>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ——— Professionnels ———

function NumeroPrive({ id }: { id: string }) {
  const [numero, setNumero] = useState<string | null | undefined>(undefined);
  if (numero === undefined)
    return (
      <Action
        onClick={async () => {
          const a = await import("@/lib/backend/admin");
          setNumero(await a.telephonePrive(id).catch(() => null));
        }}
      >
        <Phone className="size-3.5" /> Voir le numéro
      </Action>
    );
  return numero ? (
    <a href={`tel:${numero.replace(/\s/g, "")}`} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-primary">
      <Phone className="size-3.5" /> {numero}
    </a>
  ) : (
    <span className="px-2 py-2 text-xs text-muted-foreground">Numéro non renseigné</span>
  );
}

export function PanneauPros({ pros, agir }: { pros: Api.ProAdmin[]; agir: Agir }) {
  const [filtre, setFiltre] = useState<"en_verification" | "verifie" | "suspendu" | "tous">(
    pros.some((p) => p.statut === "en_verification") ? "en_verification" : "tous",
  );
  const [recherche, setRecherche] = useState("");
  const liste = pros.filter(
    (p) => (filtre === "tous" || p.statut === filtre) && correspond(recherche, p.nom, p.libelleMetier, p.ville, p.quartier),
  );
  const statut = (id: string, s: Api.ProAdmin["statut"]) => agir((a) => a.changerStatutPro(id, s));

  return (
    <div className="space-y-4">
      <Filtres
        valeur={filtre}
        onChange={setFiltre}
        recherche={recherche}
        onRecherche={setRecherche}
        options={[
          { id: "en_verification", label: "À vérifier", n: pros.filter((p) => p.statut === "en_verification").length },
          { id: "verifie", label: "Vérifiés", n: pros.filter((p) => p.statut === "verifie").length },
          { id: "suspendu", label: "Suspendus", n: pros.filter((p) => p.statut === "suspendu").length },
          { id: "tous", label: "Tous", n: pros.length },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Un profil n’apparaît sur le site qu’une fois vérifié (pièce d’identité, références). Un profil suspendu
        disparaît du site sans être supprimé. La mise à jour du site public peut prendre quelques minutes.
      </p>
      {liste.length === 0 ? (
        <Vide>Aucun professionnel ici.</Vide>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {liste.map((p) => {
            const lien = p.statut === "verifie" ? lienPublic(p.type, p.id) : null;
            return (
              <Carte key={p.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{p.nom}</p>
                  {p.statut === "en_verification" && <Pastille ton="attente">À vérifier</Pastille>}
                  {p.statut === "verifie" && <Pastille ton="ok">Vérifié</Pastille>}
                  {p.statut === "suspendu" && <Pastille ton="non">Suspendu</Pastille>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.libelleMetier} · {p.quartier}
                  {p.ville ? `, ${p.ville}` : ""}
                  {p.creeLe ? ` · inscrit le ${dateHeure(p.creeLe)}` : ""}
                </p>
                {p.description && <p className="mt-2 line-clamp-2 text-sm">{p.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  {p.statut !== "verifie" && (
                    <Action ton="principal" onClick={() => statut(p.id, "verifie")}>
                      <BadgeCheck className="size-3.5" /> Vérifier
                    </Action>
                  )}
                  {p.statut !== "suspendu" && (
                    <Action
                      ton="danger"
                      confirmer={`Suspendre ${p.nom} ? Son profil disparaîtra du site.`}
                      onClick={() => statut(p.id, "suspendu")}
                    >
                      <ShieldOff className="size-3.5" /> Suspendre
                    </Action>
                  )}
                  {p.statut !== "en_verification" && (
                    <Action onClick={() => statut(p.id, "en_verification")}>
                      <RotateCcw className="size-3.5" /> Remettre en vérification
                    </Action>
                  )}
                  <NumeroPrive id={p.id} />
                  {lien && (
                    <Link href={lien} target="_blank" className="flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-primary hover:underline">
                      Voir sur le site <ExternalLink className="size-3.5" />
                    </Link>
                  )}
                </div>
              </Carte>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ——— Réalisations ———

export function PanneauRealisations({ realisations, agir }: { realisations: Api.RealisationAdmin[]; agir: Agir }) {
  const [filtre, setFiltre] = useState<"a_verifier" | "verifiees" | "toutes">("a_verifier");
  const [recherche, setRecherche] = useState("");
  const liste = realisations.filter(
    (r) =>
      (filtre === "toutes" || (filtre === "verifiees" ? r.verifiee : !r.verifiee)) &&
      correspond(recherche, r.titre, r.proNom, r.quartier),
  );
  return (
    <div className="space-y-4">
      <Filtres
        valeur={filtre}
        onChange={setFiltre}
        recherche={recherche}
        onRecherche={setRecherche}
        options={[
          { id: "a_verifier", label: "À vérifier", n: realisations.filter((r) => !r.verifiee).length },
          { id: "verifiees", label: "Vérifiées", n: realisations.filter((r) => r.verifiee).length },
          { id: "toutes", label: "Toutes", n: realisations.length },
        ]}
      />
      {liste.length === 0 ? (
        <Vide>Aucune réalisation ici.</Vide>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((r) => (
            <li key={`${r.proId}/${r.id}`} className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03]">
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- photos d'origines variées (Storage, maquette)
                <img src={r.image} alt="" className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-muted text-xs text-muted-foreground">Sans photo</div>
              )}
              <div className="p-4">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {r.titre}
                  {r.verifiee ? <Pastille ton="ok">Vérifiée</Pastille> : <Pastille ton="attente">À vérifier</Pastille>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.proNom} · {r.quartier}
                  {r.date ? ` · ${r.date}` : ""}
                </p>
                {r.description && <p className="mt-2 line-clamp-3 text-sm">{r.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.verifiee ? (
                    <Action onClick={() => agir((a) => a.verifierRealisation(r.proId, r.id, false))}>
                      <EyeOff className="size-3.5" /> Retirer la vérification
                    </Action>
                  ) : (
                    <Action ton="principal" onClick={() => agir((a) => a.verifierRealisation(r.proId, r.id, true))}>
                      <BadgeCheck className="size-3.5" /> Marquer vérifiée
                    </Action>
                  )}
                  <Link
                    href={`/artisans/${r.proId}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-primary hover:underline"
                  >
                    Profil <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ——— Messages de contact ———

export function PanneauContacts({ contacts, agir }: { contacts: ContactDoc[]; agir: Agir }) {
  const [filtre, setFiltre] = useState<"nouveau" | "traite" | "tous">("nouveau");
  const [recherche, setRecherche] = useState("");
  const liste = contacts.filter(
    (c) => (filtre === "tous" || c.statut === filtre) && correspond(recherche, c.nom, c.sujet, c.message, c.email, c.telephone),
  );
  return (
    <div className="space-y-4">
      <Filtres
        valeur={filtre}
        onChange={setFiltre}
        recherche={recherche}
        onRecherche={setRecherche}
        options={[
          { id: "nouveau", label: "Non traités", n: contacts.filter((c) => c.statut === "nouveau").length },
          { id: "traite", label: "Traités", n: contacts.filter((c) => c.statut === "traite").length },
          { id: "tous", label: "Tous", n: contacts.length },
        ]}
      />
      {liste.length === 0 ? (
        <Vide>Aucun message ici.</Vide>
      ) : (
        <ul className="space-y-3">
          {liste.map((c) => (
            <Carte key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {c.nom}
                    {c.statut === "nouveau" ? <Pastille ton="attente">Non traité</Pastille> : <Pastille ton="neutre">Traité</Pastille>}
                  </p>
                  <p className="text-xs font-semibold text-primary">{c.sujet}</p>
                </div>
                <p className="text-xs text-muted-foreground">{dateHeure(c.recuLe)}</p>
              </div>
              <p className="mt-3 text-sm whitespace-pre-line">{c.message}</p>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                {c.telephone && (
                  <a href={`tel:${c.telephone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-primary">
                    <Phone className="size-3.5" /> {c.telephone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-primary">
                    <Mail className="size-3.5" /> {c.email}
                  </a>
                )}
                {c.statut === "nouveau" ? (
                  <Action ton="principal" onClick={() => agir((a) => a.traiterContact(c.id, "traite"))}>
                    <Check className="size-3.5" /> Marquer traité
                  </Action>
                ) : (
                  <Action onClick={() => agir((a) => a.traiterContact(c.id, "nouveau"))}>
                    <RotateCcw className="size-3.5" /> Rouvrir
                  </Action>
                )}
              </div>
            </Carte>
          ))}
        </ul>
      )}
    </div>
  );
}

// ——— Signalements ———

export function PanneauSignalements({
  signalements,
  avis,
  agir,
  ouvrir,
}: {
  signalements: SignalementDoc[];
  avis: AvisDoc[];
  agir: Agir;
  ouvrir: (o: Onglet) => void;
}) {
  const [filtre, setFiltre] = useState<"nouveau" | "traite" | "tous">("nouveau");
  const [recherche, setRecherche] = useState("");
  const liste = signalements.filter(
    (s) => (filtre === "tous" || s.statut === filtre) && correspond(recherche, s.libelle, s.motif),
  );
  return (
    <div className="space-y-4">
      <Filtres
        valeur={filtre}
        onChange={setFiltre}
        recherche={recherche}
        onRecherche={setRecherche}
        options={[
          { id: "nouveau", label: "À traiter", n: signalements.filter((s) => s.statut === "nouveau").length },
          { id: "traite", label: "Traités", n: signalements.filter((s) => s.statut === "traite").length },
          { id: "tous", label: "Tous", n: signalements.length },
        ]}
      />
      {liste.length === 0 ? (
        <Vide>Aucun signalement ici.</Vide>
      ) : (
        <ul className="space-y-3">
          {liste.map((s) => {
            const avisVise = s.cible === "avis" ? avis.find((v) => v.id === s.cibleId) : undefined;
            const lienProfil = s.cible === "profil" ? lienPublic("artisan", s.cibleId) : null;
            return (
              <Carte key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {s.libelle || s.cibleId}
                    {s.statut === "nouveau" ? <Pastille ton="attente">À traiter</Pastille> : <Pastille ton="neutre">Traité</Pastille>}
                  </p>
                  <p className="text-xs text-muted-foreground">{dateHeure(s.creeLe)}</p>
                </div>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">Motif : </span>
                  {s.motif}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  {s.statut === "nouveau" ? (
                    <Action ton="principal" onClick={() => agir((a) => a.traiterSignalement(s.id, "traite"))}>
                      <Check className="size-3.5" /> Marquer traité
                    </Action>
                  ) : (
                    <Action onClick={() => agir((a) => a.traiterSignalement(s.id, "nouveau"))}>
                      <RotateCcw className="size-3.5" /> Rouvrir
                    </Action>
                  )}
                  {avisVise && (
                    <button type="button" onClick={() => ouvrir("avis")} className="px-2 py-2 text-xs font-bold text-primary hover:underline">
                      Gérer l’avis dans « Avis »
                    </button>
                  )}
                  {lienProfil && (
                    <Link href={lienProfil} target="_blank" className="flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-primary hover:underline">
                      Voir le profil <ExternalLink className="size-3.5" />
                    </Link>
                  )}
                </div>
              </Carte>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ——— Clients ———

export function PanneauClients({ comptes }: { comptes: Api.CompteAdmin[] }) {
  const [recherche, setRecherche] = useState("");
  const liste = comptes.filter((c) => correspond(recherche, c.prenom, c.nom, c.telephone, c.ville));
  return (
    <div className="space-y-4">
      <label className="flex max-w-xs items-center gap-2 rounded-full bg-card px-3 py-1.5 ring-1 ring-border">
        <Search className="size-4 text-muted-foreground" />
        <span className="sr-only">Rechercher un client</span>
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher…" className="w-full bg-transparent text-sm outline-none" />
      </label>
      {liste.length === 0 ? (
        <Vide>Aucun compte client.</Vide>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Téléphone</th>
                <th className="px-4 py-3 font-semibold">Ville</th>
                <th className="px-4 py-3 font-semibold">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {liste.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold">
                    {c.prenom} {c.nom}
                  </td>
                  <td className="px-4 py-3">
                    {c.telephone && (
                      <a href={`tel:${c.telephone.replace(/\s/g, "")}`} className="text-primary hover:underline">
                        {c.telephone}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">{c.ville}</td>
                  <td className="px-4 py-3 text-muted-foreground">{dateHeure(c.creeLe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
