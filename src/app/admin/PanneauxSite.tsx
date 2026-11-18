"use client";

import { useState } from "react";
import { Check, Download, Pause, Pencil, Phone, Play, Plus, RotateCcw, Search, Trash2, Upload, X } from "lucide-react";
import { categories } from "@/lib/metiers";
import { messageErreur } from "@/lib/backend/erreurs";
import type * as Api from "@/lib/backend/admin";
import {
  EMPLACEMENTS_PUB,
  type DemandeAnnonceurDoc,
  type Emplacement,
  type EntreeJournal,
  type PropositionMetierDoc,
  type PubDoc,
  pubEnDiffusion,
} from "@/lib/backend/modele";
import { oublierReglagesPubs } from "@/lib/backend/publicites";
import { Action, type Agir, Carte, Filtres, Pastille, Vide, correspond, dateHeure } from "./Panneaux";
import { dateCsv, telechargerCsv } from "./csv";

// ——— Publicités : campagnes ———

export const EMPLACEMENTS: Record<Emplacement, { nom: string; format: string; video: boolean }> = {
  "accueil-1": { nom: "Accueil · grand visuel n° 1", format: "Image 16:9 ou 21:9 (JPG/PNG)", video: true },
  "accueil-2": { nom: "Accueil · grand visuel n° 2", format: "Vidéo MP4 16:9 (15 à 30 s, sans le son) ou image", video: true },
  pages: { nom: "Bandeau sur toutes les pages", format: "Image bandeau 6:1 (ex. 1800 × 300 px)", video: true },
  "laterale-gauche": { nom: "Colonne de droite · bloc 1", format: "Image 300 × 250 px", video: false },
  "laterale-droite": { nom: "Colonne de droite · bloc 2", format: "Image 300 × 250 px", video: false },
};

const aujourdhui = () => {
  const d = new Date();
  const deux = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
};

type EtatPub = "en_ligne" | "programmee" | "terminee" | "suspendue";

function etatPub(p: PubDoc, jour: string): EtatPub {
  if (p.statut === "suspendue") return "suspendue";
  if (pubEnDiffusion(p, jour)) return "en_ligne";
  if (p.debut && jour < p.debut) return "programmee";
  return "terminee";
}

const PASTILLE_ETAT: Record<EtatPub, { ton: "ok" | "attente" | "non" | "neutre"; texte: string }> = {
  en_ligne: { ton: "ok", texte: "En ligne" },
  programmee: { ton: "attente", texte: "Programmée" },
  terminee: { ton: "neutre", texte: "Terminée" },
  suspendue: { ton: "non", texte: "Suspendue" },
};

const champ =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

const CAMPAGNE_VIDE: Api.CampagnePub = {
  emplacement: "accueil-1",
  type: "image",
  src: "",
  poster: "",
  annonceur: "",
  titre: "",
  texte: "",
  cta: "En savoir plus",
  href: "",
  statut: "active",
  debut: null,
  fin: null,
};

