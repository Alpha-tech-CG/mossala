"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Star } from "lucide-react";
import type { Donnees, Onglet } from "./Backoffice";

/**
 * Tableau de bord de la console : ce qui est à traiter, les chiffres de la période choisie
 * avec leur évolution, l'activité jour par jour et la répartition des avis et des pros.
 * Graphiques en SVG, sans bibliothèque. Couleurs : palette catégorielle validée (3 séries),
 * couleurs d'état réservées aux statuts (toujours avec leur libellé).
 */

const COULEURS = {
  serie1: "#2a78d6", // avis reçus
  serie2: "#eb6834", // messages reçus
  serie3: "#1baf7a", // inscriptions
  bon: "#0ca30c",
  attention: "#fab219",
  critique: "#d03b3b",
  neutre: "#898781",
  grille: "#e1e0d9",
  axe: "#c3c2b7",
  encre2: "#52514e",
  surface: "#fffdf8",
};

const JOUR = 24 * 3600 * 1000;
const PERIODES = [
  { jours: 7, label: "7 jours" },
  { jours: 30, label: "30 jours" },
  { jours: 90, label: "90 jours" },
] as const;

/** Minuit (heure locale) du jour de `ms`. */
const minuit = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Nombre d'événements par jour sur `nb` jours se terminant aujourd'hui. */
function parJour(dates: number[], fin: number, nb: number): number[] {
  const debut = fin - (nb - 1) * JOUR;
  const n = Array<number>(nb).fill(0);
  for (const d of dates) {
    if (!d) continue;
    const i = Math.round((minuit(d) - debut) / JOUR);
    if (i >= 0 && i < nb) n[i]++;
  }
  return n;
}

const entre = (dates: number[], de: number, a: number) => dates.filter((d) => d >= de && d < a).length;
const nombre = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const jourCourt = (ms: number) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(ms);

/** Largeur disponible d'un élément (les graphiques se redessinent à la bonne taille). */
function useLargeur<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largeur, setLargeur] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLargeur(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, largeur] as const;
}

/** Graduations « rondes » de 0 au maximum. */
function graduations(max: number): number[] {
  if (max <= 0) return [0, 1];
  const brut = max / 4;
  const p = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 5, 10].map((m) => m * p).find((x) => x >= brut) ?? brut;
  const t: number[] = [];
  for (let v = 0; v <= max + pas * 0.001; v += pas) t.push(Math.round(v));
  if (t[t.length - 1] < max) t.push(t[t.length - 1] + Math.round(pas));
  return t;
}

