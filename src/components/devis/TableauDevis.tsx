import { fcfa } from "@/lib/data";
import { fourchetteDevis, montantLigne, sousTotal, totalDevis, type DemandeDevis, type Devis } from "@/lib/devis";

const nombre = (n: number) => n.toLocaleString("fr-FR");

/**
 * Devis en lecture, présenté comme le modèle Excel du client : rubriques numérotées,
 * lignes désignation / quantité / unité / prix unitaire / montant, sous-totaux et total.
 * Imprimable tel quel (Ctrl+P → PDF).
 */
export function TableauDevis({ demande, devis }: { demande: DemandeDevis; devis: Devis }) {
  const total = totalDevis(devis);
  const fourchette = fourchetteDevis(devis);
  const avecFourchette = fourchette !== null;
  const date = devis.envoyeLe
    ? new Date(devis.envoyeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "Aperçu, pas encore envoyé";

  return (
    <article className="devis-imprimable rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.04] md:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Devis estimatif</p>
          <h2 className="mt-1 font-serif text-2xl leading-tight">{demande.pro.nom}</h2>
          <p className="text-sm text-muted-foreground">{demande.pro.sous}</p>
        </div>
        <dl className="text-right text-sm">
          <dt className="text-muted-foreground">Pour</dt>
          <dd className="font-semibold">
            {demande.client.prenom} · {demande.quartier}
          </dd>
          <dt className="mt-1 text-muted-foreground">Établi le</dt>
          <dd className="font-semibold">{date}</dd>
        </dl>
      </header>

      <p className="mt-4 rounded-xl bg-background p-3 text-sm">
        <span className="font-semibold">Demande : </span>
        <span className="whitespace-pre-wrap">{demande.texte}</span>
      </p>

      <div className="-mx-5 mt-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-left text-xs text-white">
              <th className="rounded-l-lg px-3 py-2.5 font-semibold">Désignation / Matériaux</th>
              <th className="px-3 py-2.5 text-right font-semibold">Quantité</th>
              <th className="px-3 py-2.5 font-semibold">Unité</th>
              <th className="px-3 py-2.5 text-right font-semibold">Prix unitaire</th>
              {avecFourchette && <th className="px-3 py-2.5 text-right font-semibold">Prix marché</th>}
              <th className="rounded-r-lg px-3 py-2.5 text-right font-semibold">Montant (FCFA)</th>
            </tr>
          </thead>
          {devis.rubriques.map((r, i) => (
            <tbody key={r.id}>
              <tr>
                <th colSpan={avecFourchette ? 6 : 5} className="px-3 pt-5 pb-2 text-left font-bold text-primary">
                  {i + 1}. {r.titre || "Rubrique"}
                </th>
              </tr>
              {r.lignes.map((l) => (
                <tr key={l.id} className="border-b border-border/70">
                  <td className="px-3 py-2">{l.designation}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{nombre(l.quantite)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.unite}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.prixUnitaire ? nombre(l.prixUnitaire) : "—"}</td>
                  {avecFourchette && (
                    <td className="px-3 py-2 text-right text-xs text-muted-foreground tabular-nums">
                      {l.prixMin !== undefined || l.prixMax !== undefined
                        ? `${nombre(l.prixMin ?? l.prixUnitaire)} – ${nombre(l.prixMax ?? l.prixUnitaire)}`
                        : ""}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {montantLigne(l) ? nombre(montantLigne(l)) : "Inclus"}
                  </td>
                </tr>
              ))}
              <tr className="bg-secondary/60">
                <td colSpan={avecFourchette ? 5 : 4} className="px-3 py-2 text-right text-xs font-bold text-primary uppercase">
                  Sous-total {r.titre}
                </td>
                <td className="px-3 py-2 text-right font-bold text-primary tabular-nums">{nombre(sousTotal(r))}</td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>

      <div className="mt-6 flex flex-col items-end gap-1 border-t-2 border-foreground pt-4">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total estimatif global</p>
        <p className="font-serif text-3xl text-primary">{fcfa(total)}</p>
        {fourchette && fourchette.min !== fourchette.max && (
          <p className="text-sm text-muted-foreground">
            Selon les prix du marché : de {fcfa(fourchette.min)} à {fcfa(fourchette.max)}
          </p>
        )}
      </div>

      <dl className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {[
          ["Délai", devis.delai],
          ["Validité du devis", devis.validite],
          ["Matériaux", devis.materiauxInclus ? "Inclus dans le prix" : "Non inclus"],
          ["Paiement", devis.paiement],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-border/70 py-1.5">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-semibold">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      {devis.note && (
        <p className="mt-4 rounded-xl bg-background p-3 text-sm whitespace-pre-wrap">
          <span className="font-semibold">Remarques : </span>
          {devis.note}
        </p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Prix fixés librement par le professionnel. Aucune commission Artopif. Une ligne « Inclus » n’est pas facturée
        en plus.
      </p>
    </article>
  );
}
