"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, Clock, Info, MapPin, ShieldAlert, Smartphone, Star, TrendingDown, TrendingUp } from "lucide-react";
import { BACKEND_ACTIF } from "@/lib/backend/actif";
import { lirePagesVues, pageType } from "@/lib/audience";
import { type DonneesIntelligence, lireIntelligence } from "@/lib/backend/demo-intelligence";
import { artisans, getMetier } from "@/lib/data";
import { SIGNAUX, detecterAnomalies, prevoirHolt, recommander, scorerAvis } from "@/lib/intelligence";
import { CENTRES_QUARTIERS } from "@/lib/proximite";
import type { Donnees, Onglet } from "./Backoffice";
import { Barres, COULEURS, Carte, CourbesActivite, Repartition, Tuile } from "./TableauDeBord";

const nombre = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const jourLong = (ms: number) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(ms);
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
const somme = (l: number[]) => l.reduce((a, b) => a + b, 0);

const LIBELLES_PAGES: Record<string, string> = {
  "/": "Accueil",
  "/recherche": "Recherche",
  "/artisans/[id]": "Profil d’artisan",
  "/quincaillerie": "Quincaillerie",
  "/appli": "Appli : fil des réalisations",
  "/quincaillerie/[produit]": "Fiche produit",
  "/messages": "Messages",
  "/devis/nouveau": "Demande de devis",
  "/metiers": "Tous les métiers",
  "/appli/proches": "Appli : près de moi",
  "/appli/photo": "Appli : devis en photo",
  "/pro/espace": "Espace pro",
  "/profil": "Mon compte",
  "/contact": "Contact",
};
const libellePage = (p: string) => LIBELLES_PAGES[p] ?? p;

/** Données de la section (démonstration en maquette), lues une fois à l'ouverture. */
function useIntelligence(): DonneesIntelligence {
  const [d] = useState(lireIntelligence);
  return d;
}

function BandeauSource({ production }: { production: string }) {
  return (
    <p className="mb-5 flex items-start gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-primary">
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>
        {BACKEND_ACTIF ? "" : <><strong>Données de démonstration</strong> (sauf vos propres visites, comptées en direct). </>}
        En production : {production}
      </span>
    </p>
  );
}

const Periode = ({ valeur, changer }: { valeur: number; changer: (n: 7 | 30 | 90) => void }) => (
  <div className="flex gap-1 rounded-lg bg-card p-1 shadow-sm ring-1 ring-border" role="group" aria-label="Période">
    {([7, 30, 90] as const).map((n) => (
      <button
        key={n}
        type="button"
        aria-pressed={valeur === n}
        onClick={() => changer(n)}
        className={`rounded-md px-3 py-1.5 text-sm font-semibold ${valeur === n ? "bg-foreground text-white" : "text-muted-foreground"}`}
      >
        {n} jours
      </button>
    ))}
  </div>
);

// ——————————————————————————— Audience ———————————————————————————

