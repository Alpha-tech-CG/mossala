"use client";

import { useState } from "react";
import { ArrowLeft, Eye, LayoutList, Pencil, Plus, Save, Send, Sparkles, Trash2, X } from "lucide-react";
import { fcfa } from "@/lib/data";
import {
  RUBRIQUES_CHANTIER,
  UNITES,
  declinerDemande,
  devisVide,
  enregistrerDevis,
  fourchetteDevis,
  montantLigne,
  nouvelleLigne,
  nouvelleRubrique,
  proposerLignes,
  sousTotal,
  totalDevis,
  type ArticleCatalogue,
  type DemandeDevis,
  type Devis,
  type LigneDevis,
  type RubriqueDevis,
} from "@/lib/devis";
import { TableauDevis } from "./TableauDevis";

const champ =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

/** Champ numérique : vide = 0, accepte « 95 000 » ou « 95000 ». */
function Nombre({
  value,
  onChange,
  label,
  placeholder,
  facultatif,
}: {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  label: string;
  placeholder?: string;
  facultatif?: boolean;
}) {
  return (
    <input
      aria-label={label}
      inputMode="decimal"
      placeholder={placeholder}
      value={value === undefined ? "" : value.toLocaleString("fr-FR")}
      onChange={(e) => {
        const brut = e.target.value.replace(/[\s  ]/g, "").replace(",", ".");
        if (brut === "") return onChange(facultatif ? undefined : 0);
        const n = Number(brut);
        if (!Number.isNaN(n) && n >= 0) onChange(n);
      }}
      className={`${champ} text-right tabular-nums`}
    />
  );
}

/**
 * Éditeur de devis du professionnel (artisan ou boutique), en réponse à une demande en
 * langage naturel. `catalogue` : articles de la boutique, pour proposer des lignes au bon prix.
 */