const Carte = ({ titre, sousTitre, children, className = "" }: { titre: string; sousTitre?: string; children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.04] ${className}`}>
    <h2 className="font-bold">{titre}</h2>
    {sousTitre && <p className="text-xs text-muted-foreground">{sousTitre}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

// ——— Tuile chiffre + évolution + mini-courbe ———

function Tuile({
  label,
  valeur,
  delta,
  hausseBonne = true,
  serie,
  onClick,
}: {
  label: string;
  valeur: string;
  /** écart en % avec la période précédente (null : pas de comparaison possible) */
  delta: number | null;
  hausseBonne?: boolean;
  serie: number[];
  onClick?: () => void;
}) {
  const bon = delta !== null && delta !== 0 && delta > 0 === hausseBonne;
  const Fleche = delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const max = Math.max(1, ...serie);
  const l = 120;
  const h = 32;
  const pts = serie.map((v, i) => [serie.length > 1 ? (i / (serie.length - 1)) * l : l, h - 2 - (v / max) * (h - 4)]);
  return (
    <button type="button" onClick={onClick} className="rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-black/[0.04] transition hover:ring-primary/40">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold whitespace-nowrap">{valeur}</p>
        <svg width={l} height={h} viewBox={`0 0 ${l} ${h}`} aria-hidden className="mb-1 min-w-0 shrink">
          <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={COULEURS.neutre} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
          {pts.length > 0 && <circle cx={pts[pts.length - 1][0] - 3} cy={pts[pts.length - 1][1]} r={3} fill={COULEURS.serie1} />}
        </svg>
      </div>
      <p className={`mt-2 flex items-center gap-1 text-xs ${delta === null || delta === 0 ? "text-muted-foreground" : bon ? "text-success" : "text-destructive"}`}>
        <Fleche className="size-3.5 shrink-0" />
        <strong>{delta === null ? "–" : `${delta > 0 ? "+" : ""}${delta} %`}</strong>
        <span className="truncate text-muted-foreground">vs période précédente</span>
      </p>
    </button>
  );
}

// ——— Courbes d'activité (crosshair + info-bulle) ———

type Serie = { nom: string; couleur: string; valeurs: number[] };

function CourbesActivite({ jours, series }: { jours: number[]; series: Serie[] }) {
  const [ref, largeur] = useLargeur<HTMLDivElement>();
  const [survol, setSurvol] = useState<number | null>(null);
  const h = 240;
  const marge = { haut: 12, droite: 12, bas: 28, gauche: 36 };
  const l = Math.max(280, largeur);
  const max = Math.max(...series.flatMap((s) => s.valeurs), 0);
  const ticks = graduations(max);
  const yMax = ticks[ticks.length - 1] || 1;
  const x = (i: number) => marge.gauche + (jours.length > 1 ? (i / (jours.length - 1)) * (l - marge.gauche - marge.droite) : 0);
  const y = (v: number) => marge.haut + (1 - v / yMax) * (h - marge.haut - marge.bas);
  const nbEtiquettes = l < 500 ? 4 : 7;
  const pasEtiquettes = Math.max(1, Math.round((jours.length - 1) / (nbEtiquettes - 1)));

  const versIndex = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect();
    const px = clientX - r.left;
    const i = Math.round(((px - marge.gauche) / (l - marge.gauche - marge.droite)) * (jours.length - 1));
    return Math.min(jours.length - 1, Math.max(0, i));
  };

  return (
    <div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {series.map((s) => (
          <li key={s.nom} className="flex items-center gap-2 text-muted-foreground">
            <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: s.couleur }} />
            {s.nom} <strong className="text-foreground">{nombre(s.valeurs.reduce((a, b) => a + b, 0))}</strong>
          </li>
        ))}
      </ul>
      <div ref={ref} className="relative mt-3">
        {largeur > 0 && (
          <svg
            width={l}
            height={h}
            role="img"
            aria-label="Activité par jour : utilisez les flèches pour parcourir les jours"
            tabIndex={0}
            className="touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onPointerMove={(e) => setSurvol(versIndex(e.clientX, e.currentTarget))}
            onPointerLeave={() => setSurvol(null)}
            onBlur={() => setSurvol(null)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              setSurvol((i) => Math.min(jours.length - 1, Math.max(0, (i ?? jours.length - 1) + (e.key === "ArrowRight" ? 1 : -1))));
            }}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={marge.gauche} x2={l - marge.droite} y1={y(t)} y2={y(t)} stroke={t === 0 ? COULEURS.axe : COULEURS.grille} strokeWidth={1} />
                <text x={marge.gauche - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={COULEURS.neutre} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {nombre(t)}
                </text>
              </g>
            ))}
            {jours.map((j, i) =>
              i % pasEtiquettes === 0 || i === jours.length - 1 ? (
                i !== jours.length - 1 && jours.length - 1 - i < pasEtiquettes / 2 ? null : (
                  <text key={j} x={x(i)} y={h - 8} textAnchor={i === 0 ? "start" : i === jours.length - 1 ? "end" : "middle"} fontSize={11} fill={COULEURS.neutre}>
                    {jourCourt(j)}
                  </text>
                )
              ) : null,
            )}
            {series.map((s) => (
              <g key={s.nom}>
                <path
                  d={`M${x(0)},${y(0)} ${s.valeurs.map((v, i) => `L${x(i)},${y(v)}`).join(" ")} L${x(s.valeurs.length - 1)},${y(0)} Z`}
                  fill={s.couleur}
                  opacity={0.06}
                />
                <polyline
                  points={s.valeurs.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                  fill="none"
                  stroke={s.couleur}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            ))}
            {survol !== null && (
              <g>
                <line x1={x(survol)} x2={x(survol)} y1={marge.haut} y2={h - marge.bas} stroke={COULEURS.axe} strokeWidth={1} />
                {series.map((s) => (
                  <circle key={s.nom} cx={x(survol)} cy={y(s.valeurs[survol])} r={4} fill={s.couleur} stroke={COULEURS.surface} strokeWidth={2} />
                ))}
              </g>
            )}
          </svg>
        )}
        {survol !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-xl bg-card px-3 py-2 text-sm shadow-lg ring-1 ring-black/10"
            style={x(survol) > l / 2 ? { right: l - x(survol) + 12 } : { left: x(survol) + 12 }}
          >
            <p className="text-xs text-muted-foreground">{jourCourt(jours[survol])}</p>
            {series.map((s) => (
              <p key={s.nom} className="mt-1 flex items-center gap-2">
                <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: s.couleur }} />
                <strong style={{ fontVariantNumeric: "tabular-nums" }}>{s.valeurs[survol]}</strong>
                <span className="text-muted-foreground">{s.nom.toLowerCase()}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-primary">Voir les données en tableau</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg ring-1 ring-border">
          <table className="w-full text-left" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Jour</th>
                {series.map((s) => (
                  <th key={s.nom} className="px-3 py-2 text-right font-semibold">
                    {s.nom}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...jours.keys()].reverse().map((i) => (
                <tr key={jours[i]}>
                  <td className="px-3 py-1.5">{jourCourt(jours[i])}</td>
                  {series.map((s) => (
                    <td key={s.nom} className="px-3 py-1.5 text-right">
                      {s.valeurs[i]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

// ——— Barres horizontales (une série) ———

function Barres({ lignes, unite }: { lignes: { label: React.ReactNode; cle: string; valeur: number }[]; unite: string }) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  const total = lignes.reduce((s, l) => s + l.valeur, 0);
  return (
    <ul className="space-y-2.5">
      {lignes.map((l) => (
        <li key={l.cle} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 text-sm" title={`${l.valeur} ${unite}`}>
          <span className="flex items-center gap-1 font-semibold">{l.label}</span>
          <span className="h-4">
            <span
              className="block h-full rounded-r-[4px]"
              style={{ width: `${(l.valeur / max) * 100}%`, minWidth: l.valeur ? 3 : 0, background: COULEURS.serie1, maxWidth: "100%" }}
            />
          </span>
          <span className="w-16 text-right text-muted-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            <strong className="text-foreground">{l.valeur}</strong>
            {total ? ` · ${Math.round((l.valeur / total) * 100)} %` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ——— Barre segmentée (une répartition en parts, avec états) ———

function Repartition({ parts }: { parts: { label: string; valeur: number; couleur: string }[] }) {
  const total = parts.reduce((s, p) => s + p.valeur, 0);
  return (
    <div>
      {total ? (
        <div className="flex h-7 gap-0.5 overflow-hidden" role="img" aria-label={parts.map((p) => `${p.label} : ${p.valeur}`).join(", ")}>
          {parts
            .filter((p) => p.valeur > 0)
            .map((p) => {
              const part = Math.round((p.valeur / total) * 100);
              return (
                <div
                  key={p.label}
                  title={`${p.label} : ${p.valeur} (${part} %)`}
                  className="flex items-center overflow-hidden rounded-[4px] px-2 text-xs font-bold whitespace-nowrap"
                  style={{ width: `${(p.valeur / total) * 100}%`, background: p.couleur, color: p.couleur === COULEURS.attention ? "#0b0b0b" : "#fff" }}
                >
                  {/* la part n'est écrite que si elle tient dans le bloc ; sinon légende et survol la donnent */}
                  {part >= 20 ? `${part} %` : ""}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="h-7 rounded-[4px] bg-muted" />
      )}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-muted-foreground">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: p.couleur }} />
            {p.label} <strong className="text-foreground">{p.valeur}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ——— Le tableau de bord ———

export function TableauDeBord({ d, ouvrir }: { d: Donnees; ouvrir: (o: Onglet) => void }) {
  const [periode, setPeriode] = useState<7 | 30 | 90>(30);
  // « aujourd'hui » figé à l'ouverture de l'écran (calcul stable pendant la consultation)
  const [aujourdhui] = useState(() => minuit(Date.now()));

  const stats = useMemo(() => {
    const finPeriode = aujourdhui + JOUR;
    const debut = finPeriode - periode * JOUR;
    const debutPrec = debut - periode * JOUR;
    const evolution = (dates: number[]) => {
      const n = entre(dates, debut, finPeriode);
      const avant = entre(dates, debutPrec, debut);
      return { n, delta: avant ? Math.round(((n - avant) / avant) * 100) : null };
    };
    const datesAvis = d.avis.map((v) => v.creeLe);
    const datesMessages = [...d.contacts.map((c) => c.recuLe), ...d.demandesAnnonceurs.map((x) => x.recuLe)];
    const datesPros = d.pros.map((p) => p.creeLe).filter(Boolean);
    const datesClients = d.comptes.map((c) => c.creeLe).filter(Boolean);
    const notesPeriode = d.avis.filter((v) => v.creeLe >= debut && v.creeLe < finPeriode).map((v) => v.note);
    const notesAvant = d.avis.filter((v) => v.creeLe >= debutPrec && v.creeLe < debut).map((v) => v.note);
    const moyenne = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : null);
    const m = moyenne(notesPeriode);
    const mAvant = moyenne(notesAvant);
    const jours = Array.from({ length: periode }, (_, i) => aujourdhui - (periode - 1 - i) * JOUR);
    return {
      jours,
      avis: { ...evolution(datesAvis), serie: parJour(datesAvis, aujourdhui, periode) },
      messages: { ...evolution(datesMessages), serie: parJour(datesMessages, aujourdhui, periode) },
      pros: { ...evolution(datesPros), serie: parJour(datesPros, aujourdhui, periode) },
      clients: { ...evolution(datesClients), serie: parJour(datesClients, aujourdhui, periode) },
      note: {
        valeur: m,
        delta: m !== null && mAvant ? Math.round(((m - mAvant) / mAvant) * 100) : null,
        serie: parJour(datesAvis, aujourdhui, periode),
      },
      inscriptions: parJour([...datesPros, ...datesClients], aujourdhui, periode),
    };
  }, [d, periode, aujourdhui]);

  const aFaire = [
    { o: "avis" as const, n: d.avis.filter((v) => v.statut === "a_moderer").length, t: "Avis à modérer" },
    { o: "signalements" as const, n: d.signalements.filter((s) => s.statut === "nouveau").length, t: "Signalements à traiter" },
    { o: "pros" as const, n: d.pros.filter((p) => p.statut === "en_verification").length, t: "Professionnels à vérifier" },
    { o: "realisations" as const, n: d.realisations.filter((r) => !r.verifiee).length, t: "Réalisations à vérifier" },
    { o: "contacts" as const, n: d.contacts.filter((c) => c.statut === "nouveau").length, t: "Messages non traités" },
    { o: "annonceurs" as const, n: d.demandesAnnonceurs.filter((x) => x.statut === "nouveau").length, t: "Annonceurs à rappeler" },
    { o: "metiers" as const, n: d.propositionsMetiers.filter((x) => x.statut === "nouveau").length, t: "Métiers proposés" },
  ];
  const totalAFaire = aFaire.reduce((s, x) => s + x.n, 0);

  const publies = d.avis.filter((v) => v.statut === "publie");
  const notes = [5, 4, 3, 2, 1].map((n) => ({
    cle: String(n),
    label: (
      <>
        {n} <Star className="size-3.5 fill-star text-star" />
      </>
    ),
    valeur: publies.filter((v) => Math.round(v.note) === n).length,
  }));

  // Professionnels les mieux notés (avis publiés), au moins 2 avis
  const classement = useMemo(() => {
    const parPro = new Map<string, { nom: string; type: string; notes: number[] }>();
    for (const v of publies) {
      const p = parPro.get(v.cibleId) ?? { nom: v.cibleNom, type: v.cibleType, notes: [] };
      p.notes.push(v.note);
      parPro.set(v.cibleId, p);
    }
    return [...parPro.values()]
      .filter((p) => p.notes.length >= 2)
      .map((p) => ({ ...p, moyenne: p.notes.reduce((a, b) => a + b, 0) / p.notes.length }))
      .sort((a, b) => b.moyenne - a.moyenne || b.notes.length - a.notes.length)
      .slice(0, 5);
  }, [publies]);

  const jour = new Date(aujourdhui);
  const iso = `${jour.getFullYear()}-${String(jour.getMonth() + 1).padStart(2, "0")}-${String(jour.getDate()).padStart(2, "0")}`;
  const pubsEnLigne = d.publicites.filter((p) => p.statut === "active" && (!p.debut || p.debut <= iso) && (!p.fin || iso <= p.fin)).length;

  return (
    <div className="space-y-6">
      {/* Filtre de période : il s'applique à tous les chiffres et graphiques ci-dessous */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Période</span>
        <div className="flex rounded-xl bg-card p-1 shadow-sm ring-1 ring-border" role="group" aria-label="Période">
          {PERIODES.map((p) => (
            <button
              key={p.jours}
              type="button"
              onClick={() => setPeriode(p.jours)}
              aria-pressed={periode === p.jours}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${periode === p.jours ? "bg-foreground text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tuile label="Avis reçus" valeur={nombre(stats.avis.n)} delta={stats.avis.delta} serie={stats.avis.serie} onClick={() => ouvrir("avis")} />
        <Tuile
          label="Note moyenne des avis reçus"
          valeur={stats.note.valeur === null ? "–" : `${stats.note.valeur.toFixed(1).replace(".", ",")} / 5`}
          delta={stats.note.delta}
          serie={stats.note.serie}
          onClick={() => ouvrir("avis")}
        />
        <Tuile label="Nouveaux professionnels" valeur={nombre(stats.pros.n)} delta={stats.pros.delta} serie={stats.pros.serie} onClick={() => ouvrir("pros")} />
        <Tuile label="Nouveaux clients" valeur={nombre(stats.clients.n)} delta={stats.clients.delta} serie={stats.clients.serie} onClick={() => ouvrir("clients")} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Carte titre="Activité par jour" sousTitre={`${PERIODES.find((p) => p.jours === periode)?.label} · survolez la courbe pour le détail`}>
          <CourbesActivite
            jours={stats.jours}
            series={[
              { nom: "Avis reçus", couleur: COULEURS.serie1, valeurs: stats.avis.serie },
              { nom: "Messages reçus", couleur: COULEURS.serie2, valeurs: stats.messages.serie },
              { nom: "Inscriptions", couleur: COULEURS.serie3, valeurs: stats.inscriptions },
            ]}
          />
        </Carte>

        <Carte titre="À traiter" sousTitre={totalAFaire ? `${totalAFaire} élément${totalAFaire > 1 ? "s" : ""} en attente` : "Tout est à jour"}>
          <ul className="divide-y divide-border">
            {aFaire.map((x) => (
              <li key={x.t}>
                <button type="button" onClick={() => ouvrir(x.o)} className="group flex w-full items-center gap-3 py-2.5 text-left text-sm">
                  <span className={`min-w-8 rounded-full px-2 py-0.5 text-center text-xs font-bold ${x.n ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {x.n}
                  </span>
                  <span className="flex-1">{x.t}</span>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </li>
            ))}
          </ul>
        </Carte>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Carte titre="Répartition des notes" sousTitre={`${publies.length} avis publiés`}>
          <Barres lignes={notes} unite="avis" />
        </Carte>

        <Carte titre="Avis par statut" sousTitre={`${d.avis.length} avis au total`}>
          <Repartition
            parts={[
              { label: "Publiés", valeur: d.avis.filter((v) => v.statut === "publie").length, couleur: COULEURS.bon },
              { label: "À modérer", valeur: d.avis.filter((v) => v.statut === "a_moderer").length, couleur: COULEURS.attention },
              { label: "Refusés", valeur: d.avis.filter((v) => v.statut === "refuse").length, couleur: COULEURS.critique },
            ]}
          />
          <p className="mt-5 text-sm text-muted-foreground">
            Expérience confirmée sur <strong className="text-foreground">{publies.filter((v) => v.verifie).length}</strong> des{" "}
            {publies.length} avis publiés.
          </p>
        </Carte>

        <Carte titre="Professionnels par statut" sousTitre={`${d.pros.length} professionnels`}>
          <Repartition
            parts={[
              { label: "Vérifiés", valeur: d.pros.filter((p) => p.statut === "verifie").length, couleur: COULEURS.bon },
              { label: "À vérifier", valeur: d.pros.filter((p) => p.statut === "en_verification").length, couleur: COULEURS.attention },
              { label: "Suspendus", valeur: d.pros.filter((p) => p.statut === "suspendu").length, couleur: COULEURS.critique },
            ]}
          />
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-background p-3">
              <dt className="text-muted-foreground">Artisans</dt>
              <dd className="text-xl font-semibold">{d.pros.filter((p) => p.type === "artisan").length}</dd>
            </div>
            <div className="rounded-xl bg-background p-3">
              <dt className="text-muted-foreground">Boutiques</dt>
              <dd className="text-xl font-semibold">{d.pros.filter((p) => p.type === "boutique").length}</dd>
            </div>
          </dl>
        </Carte>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Carte titre="Les mieux notés" sousTitre="Avis publiés, au moins 2 avis">
          {classement.length ? (
            <ol className="divide-y divide-border">
              {classement.map((p, i) => (
                <li key={p.nom} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-5 text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.nom}</span>
                    <span className="text-xs text-muted-foreground">{p.type === "magasin" ? "Magasin" : "Artisan"}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="size-4 fill-star text-star" /> {p.moyenne.toFixed(1).replace(".", ",")}
                  </span>
                  <span className="w-16 text-right text-xs text-muted-foreground">{p.notes.length} avis</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Pas encore assez d’avis publiés.</p>
          )}
        </Carte>

        <Carte titre="Commercial" sousTitre="Publicités et annonceurs">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              { t: "Publicités en ligne", n: pubsEnLigne, o: "publicites" as const },
              { t: "Publicités au total", n: d.publicites.length, o: "publicites" as const },
              { t: "Annonceurs à rappeler", n: d.demandesAnnonceurs.filter((x) => x.statut === "nouveau").length, o: "annonceurs" as const },
              { t: "Messages reçus (période)", n: stats.messages.n, o: "contacts" as const },
            ].map((x) => (
              <button key={x.t} type="button" onClick={() => ouvrir(x.o)} className="rounded-xl bg-background p-3 text-left hover:ring-1 hover:ring-primary/40">
                <dt className="text-muted-foreground">{x.t}</dt>
                <dd className="text-2xl font-semibold">{nombre(x.n)}</dd>
              </button>
            ))}
          </dl>
        </Carte>
      </div>
    </div>
  );
}