export function PanneauAudience() {
  const d = useIntelligence();
  const [periode, setPeriode] = useState<7 | 30 | 90>(30);
  // vos visites réelles dans ce navigateur, ajoutées aux chiffres
  const [miennes] = useState(lirePagesVues);

  const s = useMemo(() => {
    const jours = d.audience.slice(-periode);
    const avant = d.audience.slice(-2 * periode, -periode);
    const aujourdhui = jours[jours.length - 1]?.jour ?? 0;
    const miennesAujourdhui = miennes.filter((p) => p.ts >= aujourdhui);
    const vues = { ...d.pages };
    for (const p of miennes) {
      const t = pageType(p.chemin);
      vues[t] = (vues[t] ?? 0) + 1;
    }
    const total = (l: typeof jours, k: "visiteurs" | "pagesVues" | "inscriptions") => somme(l.map((x) => x[k]));
    return {
      jours,
      visiteurs: total(jours, "visiteurs") + new Set(miennes.map((p) => p.session)).size,
      visiteursAvant: total(avant, "visiteurs"),
      vuesTotal: total(jours, "pagesVues") + miennes.length,
      vuesAvant: total(avant, "pagesVues"),
      moyenneJour: Math.round(total(jours, "visiteurs") / jours.length),
      duree: Math.round(somme(jours.map((x) => x.dureeMoySec)) / jours.length),
      rebond: Math.round(somme(jours.map((x) => x.rebondPct)) / jours.length),
      pages: Object.entries(vues).sort((a, b) => b[1] - a[1]).slice(0, 10),
      miennesAujourdhui: miennesAujourdhui.length,
      miennesTotal: miennes.length,
    };
  }, [d, periode, miennes]);

  const maxHeure = Math.max(...d.heures);
  const pic = d.heures.indexOf(maxHeure);

  return (
    <div>
      <BandeauSource production="Vercel Web Analytics (pages vues, visiteurs, appareils, sans cookie) et PostHog pour le parcours détaillé des clients, avec leur consentement." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Vos visites dans ce navigateur : <strong className="text-foreground">{s.miennesTotal}</strong> pages vues, dont{" "}
          <strong className="text-foreground">{s.miennesAujourdhui}</strong> aujourd’hui (comptées en direct).
        </p>
        <Periode valeur={periode} changer={setPeriode} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tuile label="Visiteurs" valeur={nombre(s.visiteurs)} delta={pct(s.visiteurs, s.visiteursAvant)} serie={s.jours.map((j) => j.visiteurs)} />
        <Tuile label="Visiteurs par jour (moyenne)" valeur={nombre(s.moyenneJour)} delta={pct(s.visiteurs, s.visiteursAvant)} serie={s.jours.map((j) => j.visiteurs)} />
        <Tuile label="Pages vues" valeur={nombre(s.vuesTotal)} delta={pct(s.vuesTotal, s.vuesAvant)} serie={s.jours.map((j) => j.pagesVues)} />
        <Tuile
          label="Temps moyen par visite"
          valeur={`${Math.floor(s.duree / 60)} min ${String(s.duree % 60).padStart(2, "0")}`}
          delta={null}
          serie={s.jours.map((j) => j.dureeMoySec)}
        />
      </div>

      <Carte titre="Fréquentation quotidienne" sousTitre={`${periode} derniers jours · survolez la courbe pour le détail`} className="mt-5">
        <CourbesActivite
          jours={s.jours.map((j) => j.jour)}
          series={[
            { nom: "Visiteurs", couleur: COULEURS.serie1, valeurs: s.jours.map((j) => j.visiteurs) },
            { nom: "Inscriptions", couleur: COULEURS.serie3, valeurs: s.jours.map((j) => j.inscriptions) },
          ]}
        />
      </Carte>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Carte titre="Pages les plus consultées" sousTitre="Vues sur 30 jours, regroupées par type de page">
          <ul className="space-y-2.5">
            {s.pages.map(([p, n]) => (
              <li key={p} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate font-semibold" title={p}>
                  {libellePage(p)}
                </span>
                <span className="h-3.5">
                  <span className="block h-full rounded-r-[4px]" style={{ width: `${(n / s.pages[0][1]) * 100}%`, background: COULEURS.serie1 }} />
                </span>
                <span className="w-14 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {nombre(n)}
                </span>
              </li>
            ))}
          </ul>
        </Carte>

        <Carte titre="Parcours des clients" sousTitre="De la visite à l’avis : où les clients s’arrêtent">
          <ol className="space-y-2">
            {d.entonnoir.map((e, i) => {
              const precedent = i ? d.entonnoir[i - 1].n : e.n;
              const passage = Math.round((e.n / precedent) * 100);
              return (
                <li key={e.etape}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{e.etape}</span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{nombre(e.n)}</strong>
                      {i > 0 && <> · {passage} % de l’étape précédente</>}
                    </span>
                  </div>
                  <div className="mt-1 h-3 rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(e.n / d.entonnoir[0].n) * 100}%`, background: COULEURS.serie3 }} />
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Plus grosse perte : entre « Profil consulté » et « Contact ou devis ». Piste : afficher plus tôt le bouton d’appel et le délai de réponse.
          </p>
        </Carte>

        <Carte titre="Appareils utilisés">
          <Repartition
            parts={[
              { label: "Téléphone (site)", valeur: d.appareils.mobile, couleur: COULEURS.serie1 },
              { label: "Appli mobile", valeur: d.appareils.appli, couleur: COULEURS.serie3 },
              { label: "Ordinateur", valeur: d.appareils.ordinateur, couleur: COULEURS.serie2 },
            ]}
          />
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Smartphone className="size-4" /> {d.appareils.mobile + d.appareils.appli} % des visites se font sur téléphone.
          </p>
        </Carte>

        <Carte titre="Heures de visite" sousTitre={`Pic d’affluence vers ${pic} h`}>
          <div className="flex h-28 items-end gap-0.5" role="img" aria-label={`Visites selon l'heure, pic vers ${pic} heures`}>
            {d.heures.map((v, h) => (
              <div key={h} title={`${h} h : ${v}`} className="flex-1 rounded-t-[3px]" style={{ height: `${(v / maxHeure) * 100}%`, background: h === pic ? COULEURS.serie2 : COULEURS.serie1 }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
            <span>0 h</span>
            <span>6 h</span>
            <span>12 h</span>
            <span>18 h</span>
            <span>23 h</span>
          </div>
        </Carte>

        <Carte titre="D’où viennent les visiteurs">
          <Barres lignes={Object.entries(d.sources).map(([k, v]) => ({ cle: k, label: <span className="truncate text-xs">{k}</span>, valeur: v }))} unite="%" />
        </Carte>

        <Carte titre="Quartiers des visiteurs" sousTitre="Estimés à partir du quartier du compte">
          <Barres
            lignes={Object.entries(d.quartiersVisiteurs).map(([k, v]) => ({ cle: k, label: <span className="truncate text-xs">{k}</span>, valeur: v }))}
            unite="%"
          />
        </Carte>
      </div>
    </div>
  );
}

// ——————————————————————————— Monitoring ———————————————————————————

/** Petite courbe d'une série, avec un seuil éventuel. */
function Courbe({ jours, valeurs, couleur, seuil, unite }: { jours: number[]; valeurs: number[]; couleur: string; seuil?: number; unite: string }) {
  const l = 600;
  const h = 140;
  const max = Math.max(seuil ?? 0, ...valeurs) * 1.1 || 1;
  const x = (i: number) => (i / Math.max(1, valeurs.length - 1)) * l;
  const y = (v: number) => h - (v / max) * h;
  const iMax = valeurs.indexOf(Math.max(...valeurs));
  return (
    <svg viewBox={`0 0 ${l} ${h + 4}`} className="h-36 w-full" preserveAspectRatio="none" role="img" aria-label={`Maximum ${nombre(valeurs[iMax])} ${unite} le ${jourLong(jours[iMax])}`}>
      {seuil !== undefined && <line x1={0} x2={l} y1={y(seuil)} y2={y(seuil)} stroke={COULEURS.critique} strokeDasharray="6 5" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
      <polyline points={valeurs.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={couleur} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export function PanneauMonitoring() {
  const d = useIntelligence();
  const t = d.technique.slice(-30);
  const jours = t.map((x) => x.jour);
  const dispo = somme(t.map((x) => x.disponibilitePct)) / t.length;
  const p95 = Math.round(somme(t.map((x) => x.latenceP95Ms)) / t.length);
  const erreurs = somme(t.map((x) => x.erreurs));
  const dernier = d.technique[d.technique.length - 1];
  const incidents = t.filter((x) => x.disponibilitePct < 99.5 || x.smsEchoues > 10);

  const services = [
    { nom: "Site et applis", ok: true, detail: `${p95} ms (95 % des pages plus rapides)` },
    { nom: "Base de données", ok: true, detail: "Réponses normales" },
    { nom: "Connexion par SMS", ok: dernier.smsEchoues < 10, detail: `${dernier.smsEchoues} échecs aujourd’hui` },
    { nom: "Alertes WhatsApp / SMS", ok: dernier.smsEchoues < 10, detail: "Fournisseur Africa’s Talking" },
    { nom: "Notifications push", ok: true, detail: "Firebase Cloud Messaging" },
  ];

  return (
    <div>
      <BandeauSource production="Vercel (disponibilité, temps de réponse), Sentry (erreurs des pages et des applis, avec l’endroit exact dans le code) et Checkly (une visite automatique du site toutes les minutes, avec alerte)." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tuile label="Disponibilité (30 jours)" valeur={`${dispo.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`} delta={null} serie={t.map((x) => x.disponibilitePct)} />
        <Tuile label="Temps de réponse (p95)" valeur={`${nombre(p95)} ms`} delta={null} hausseBonne={false} serie={t.map((x) => x.latenceP95Ms)} />
        <Tuile label="Erreurs (30 jours)" valeur={nombre(erreurs)} delta={null} hausseBonne={false} serie={t.map((x) => x.erreurs)} />
        <Tuile label="Incidents (30 jours)" valeur={String(incidents.length)} delta={null} hausseBonne={false} serie={t.map((x) => (x.disponibilitePct < 99.5 ? 1 : 0))} />
      </div>

      <Carte titre="État des services" className="mt-5">
        <ul className="divide-y divide-border">
          {services.map((s) => (
            <li key={s.nom} className="flex items-center gap-3 py-2.5 text-sm">
              {s.ok ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <AlertTriangle className="size-5 shrink-0 text-destructive" />}
              <span className="font-semibold">{s.nom}</span>
              <span className={`ml-auto text-right text-xs ${s.ok ? "text-muted-foreground" : "font-bold text-destructive"}`}>{s.ok ? `Opérationnel · ${s.detail}` : `Dégradé · ${s.detail}`}</span>
            </li>
          ))}
        </ul>
      </Carte>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Carte titre="Temps de réponse (p95)" sousTitre="En millisecondes · seuil d’alerte à 1 000 ms">
          <Courbe jours={jours} valeurs={t.map((x) => x.latenceP95Ms)} couleur={COULEURS.serie1} seuil={1000} unite="ms" />
        </Carte>
        <Carte titre="Erreurs par jour" sousTitre="Pages et applis">
          <Courbe jours={jours} valeurs={t.map((x) => x.erreurs)} couleur={COULEURS.serie2} unite="erreurs" />
        </Carte>
        <Carte titre="Pages qui produisent le plus d’erreurs" sousTitre="30 derniers jours">
          <Barres lignes={Object.entries(d.erreursParPage).map(([k, v]) => ({ cle: k, label: <span className="truncate text-xs">{libellePage(k)}</span>, valeur: v }))} unite="erreurs" />
        </Carte>
        <Carte titre="Historique des incidents">
          {incidents.length ? (
            <ul className="space-y-2 text-sm">
              {incidents.map((x) => (
                <li key={x.jour} className="rounded-xl bg-destructive/5 p-3">
                  <p className="font-semibold capitalize">{jourLong(x.jour)}</p>
                  <p className="text-muted-foreground">
                    Disponibilité {x.disponibilitePct.toLocaleString("fr-FR")} % · {x.erreurs} erreurs · {x.smsEchoues} SMS non envoyés · temps de réponse {nombre(x.latenceP95Ms)} ms
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun incident sur la période.</p>
          )}
        </Carte>
      </div>
    </div>
  );
}

// ——————————————————————————— Analyses ML ———————————————————————————

const ONGLETS_ML = [
  { id: "avis", label: "Faux avis" },
  { id: "demande", label: "Prévision de la demande" },
  { id: "reco", label: "Recommandation" },
  { id: "anomalies", label: "Anomalies" },
] as const;

export function PanneauIntelligence({ d, ouvrir }: { d: Donnees; ouvrir: (o: Onglet) => void }) {
  const [vue, setVue] = useState<(typeof ONGLETS_ML)[number]["id"]>("avis");
  return (
    <div>
      <p className="mb-5 flex items-start gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-primary">
        <BrainCircuit className="mt-0.5 size-4 shrink-0" />
        <span>
          Les modèles tournent ici, sur les données de la console{BACKEND_ACTIF ? "" : " (démonstration)"} : rien n’est envoyé à un service extérieur. Chaque résultat
          explique d’où il vient, et l’équipe garde la décision finale.
        </span>
      </p>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto" role="tablist">
        {ONGLETS_ML.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={vue === o.id}
            onClick={() => setVue(o.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${vue === o.id ? "bg-foreground text-white" : "bg-card ring-1 ring-border"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {vue === "avis" && <FauxAvis d={d} ouvrir={ouvrir} />}
      {vue === "demande" && <PrevisionDemande />}
      {vue === "reco" && <RecommandationArtisans d={d} />}
      {vue === "anomalies" && <Anomalies d={d} />}
    </div>
  );
}

function FauxAvis({ d, ouvrir }: { d: Donnees; ouvrir: (o: Onglet) => void }) {
  const scores = useMemo(() => scorerAvis(d.avis).sort((a, b) => b.probabilite - a.probabilite), [d.avis]);
  const suspects = scores.filter((s) => s.probabilite >= 0.5);
  const tres = suspects.filter((s) => s.probabilite >= 0.8).length;
  const aModerer = suspects.filter((s) => s.avis.statut === "a_moderer").length;
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Carte titre={`${suspects.length} avis suspects sur ${scores.length}`} sousTitre={`${tres} très suspects (≥ 80 %) · ${aModerer} encore à modérer`}>
        {suspects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun avis suspect détecté.</p>
        ) : (
          <ul className="space-y-3">
            {suspects.slice(0, 25).map(({ avis: v, probabilite, signaux }) => (
              <li key={v.id} className="rounded-xl p-3 ring-1 ring-border">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${probabilite >= 0.8 ? "bg-destructive text-white" : "bg-[#fab219] text-[#0b0b0b]"}`}
                  >
                    {Math.round(probabilite * 100)} % suspect
                  </span>
                  <span className="text-sm font-semibold">{v.auteur}</span>
                  <span className="text-sm text-muted-foreground">sur {v.cibleNom}</span>
                  <span className="ml-auto flex items-center gap-0.5 text-sm font-semibold">
                    {v.note} <Star className="size-3.5 fill-star text-star" />
                  </span>
                </div>
                <p className="mt-1 text-sm">{v.texte ? `« ${v.texte} »` : <em className="text-muted-foreground">sans texte</em>}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {signaux.map((s) => (
                    <li key={s.id} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                      {s.libelle}
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(v.creeLe)} ·{" "}
                  {v.statut === "a_moderer" ? "à modérer" : v.statut === "publie" ? "publié" : "refusé"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={() => ouvrir("avis")} className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
          Modérer les avis
        </button>
      </Carte>
      <Carte titre="Comment le score est calculé" sousTitre="Régression logistique sur 6 signaux">
        <ul className="space-y-2 text-sm">
          {SIGNAUX.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3">
              <span>{s.libelle}</span>
              <strong className="shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                +{s.poids.toLocaleString("fr-FR")}
              </strong>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Score = 1 / (1 + e<sup>−(somme des signaux − 4)</sup>). Un seul signal faible ne suffit pas ; deux signaux forts dépassent 80 %. En production, les poids
          sont réappris sur les décisions de l’équipe (avis publiés ou refusés).
        </p>
      </Carte>
    </div>
  );
}

function PrevisionDemande() {
  const d = useIntelligence();
  const metiers = useMemo(() => [...new Set(d.demande.map((x) => x.metier))], [d]);
  const [metier, setMetier] = useState<string>("tout");
  const [quartier, setQuartier] = useState<string>("tout");

  const serie = useMemo(() => {
    const lignes = d.demande.filter((x) => (metier === "tout" || x.metier === metier) && (quartier === "tout" || x.quartier === quartier));
    return Array.from({ length: 16 }, (_, s) => somme(lignes.map((l) => l.semaines[s])));
  }, [d, metier, quartier]);
  const prev = useMemo(() => prevoirHolt(serie, 4), [serie]);

  // Classement : croissance prévue par métier (4 prochaines semaines vs 4 dernières)
  const tendances = useMemo(
    () =>
      metiers
        .map((m) => {
          const s = Array.from({ length: 16 }, (_, k) => somme(d.demande.filter((x) => x.metier === m).map((x) => x.semaines[k])));
          const p = prevoirHolt(s, 4);
          const recent = somme(s.slice(-4));
          return { m, recent, prevu: somme(p.prevue), evolution: pct(somme(p.prevue), recent) ?? 0 };
        })
        .sort((a, b) => b.evolution - a.evolution),
    [d, metiers],
  );

  const tous = [...serie, ...prev.haut];
  const max = Math.max(...tous, 1) * 1.1;
  const l = 640;
  const h = 200;
  const n = serie.length + prev.prevue.length;
  const x = (i: number) => (i / (n - 1)) * l;
  const y = (v: number) => h - (v / max) * h;
  const debutPrev = serie.length - 1;
  const bande = [
    ...prev.haut.map((v, i) => `${x(debutPrev + 1 + i)},${y(v)}`),
    ...prev.bas.map((v, i) => `${x(debutPrev + 1 + i)},${y(v)}`).reverse(),
  ];
  const evolution = pct(somme(prev.prevue), somme(serie.slice(-4))) ?? 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Carte titre="Demandes par semaine et prévision à 4 semaines" sousTitre="Lissage exponentiel de Holt · zone claire : intervalle à 95 %">
        <div className="mb-4 flex flex-wrap gap-2">
          <select value={metier} onChange={(e) => setMetier(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm" aria-label="Métier">
            <option value="tout">Tous les métiers</option>
            {metiers.map((m) => (
              <option key={m} value={m}>
                {getMetier(m)?.label ?? m}
              </option>
            ))}
          </select>
          <select value={quartier} onChange={(e) => setQuartier(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm" aria-label="Quartier">
            <option value="tout">Tous les quartiers</option>
            {[...new Set(d.demande.map((x) => x.quartier))].map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </div>
        <svg viewBox={`0 0 ${l} ${h + 20}`} className="w-full" role="img" aria-label={`Prévision : ${nombre(somme(prev.prevue))} demandes sur les 4 prochaines semaines`}>
          <polygon points={bande.join(" ")} fill={COULEURS.serie1} opacity={0.15} />
          <polyline points={serie.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={COULEURS.serie1} strokeWidth={2.5} strokeLinejoin="round" />
          <polyline
            points={[`${x(debutPrev)},${y(serie[debutPrev])}`, ...prev.prevue.map((v, i) => `${x(debutPrev + 1 + i)},${y(v)}`)].join(" ")}
            fill="none"
            stroke={COULEURS.serie2}
            strokeWidth={2.5}
            strokeDasharray="7 5"
          />
          <line x1={x(debutPrev)} x2={x(debutPrev)} y1={0} y2={h} stroke={COULEURS.axe} strokeDasharray="3 4" />
          <text x={x(debutPrev) + 6} y={14} fontSize={12} fill={COULEURS.encre2}>
            prévision
          </text>
          <text x={0} y={h + 16} fontSize={12} fill={COULEURS.neutre}>
            il y a 16 semaines
          </text>
          <text x={l} y={h + 16} fontSize={12} fill={COULEURS.neutre} textAnchor="end">
            dans 4 semaines
          </text>
        </svg>
        <p className="mt-3 text-sm">
          Prévu sur les 4 prochaines semaines : <strong>{nombre(somme(prev.prevue))} demandes</strong>{" "}
          <span className={evolution >= 0 ? "text-success" : "text-destructive"}>
            ({evolution >= 0 ? "+" : ""}
            {evolution} % par rapport aux 4 dernières)
          </span>
          .
        </p>
      </Carte>
      <Carte titre="Métiers à surveiller" sousTitre="Évolution prévue sur 4 semaines">
        <ul className="space-y-2 text-sm">
          {tendances.map((t) => (
            <li key={t.m} className="flex items-center gap-2">
              {t.evolution >= 0 ? <TrendingUp className="size-4 text-success" /> : <TrendingDown className="size-4 text-destructive" />}
              <span className="truncate">{getMetier(t.m)?.label ?? t.m}</span>
              <strong className={`ml-auto ${t.evolution >= 0 ? "text-success" : "text-destructive"}`}>
                {t.evolution >= 0 ? "+" : ""}
                {t.evolution} %
              </strong>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          À utiliser pour recruter des artisans là où la demande va monter, et pour vendre les espaces publicitaires aux bons métiers.
        </p>
      </Carte>
    </div>
  );
}

function RecommandationArtisans({ d }: { d: Donnees }) {
  const [quartier, setQuartier] = useState("Poto-Poto");
  const metiersDispo = useMemo(() => [...new Set(artisans.map((a) => a.metier))], []);
  const [metier, setMetier] = useState<string>("tout");
  const liste = useMemo(() => recommander(artisans, d.avis, quartier, metier === "tout" ? null : metier).slice(0, 8), [d.avis, quartier, metier]);

  return (
    <Carte titre="Quels artisans proposer à ce client ?" sousTitre="Score sur 100, expliqué facteur par facteur">
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm">
          <MapPin className="size-4 text-muted-foreground" /> Client à
          <select value={quartier} onChange={(e) => setQuartier(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2">
            {Object.keys(CENTRES_QUARTIERS).map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </label>
        <select value={metier} onChange={(e) => setMetier(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm" aria-label="Métier recherché">
          <option value="tout">Tous les métiers</option>
          {metiersDispo.map((m) => (
            <option key={m} value={m}>
              {getMetier(m)?.label ?? m}
            </option>
          ))}
        </select>
      </div>
      <ol className="space-y-3">
        {liste.map((r, i) => (
          <li key={r.artisan.id} className="rounded-xl p-3 ring-1 ring-border">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">{i + 1}</span>
              <span className="font-bold">{r.artisan.nom}</span>
              <span className="text-sm text-muted-foreground">
                {getMetier(r.artisan.metier)?.label} · {r.artisan.quartier}
              </span>
              <strong className="ml-auto text-lg">{Math.round(r.score * 100)}</strong>
            </div>
            <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {r.facteurs.map((f) => (
                <div key={f.nom} className="grid grid-cols-[minmax(0,1fr)_80px_32px] items-center gap-2 text-xs">
                  <span className="truncate text-muted-foreground">
                    {f.nom} <span className="opacity-70">({Math.round(f.poids * 100)} %)</span>
                  </span>
                  <span className="h-2 rounded-full bg-muted">
                    <span className="block h-full rounded-full" style={{ width: `${f.valeur * 100}%`, background: COULEURS.serie1 }} />
                  </span>
                  <span className="text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {Math.round(f.valeur * 100)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {r.km === 0 ? "Intervient dans le quartier du client" : r.km !== null ? `À ${r.km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km` : "Distance inconnue"} · note
              ajustée {r.noteBayes.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}/5 · {r.artisan.reponse}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        Note ajustée (bayésienne) : un artisan avec 2 avis à 5/5 ne passe pas devant un artisan avec 40 avis à 4,8/5. Avec l’historique réel, on ajoutera le filtrage
        collaboratif (« les clients qui ont choisi cet artisan ont aussi apprécié… »).
      </p>
    </Carte>
  );
}

function Anomalies({ d }: { d: Donnees }) {
  const intel = useIntelligence();
  const alertes = useMemo(() => {
    const jours = intel.audience.map((x) => x.jour);
    const minuit = (ms: number) => {
      const x = new Date(ms);
      x.setHours(0, 0, 0, 0);
      return x.getTime();
    };
    const avisParJour = jours.map((j) => d.avis.filter((v) => minuit(v.creeLe) === j).length);
    const series = [
      { nom: "Visiteurs", valeurs: intel.audience.map((x) => x.visiteurs), Icon: TrendingUp },
      { nom: "Inscriptions", valeurs: intel.audience.map((x) => x.inscriptions), Icon: TrendingUp },
      { nom: "Erreurs du site", valeurs: intel.technique.map((x) => x.erreurs), Icon: ShieldAlert },
      { nom: "SMS non envoyés", valeurs: intel.technique.map((x) => x.smsEchoues), Icon: ShieldAlert },
      { nom: "Temps de réponse", valeurs: intel.technique.map((x) => x.latenceP95Ms), Icon: Clock },
      { nom: "Avis reçus", valeurs: avisParJour, Icon: Star },
    ];
    return series
      .flatMap((s) => detecterAnomalies(s.valeurs).map((a) => ({ ...a, nom: s.nom, Icon: s.Icon, jour: jours[a.indice] })))
      .sort((a, b) => b.jour - a.jour || Math.abs(b.ecart) - Math.abs(a.ecart));
  }, [d.avis, intel]);

  return (
    <Carte titre={`${alertes.length} alerte${alertes.length > 1 ? "s" : ""} sur 60 jours`} sousTitre="Écart robuste à la normale des 28 jours précédents (médiane et MAD) · alerte au-delà de 3,5">
      {alertes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Rien d’anormal.</p>
      ) : (
        <ul className="space-y-2">
          {alertes.map((a) => {
            const grave = Math.abs(a.ecart) >= 6;
            return (
              <li key={`${a.nom}-${a.jour}`} className={`flex items-start gap-3 rounded-xl p-3 ${grave ? "bg-destructive/5" : "bg-muted/60"}`}>
                <a.Icon className={`mt-0.5 size-5 shrink-0 ${grave ? "text-destructive" : "text-accent-ink"}`} />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">
                    {a.nom} : {a.sens === "hausse" ? "pic" : "chute"} anormal{a.sens === "hausse" ? "" : "e"} le <span>{jourLong(a.jour)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    {nombre(a.valeur)} au lieu d’environ {nombre(a.attendu)} habituellement (écart {a.ecart > 0 ? "+" : ""}
                    {a.ecart.toLocaleString("fr-FR", { maximumFractionDigits: 1 })})
                  </p>
                </div>
                <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${grave ? "bg-destructive text-white" : "bg-[#fab219] text-[#0b0b0b]"}`}>
                  {grave ? "Critique" : "À vérifier"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">En production, chaque alerte critique part aussi par email et SMS à l’équipe.</p>
    </Carte>
  );
}