export function EditeurDevis({
  demande,
  catalogue,
  onFermer,
}: {
  demande: DemandeDevis;
  catalogue?: ArticleCatalogue[];
  onFermer: () => void;
}) {
  const [devis, setDevis] = useState<Devis>(() => demande.devis ?? devisVide(demande.pro.type));
  const [apercu, setApercu] = useState(false);
  const [prixMarche, setPrixMarche] = useState(() =>
    (demande.devis?.rubriques ?? []).some((r) => r.lignes.some((l) => l.prixMin !== undefined || l.prixMax !== undefined)),
  );
  const [declin, setDeclin] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const modifiable = demande.statut === "nouvelle" || demande.statut === "brouillon" || demande.statut === "envoyee";

  const majRubrique = (id: string, f: (r: RubriqueDevis) => RubriqueDevis) =>
    setDevis((d) => ({ ...d, rubriques: d.rubriques.map((r) => (r.id === id ? f(r) : r)) }));
  const majLigne = (rid: string, lid: string, p: Partial<LigneDevis>) =>
    majRubrique(rid, (r) => ({ ...r, lignes: r.lignes.map((l) => (l.id === lid ? { ...l, ...p } : l)) }));

  const lignesProposees = catalogue ? proposerLignes(demande.texte, catalogue) : [];
  const total = totalDevis(devis);
  const fourchette = fourchetteDevis(devis);

  const utiliserModeleChantier = () =>
    setDevis((d) => ({
      ...d,
      // garde les rubriques déjà remplies, ajoute celles du modèle qui manquent
      rubriques: [
        ...d.rubriques.filter((r) => r.lignes.some((l) => l.designation.trim())),
        ...RUBRIQUES_CHANTIER.filter((t) => !d.rubriques.some((r) => r.titre === t)).map((t) =>
          nouvelleRubrique(t, [
            nouvelleLigne(),
            ...(t.startsWith("Logistique") ? [] : [nouvelleLigne({ designation: "Main-d’œuvre", unite: "Forfait" })]),
          ]),
        ),
      ],
    }));

  const ajouterPropositions = () =>
    setDevis((d) => {
      const [premiere, ...reste] = d.rubriques;
      const utiles = premiere.lignes.filter((l) => l.designation.trim());
      const nouvelles = lignesProposees.filter((p) => !utiles.some((l) => l.designation === p.designation));
      return { ...d, rubriques: [{ ...premiere, lignes: [...utiles, ...nouvelles] }, ...reste] };
    });

  const nettoyer = (d: Devis): Devis => ({
    ...d,
    rubriques: d.rubriques
      .map((r) => ({
        ...r,
        titre: r.titre.trim(),
        lignes: r.lignes
          .filter((l) => l.designation.trim())
          .map((l) => (prixMarche ? l : { ...l, prixMin: undefined, prixMax: undefined })),
      }))
      .filter((r) => r.lignes.length),
  });

  const sauver = (envoyer: boolean) => {
    const propre = nettoyer(devis);
    if (envoyer && !propre.rubriques.length) {
      setErreur("Ajoutez au moins une ligne avec une désignation avant d’envoyer le devis.");
      return;
    }
    enregistrerDevis(demande.id, propre, envoyer);
    onFermer();
  };

  if (apercu)
    return (
      <div>
        <button onClick={() => setApercu(false)} className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
          <Pencil className="size-4" /> Revenir à la saisie
        </button>
        <TableauDevis demande={demande} devis={nettoyer(devis)} />
      </div>
    );

  return (
    <div className="space-y-5">
      <button onClick={onFermer} className="flex items-center gap-2 text-sm font-bold text-primary">
        <ArrowLeft className="size-4" /> Toutes les demandes
      </button>

      {/* La demande du client, en langage naturel */}
      <section className="rounded-2xl bg-secondary p-4 text-sm text-primary md:p-5">
        <p className="font-bold">
          {demande.client.prenom} · {demande.quartier}
          {demande.dateSouhaitee && <> · pour le {new Date(demande.dateSouhaitee).toLocaleDateString("fr-FR")}</>}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-foreground">{demande.texte}</p>
        {demande.budget && <p className="mt-2 text-xs">Budget indicatif : {demande.budget}</p>}
        <a href={`tel:${demande.client.telephone.replace(/\s/g, "")}`} className="mt-2 inline-block text-xs font-bold underline">
          Appeler {demande.client.prenom} ({demande.client.telephone})
        </a>
      </section>

      {!modifiable ? (
        <>
          <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
            {demande.statut === "declinee"
              ? "Vous avez décliné cette demande."
              : `Le client a ${demande.statut === "acceptee" ? "accepté" : "refusé"} ce devis : il n’est plus modifiable.`}
          </p>
          {demande.devis && <TableauDevis demande={demande} devis={demande.devis} />}
        </>
      ) : (
        <>
          {/* Aides au chiffrage */}
          <div className="flex flex-wrap gap-2">
            {lignesProposees.length > 0 && (
              <button
                type="button"
                onClick={ajouterPropositions}
                className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
              >
                <Sparkles className="size-4" /> Reprendre {lignesProposees.length} article{lignesProposees.length > 1 ? "s" : ""} de la demande
              </button>
            )}
            {demande.pro.type === "artisan" && (
              <button
                type="button"
                onClick={utiliserModeleChantier}
                className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold ring-1 ring-border"
              >
                <LayoutList className="size-4" /> Modèle chantier (7 rubriques)
              </button>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold ring-1 ring-border">
              <input type="checkbox" checked={prixMarche} onChange={(e) => setPrixMarche(e.target.checked)} className="size-4 accent-primary" />
              Prix du marché (de … à …)
            </label>
          </div>

          {/* Rubriques et lignes */}
          {devis.rubriques.map((r, i) => (
            <section key={r.id} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03] md:p-5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">{i + 1}.</span>
                <input
                  aria-label={`Titre de la rubrique ${i + 1}`}
                  value={r.titre}
                  onChange={(e) => majRubrique(r.id, (x) => ({ ...x, titre: e.target.value }))}
                  placeholder="Titre de la rubrique (ex. Fondations)"
                  className={`${champ} font-bold`}
                />
                {devis.rubriques.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Supprimer la rubrique ${r.titre || i + 1}`}
                    onClick={() => setDevis((d) => ({ ...d, rubriques: d.rubriques.filter((x) => x.id !== r.id) }))}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              <div
                className={`mt-3 hidden gap-2 px-1 text-[11px] font-semibold text-muted-foreground uppercase md:grid ${
                  prixMarche ? "md:grid-cols-[minmax(0,1fr)_70px_110px_100px_90px_90px_100px_36px]" : "md:grid-cols-[minmax(0,1fr)_70px_120px_110px_110px_36px]"
                }`}
              >
                <span>Désignation</span>
                <span className="text-right">Qté</span>
                <span>Unité</span>
                <span className="text-right">Prix unit.</span>
                {prixMarche && (
                  <>
                    <span className="text-right">Marché de</span>
                    <span className="text-right">à</span>
                  </>
                )}
                <span className="text-right">Montant</span>
                <span />
              </div>

              <ul className="mt-2 space-y-3 md:space-y-2">
                {r.lignes.map((l) => (
                  <li
                    key={l.id}
                    className={`grid grid-cols-[1fr_1fr] gap-2 rounded-xl bg-background p-3 md:items-center md:bg-transparent md:p-0 ${
                      prixMarche ? "md:grid-cols-[minmax(0,1fr)_70px_110px_100px_90px_90px_100px_36px]" : "md:grid-cols-[minmax(0,1fr)_70px_120px_110px_110px_36px]"
                    }`}
                  >
                    <input
                      aria-label="Désignation"
                      value={l.designation}
                      onChange={(e) => majLigne(r.id, l.id, { designation: e.target.value })}
                      placeholder="Ex. Ciment (tonne), Main-d’œuvre…"
                      className={`${champ} col-span-2 md:col-span-1`}
                    />
                    <Nombre label="Quantité" value={l.quantite} onChange={(n) => majLigne(r.id, l.id, { quantite: n ?? 0 })} />
                    <input
                      aria-label="Unité"
                      list="unites-devis"
                      value={l.unite}
                      onChange={(e) => majLigne(r.id, l.id, { unite: e.target.value })}
                      className={champ}
                    />
                    <Nombre label="Prix unitaire en FCFA" value={l.prixUnitaire} onChange={(n) => majLigne(r.id, l.id, { prixUnitaire: n ?? 0 })} />
                    {prixMarche && (
                      <>
                        <Nombre label="Prix du marché, minimum" placeholder="de" facultatif value={l.prixMin} onChange={(n) => majLigne(r.id, l.id, { prixMin: n })} />
                        <Nombre label="Prix du marché, maximum" placeholder="à" facultatif value={l.prixMax} onChange={(n) => majLigne(r.id, l.id, { prixMax: n })} />
                      </>
                    )}
                    <p className="flex items-center justify-end text-sm font-bold tabular-nums">
                      {montantLigne(l) ? montantLigne(l).toLocaleString("fr-FR") : <span className="font-normal text-muted-foreground">Inclus</span>}
                    </p>
                    <button
                      type="button"
                      aria-label={`Supprimer la ligne ${l.designation}`}
                      onClick={() => majRubrique(r.id, (x) => ({ ...x, lignes: x.lignes.filter((y) => y.id !== l.id) }))}
                      className="flex size-9 items-center justify-center justify-self-end rounded-lg text-muted-foreground hover:bg-muted"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => majRubrique(r.id, (x) => ({ ...x, lignes: [...x.lignes, nouvelleLigne()] }))}
                  className="flex items-center gap-1.5 text-sm font-bold text-primary"
                >
                  <Plus className="size-4" /> Ajouter une ligne
                </button>
                <p className="text-sm">
                  Sous-total : <span className="font-bold tabular-nums">{fcfa(sousTotal(r))}</span>
                </p>
              </div>
            </section>
          ))}
          <datalist id="unites-devis">
            {UNITES.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          <button
            type="button"
            onClick={() => setDevis((d) => ({ ...d, rubriques: [...d.rubriques, nouvelleRubrique()] }))}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-secondary/40 py-3 text-sm font-bold text-primary"
          >
            <Plus className="size-4" /> Ajouter une rubrique
          </button>

          {/* Conditions */}
          <section className="grid gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03] sm:grid-cols-2 md:p-5">
            {(
              [
                ["delai", "Délai d’intervention / de livraison"],
                ["validite", "Validité du devis"],
                ["paiement", "Conditions de paiement"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="text-sm font-semibold">
                {label}
                <input value={devis[k]} onChange={(e) => setDevis((d) => ({ ...d, [k]: e.target.value }))} className={`${champ} mt-1 font-normal`} />
              </label>
            ))}
            <label className="flex items-center gap-2 self-end py-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={devis.materiauxInclus}
                onChange={(e) => setDevis((d) => ({ ...d, materiauxInclus: e.target.checked }))}
                className="size-4 accent-primary"
              />
              Matériaux inclus dans le prix
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Remarques pour le client (facultatif)
              <textarea
                rows={2}
                value={devis.note}
                onChange={(e) => setDevis((d) => ({ ...d, note: e.target.value }))}
                placeholder="Ex. Transport jusqu’à Kibina compris. Prix du ciment susceptible de varier."
                className={`${champ} mt-1 resize-none font-normal`}
              />
            </label>
          </section>

          {/* Total et actions */}
          <div className="sticky bottom-3 z-20 rounded-2xl bg-foreground p-4 text-white shadow-lg md:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs text-white/70">Total estimatif</p>
                <p className="font-serif text-2xl leading-none">{fcfa(total)}</p>
                {fourchette && prixMarche && fourchette.min !== fourchette.max && (
                  <p className="mt-1 text-xs text-white/70">
                    Marché : {fcfa(fourchette.min)} – {fcfa(fourchette.max)}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setApercu(true)} className="flex items-center gap-1.5 text-sm font-semibold text-white/85 underline">
                <Eye className="size-4" /> Aperçu client
              </button>
            </div>
            {erreur && <p className="mt-2 text-sm text-accent">{erreur}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => sauver(false)} className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold ring-1 ring-white/20">
                <Save className="size-4" /> Brouillon
              </button>
              <button type="button" onClick={() => sauver(true)} className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground">
                <Send className="size-4" /> {demande.statut === "envoyee" ? "Renvoyer" : "Envoyer"} le devis
              </button>
            </div>
          </div>

          {/* Décliner */}
          {demande.statut !== "envoyee" &&
            (declin === null ? (
              <button type="button" onClick={() => setDeclin("")} className="w-full text-center text-sm text-muted-foreground underline">
                Je ne peux pas répondre à cette demande
              </button>
            ) : (
              <div className="space-y-2 rounded-2xl bg-card p-4 shadow-sm">
                <label htmlFor="motif-declin" className="text-sm font-semibold">
                  Un mot pour le client (facultatif)
                </label>
                <input
                  id="motif-declin"
                  value={declin}
                  onChange={(e) => setDeclin(e.target.value)}
                  placeholder="Ex. Je suis complet ce mois-ci."
                  className={champ}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDeclin(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold">
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      declinerDemande(demande.id, declin);
                      onFermer();
                    }}
                    className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-bold text-white"
                  >
                    Décliner
                  </button>
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