/** Formulaire de création ou de modification d'une campagne. */
function FormulairePub({ campagne, agir, fermer }: { campagne: PubDoc | null; agir: Agir; fermer: () => void }) {
  const [r, setR] = useState<Api.CampagnePub>(() => {
    if (!campagne) return CAMPAGNE_VIDE;
    const c = campagne;
    return {
      emplacement: c.emplacement,
      type: c.type,
      src: c.src,
      poster: c.poster ?? "",
      annonceur: c.annonceur,
      titre: c.titre,
      texte: c.texte ?? "",
      cta: c.cta,
      href: c.href,
      statut: c.statut,
      debut: c.debut,
      fin: c.fin,
    };
  });
  const [envoi, setEnvoi] = useState<"" | "src" | "poster">("");
  const [erreur, setErreur] = useState("");
  const maj = (champs: Partial<Api.CampagnePub>) => setR((x) => ({ ...x, ...champs }));
  const format = EMPLACEMENTS[r.emplacement];

  const envoyer = async (cible: "src" | "poster", fichier: File | undefined) => {
    if (!fichier) return;
    const video = fichier.type.startsWith("video/");
    if (fichier.size > (video ? 50 : 5) * 1024 * 1024) {
      setErreur(video ? "Vidéo trop lourde (50 Mo maximum)." : "Image trop lourde (5 Mo maximum).");
      return;
    }
    setErreur("");
    setEnvoi(cible);
    try {
      const a = await import("@/lib/backend/admin");
      const url = await a.envoyerFichierPub(r.emplacement, fichier);
      maj(cible === "src" ? { src: url, type: video ? "video" : "image" } : { poster: url });
    } catch (e) {
      setErreur(e instanceof Error && !("code" in e) ? e.message : messageErreur(e));
    } finally {
      setEnvoi("");
    }
  };

  const enregistrer = async () => {
    if (!r.src || !r.annonceur.trim() || !r.titre.trim() || !r.href.trim()) {
      setErreur("Un visuel, un annonceur, un titre et un lien sont nécessaires.");
      return;
    }
    if (r.debut && r.fin && r.fin < r.debut) {
      setErreur("La date de fin est avant la date de début.");
      return;
    }
    if (r.type === "video" && !format.video) {
      setErreur("Cet emplacement n’accepte que des images.");
      return;
    }
    setErreur("");
    let ok = false;
    await agir(async (a) => {
      if (campagne) await a.modifierPublicite(campagne.id, r);
      else await a.creerPublicite(r);
      oublierReglagesPubs();
      ok = true;
    });
    if (ok) fermer();
  };

  const fichier = (cible: "src" | "poster", accepte: string) => (
    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-secondary px-3 py-2.5 text-xs font-bold text-primary">
      <Upload className="size-3.5" /> {envoi === cible ? "Envoi…" : "Envoyer un fichier"}
      <input type="file" accept={accepte} className="sr-only" onChange={(e) => void envoyer(cible, e.target.files?.[0])} disabled={Boolean(envoi)} />
    </label>
  );

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm ring-2 ring-primary/30">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{campagne ? "Modifier la publicité" : "Nouvelle publicité"}</h3>
        <button type="button" onClick={fermer} aria-label="Fermer" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-5" />
        </button>
      </div>
      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold sm:col-span-2">
            Emplacement
            <select
              value={r.emplacement}
              onChange={(e) => {
                const emplacement = e.target.value as Emplacement;
                maj({ emplacement, ...(EMPLACEMENTS[emplacement].video ? {} : { type: "image" }) });
              }}
              className={`mt-1 ${champ}`}
            >
              {EMPLACEMENTS_PUB.map((e) => (
                <option key={e} value={e}>
                  {EMPLACEMENTS[e].nom}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">Format conseillé : {format.format}</span>
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            Visuel
            <span className="mt-1 flex flex-wrap gap-2 sm:flex-nowrap">
              <input value={r.src} onChange={(e) => maj({ src: e.target.value })} placeholder="Adresse de l’image ou de la vidéo" className={champ} />
              {fichier("src", format.video ? "image/*,video/mp4" : "image/*")}
            </span>
          </label>
          {format.video && (
            <label className="block text-sm font-semibold">
              Type
              <select value={r.type} onChange={(e) => maj({ type: e.target.value as "image" | "video" })} className={`mt-1 ${champ}`}>
                <option value="image">Image</option>
                <option value="video">Vidéo</option>
              </select>
            </label>
          )}
          {r.type === "video" && (
            <label className="block text-sm font-semibold">
              Image d’attente de la vidéo
              <span className="mt-1 flex flex-wrap gap-2 sm:flex-nowrap">
                <input value={r.poster ?? ""} onChange={(e) => maj({ poster: e.target.value })} placeholder="Facultatif" className={champ} />
                {fichier("poster", "image/*")}
              </span>
            </label>
          )}
          <label className="block text-sm font-semibold">
            Annonceur
            <input value={r.annonceur} onChange={(e) => maj({ annonceur: e.target.value })} maxLength={60} className={`mt-1 ${champ}`} />
          </label>
          <label className="block text-sm font-semibold">
            Titre
            <input value={r.titre} onChange={(e) => maj({ titre: e.target.value })} maxLength={80} className={`mt-1 ${champ}`} />
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            Texte court <span className="font-normal text-muted-foreground">(facultatif)</span>
            <input value={r.texte ?? ""} onChange={(e) => maj({ texte: e.target.value })} maxLength={140} className={`mt-1 ${champ}`} />
          </label>
          <label className="block text-sm font-semibold">
            Texte du bouton
            <input value={r.cta} onChange={(e) => maj({ cta: e.target.value })} maxLength={30} className={`mt-1 ${champ}`} />
          </label>
          <label className="block text-sm font-semibold">
            Lien (page du site ou site de l’annonceur)
            <input value={r.href} onChange={(e) => maj({ href: e.target.value })} placeholder="/quincaillerie/… ou https://…" className={`mt-1 ${champ}`} />
          </label>
          <label className="block text-sm font-semibold">
            Début de diffusion <span className="font-normal text-muted-foreground">(facultatif)</span>
            <input type="date" value={r.debut ?? ""} onChange={(e) => maj({ debut: e.target.value || null })} className={`mt-1 ${champ}`} />
          </label>
          <label className="block text-sm font-semibold">
            Fin de diffusion <span className="font-normal text-muted-foreground">(incluse, facultative)</span>
            <input type="date" value={r.fin ?? ""} onChange={(e) => maj({ fin: e.target.value || null })} className={`mt-1 ${champ}`} />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
            <input type="checkbox" checked={r.statut === "active"} onChange={(e) => maj({ statut: e.target.checked ? "active" : "suspendue" })} className="size-4" />
            Diffuser cette publicité (décoché : enregistrée mais suspendue)
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold">Aperçu</p>
          <div className="mt-1">
            <Apercu src={r.src} type={r.type} poster={r.poster} />
          </div>
          <p className="mt-2 text-xs font-semibold tracking-wide text-accent-ink uppercase">{r.annonceur || "Annonceur"}</p>
          <p className="font-serif text-lg leading-tight">{r.titre || "Titre de la publicité"}</p>
          {r.texte && <p className="mt-1 text-sm text-muted-foreground">{r.texte}</p>}
        </div>
      </div>
      {erreur && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{erreur}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Action ton="principal" onClick={enregistrer}>
          <Check className="size-3.5" /> {campagne ? "Enregistrer les modifications" : "Créer la publicité"}
        </Action>
        <button type="button" onClick={fermer} className="px-2 text-xs font-semibold text-muted-foreground">
          Annuler
        </button>
      </div>
    </div>
  );
}

function Apercu({ src, type, poster }: { src?: string; type?: "image" | "video"; poster?: string }) {
  if (!src) return <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">Aucun visuel</div>;
  return type === "video" ? (
    <video src={src} poster={poster} muted loop autoPlay playsInline className="aspect-[16/9] w-full rounded-xl bg-foreground object-cover" />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une image locale ou du Storage
    <img src={src} alt="" className="aspect-[16/9] w-full rounded-xl object-cover" />
  );
}

export function PanneauPublicites({ publicites, agir }: { publicites: PubDoc[]; agir: Agir }) {
  const [formulaire, setFormulaire] = useState<PubDoc | "nouvelle" | null>(null);
  const [filtre, setFiltre] = useState<EtatPub | "toutes">("toutes");
  const [emplacement, setEmplacement] = useState<Emplacement | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const jour = aujourdhui();
  const avecEtat = publicites.map((p) => ({ p, etat: etatPub(p, jour) }));
  const liste = avecEtat.filter(
    ({ p, etat }) =>
      (filtre === "toutes" || etat === filtre) &&
      (emplacement === "tous" || p.emplacement === emplacement) &&
      correspond(recherche, p.annonceur, p.titre, p.href),
  );
  const n = (e: EtatPub) => avecEtat.filter((x) => x.etat === e).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Vous créez ici les publicités du site. Plusieurs publicités en ligne sur le même emplacement s’affichent à tour
          de rôle ; sans publicité, l’espace propose « Votre publicité ici ».
        </p>
        <button
          type="button"
          onClick={() => setFormulaire("nouvelle")}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm"
        >
          <Plus className="size-4" /> Nouvelle publicité
        </button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {EMPLACEMENTS_PUB.map((e) => {
          const enLigne = avecEtat.filter((x) => x.p.emplacement === e && x.etat === "en_ligne").length;
          return (
            <li key={e}>
              <button
                type="button"
                onClick={() => setEmplacement(emplacement === e ? "tous" : e)}
                aria-pressed={emplacement === e}
                className={`h-full w-full rounded-xl bg-card p-3 text-left text-xs shadow-sm ring-1 transition ${emplacement === e ? "ring-2 ring-primary" : "ring-black/[0.04] hover:ring-primary/40"}`}
              >
                <span className="block font-semibold">{EMPLACEMENTS[e].nom}</span>
                <span className={enLigne ? "text-success" : "text-muted-foreground"}>
                  {enLigne ? `${enLigne} en ligne` : "Espace libre"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {formulaire && (
        <FormulairePub
          key={formulaire === "nouvelle" ? "nouvelle" : formulaire.id}
          campagne={formulaire === "nouvelle" ? null : formulaire}
          agir={agir}
          fermer={() => setFormulaire(null)}
        />
      )}

      <Filtres
        valeur={filtre}
        onChange={setFiltre}
        recherche={recherche}
        onRecherche={setRecherche}
        exporter={() =>
          telechargerCsv(
            "publicites",
            liste.map(({ p, etat }) => ({
              annonceur: p.annonceur,
              titre: p.titre,
              emplacement: EMPLACEMENTS[p.emplacement].nom,
              etat: PASTILLE_ETAT[etat].texte,
              debut: p.debut,
              fin: p.fin,
              lien: p.href,
              visuel: p.src,
              creee_le: dateCsv(p.creeLe),
            })),
          )
        }
        options={[
          { id: "toutes", label: "Toutes", n: publicites.length },
          { id: "en_ligne", label: "En ligne", n: n("en_ligne") },
          { id: "programmee", label: "Programmées", n: n("programmee") },
          { id: "terminee", label: "Terminées", n: n("terminee") },
          { id: "suspendue", label: "Suspendues", n: n("suspendue") },
        ]}
      />

      {liste.length === 0 ? (
        <Vide>
          Aucune publicité ici.{" "}
          <button type="button" onClick={() => setFormulaire("nouvelle")} className="font-semibold text-primary hover:underline">
            Créer une publicité
          </button>
        </Vide>
      ) : (
        <ul className="space-y-3">
          {liste.map(({ p, etat }) => (
            <Carte key={p.id}>
              <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                <Apercu src={p.src} type={p.type} poster={p.poster} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {p.titre} <Pastille ton={PASTILLE_ETAT[etat].ton}>{PASTILLE_ETAT[etat].texte}</Pastille>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {p.annonceur} · {EMPLACEMENTS[p.emplacement].nom}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.debut || p.fin ? `Diffusion ${p.debut ? `du ${p.debut}` : ""} ${p.fin ? `jusqu’au ${p.fin}` : "sans date de fin"}` : "Diffusion sans dates limites"}
                    {p.href && <span className="block truncate">→ {p.href}</span>}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Action
                      onClick={async () => {
                        setFormulaire(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Pencil className="size-3.5" /> Modifier
                    </Action>
                    {p.statut === "active" ? (
                      <Action
                        onClick={() =>
                          agir(async (a) => {
                            await a.changerStatutPublicite(p, "suspendue");
                            oublierReglagesPubs();
                          })
                        }
                      >
                        <Pause className="size-3.5" /> Suspendre
                      </Action>
                    ) : (
                      <Action
                        ton="principal"
                        onClick={() =>
                          agir(async (a) => {
                            await a.changerStatutPublicite(p, "active");
                            oublierReglagesPubs();
                          })
                        }
                      >
                        <Play className="size-3.5" /> Réactiver
                      </Action>
                    )}
                    <Action
                      ton="danger"
                      confirmer={`Supprimer définitivement la publicité « ${p.titre} » ?`}
                      onClick={() =>
                        agir(async (a) => {
                          await a.supprimerPublicite(p);
                          oublierReglagesPubs();
                        })
                      }
                    >
                      <Trash2 className="size-3.5" /> Supprimer
                    </Action>
                  </div>
                </div>
              </div>
            </Carte>
          ))}
        </ul>
      )}
    </div>
  );
}

// ——— Demandes annonceurs ———

export function PanneauAnnonceurs({ demandes, agir }: { demandes: DemandeAnnonceurDoc[]; agir: Agir }) {
  const [filtre, setFiltre] = useState<"nouveau" | "traite" | "tous">("nouveau");
  const [recherche, setRecherche] = useState("");
  const liste = demandes.filter(
    (d) => (filtre === "tous" || d.statut === filtre) && correspond(recherche, d.nom, d.type, d.telephone, d.interets.join(" ")),
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
            "annonceurs",
            liste.map((d) => ({ recu_le: dateCsv(d.recuLe), nom: d.nom, type: d.type, telephone: d.telephone, interets: d.interets.join(", "), statut: d.statut })),
          )
        }
        options={[
          { id: "nouveau", label: "À rappeler", n: demandes.filter((d) => d.statut === "nouveau").length },
          { id: "traite", label: "Traitées", n: demandes.filter((d) => d.statut === "traite").length },
          { id: "tous", label: "Toutes", n: demandes.length },
        ]}
      />
      <p className="text-xs text-muted-foreground">Demandes envoyées depuis la page « Nos services » (formulaire « Être recontacté »).</p>
      {liste.length === 0 ? (
        <Vide>Aucune demande ici.</Vide>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {liste.map((d) => (
            <Carte key={d.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {d.nom}
                  {d.statut === "nouveau" ? <Pastille ton="attente">À rappeler</Pastille> : <Pastille ton="neutre">Traitée</Pastille>}
                </p>
                <p className="text-xs text-muted-foreground">{dateHeure(d.recuLe)}</p>
              </div>
              <p className="text-sm text-muted-foreground">{d.type}</p>
              {d.interets.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {d.interets.map((i) => (
                    <li key={i} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                      {i}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <a href={`tel:${d.telephone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-primary">
                  <Phone className="size-3.5" /> {d.telephone}
                </a>
                {d.statut === "nouveau" ? (
                  <Action ton="principal" onClick={() => agir((a) => a.traiterDemandeAnnonceur(d.id, "traite", d.nom))}>
                    <Check className="size-3.5" /> Marquer traitée
                  </Action>
                ) : (
                  <Action onClick={() => agir((a) => a.traiterDemandeAnnonceur(d.id, "nouveau", d.nom))}>
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

// ——— Métiers proposés ———

const nomCategorie = (id: string) => categories.find((c) => c.id === id)?.label ?? id;

export function PanneauMetiers({ propositions, agir }: { propositions: PropositionMetierDoc[]; agir: Agir }) {
  const [filtre, setFiltre] = useState<"nouveau" | "accepte" | "refuse" | "tous">("nouveau");
  const [recherche, setRecherche] = useState("");
  const liste = propositions.filter(
    (p) => (filtre === "tous" || p.statut === filtre) && correspond(recherche, p.nom, nomCategorie(p.categorie)),
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
            "metiers-proposes",
            liste.map((p) => ({ recu_le: dateCsv(p.recuLe), metier: p.nom, categorie: nomCategorie(p.categorie), statut: p.statut })),
          )
        }
        options={[
          { id: "nouveau", label: "À étudier", n: propositions.filter((p) => p.statut === "nouveau").length },
          { id: "accepte", label: "Acceptés", n: propositions.filter((p) => p.statut === "accepte").length },
          { id: "refuse", label: "Refusés", n: propositions.filter((p) => p.statut === "refuse").length },
          { id: "tous", label: "Tous", n: propositions.length },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Métiers proposés par les visiteurs sur la page « Tous les métiers ». Un métier accepté est à ajouter au
        catalogue (liste des métiers du site, avec son icône et sa catégorie).
      </p>
      {liste.length === 0 ? (
        <Vide>Aucune proposition ici.</Vide>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((p) => (
            <Carte key={p.id}>
              <p className="flex flex-wrap items-center gap-2 font-bold">
                {p.nom}
                {p.statut === "nouveau" && <Pastille ton="attente">À étudier</Pastille>}
                {p.statut === "accepte" && <Pastille ton="ok">Accepté</Pastille>}
                {p.statut === "refuse" && <Pastille ton="non">Refusé</Pastille>}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{nomCategorie(p.categorie)}</p>
              <p className="text-xs text-muted-foreground">{dateHeure(p.recuLe)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.statut !== "accepte" && (
                  <Action ton="principal" onClick={() => agir((a) => a.deciderPropositionMetier(p.id, "accepte", p.nom))}>
                    <Check className="size-3.5" /> Accepter
                  </Action>
                )}
                {p.statut !== "refuse" && (
                  <Action ton="danger" onClick={() => agir((a) => a.deciderPropositionMetier(p.id, "refuse", p.nom))}>
                    <X className="size-3.5" /> Refuser
                  </Action>
                )}
                {p.statut !== "nouveau" && (
                  <Action onClick={() => agir((a) => a.deciderPropositionMetier(p.id, "nouveau", p.nom))}>
                    <RotateCcw className="size-3.5" /> Remettre à l’étude
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

// ——— Journal ———

export function PanneauJournal({ journal }: { journal: EntreeJournal[] }) {
  const [recherche, setRecherche] = useState("");
  const liste = journal.filter((j) => correspond(recherche, j.action, j.cible, j.auteur));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex max-w-xs flex-1 items-center gap-2 rounded-full bg-card px-3 py-1.5 ring-1 ring-border">
          <Search className="size-4 text-muted-foreground" />
          <span className="sr-only">Rechercher dans le journal</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher…" className="w-full bg-transparent text-sm outline-none" />
        </label>
        <button
          type="button"
          onClick={() =>
            telechargerCsv(
              "journal",
              liste.map((j) => ({ date: dateCsv(j.date), action: j.action, objet: j.cible, par: j.auteur })),
            )
          }
          className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm font-semibold ring-1 ring-border hover:ring-primary"
        >
          <Download className="size-4" /> Exporter (CSV)
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Chaque action faite dans le backoffice est enregistrée ici, avec son auteur. Le journal ne peut être ni modifié
        ni effacé.
      </p>
      {liste.length === 0 ? (
        <Vide>Aucune action enregistrée.</Vide>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Objet</th>
                <th className="px-4 py-3 font-semibold">Par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {liste.map((j) => (
                <tr key={j.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{dateHeure(j.date)}</td>
                  <td className="px-4 py-3 font-semibold">{j.action}</td>
                  <td className="px-4 py-3">{j.cible}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{j.auteur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
