"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgePercent,
  BarChart3,
  CalendarCheck,
  Check,
  Crown,
  ExternalLink,
  LayoutDashboard,
  Lock,
  MapPin,
  Package,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { Caisse } from "./Caisse";
import { Clients } from "./Clients";
import { Dashboard, type Onglet } from "./Dashboard";
import { Reservations } from "./Reservations";
import { Stock } from "./Stock";
import { useBoutique } from "./store";
import { MaBoutique, Promotions } from "./Vitrine";

const ONGLETS: { id: Onglet; label: string; Icon: typeof Store }[] = [
  { id: "accueil", label: "Tableau de bord", Icon: LayoutDashboard },
  { id: "reservations", label: "Réservations", Icon: CalendarCheck },
  { id: "caisse", label: "Caisse", Icon: ShoppingCart },
  { id: "stock", label: "Stock", Icon: Package },
  { id: "clients", label: "Clients", Icon: Users },
  { id: "promotions", label: "Promotions", Icon: BadgePercent },
  { id: "boutique", label: "Ma boutique", Icon: Store },
];

const AVANTAGES_PREMIUM = [
  [BarChart3, "Tableau de bord", "Chiffre d’affaires, marge, panier moyen, meilleures ventes"],
  [Package, "Gestion du stock", "Mouvements, seuils d’alerte, valeur du stock, réassort par WhatsApp"],
  [ShoppingCart, "Caisse", "Ventes au comptoir, Mobile Money, stock décompté automatiquement"],
  [Users, "Fichier clients", "Historique d’achats, notes, relance des clients inactifs"],
  [BadgePercent, "Promotions", "Prix barrés sur votre vitrine Artopif, avec date de fin"],
  [Store, "Vitrine et statistiques", "Infos de la boutique, vues, clics et appels reçus"],
] as const;

export function EspaceBoutique() {
  const { etat, maj, reinitialiser } = useBoutique();
  const [onglet, setOnglet] = useState<Onglet>("accueil");

  if (!etat) return <div className="h-[70vh] animate-pulse rounded-2xl bg-card" aria-busy />;
  const premium = etat.formule === "premium";
  const changerFormule = (formule: "gratuit" | "premium") => {
    maj((e) => ({ ...e, formule }));
    setOnglet("accueil");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
            Espace boutique
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] tracking-normal ${
                premium ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {premium && <Crown className="size-3" />} {premium ? "Premium" : "Gratuit"}
            </span>
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-tight">{etat.infos.nom}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" /> {etat.infos.adresse} · {etat.infos.horaires}
          </p>
        </div>
        <Link
          href="/quincaillerie"
          className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-border"
        >
          Voir ma vitrine <ExternalLink className="size-3.5" />
        </Link>
      </div>

      {!premium ? (
        <div className="mt-6 space-y-10">
          <Reservations reservations={etat.reservations} maj={maj} />

          <section className="overflow-hidden rounded-3xl bg-foreground text-white shadow-lg">
            <div className="p-6 md:p-8">
              <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-accent uppercase">
                <Crown className="size-4" /> Boutique Premium
              </p>
              <h2 className="mt-2 font-serif text-3xl leading-tight">Gérez toute votre boutique depuis Artopif</h2>
              <p className="mt-2 max-w-xl text-sm text-white/70">
                La formule gratuite vous donne vos réservations. Premium ajoute un vrai logiciel de gestion,
                pensé pour les quincailleries de Brazzaville.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {AVANTAGES_PREMIUM.map(([Icon, t, d]) => (
                  <li key={t} className="flex gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
                    <span>
                      <span className="flex items-center gap-1.5 font-bold">
                        {t} <Lock className="size-3 text-white/40" />
                      </span>
                      <span className="text-sm text-white/65">{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
              <p className="text-sm">
                <span className="font-bold">Tarif communiqué prochainement.</span>{" "}
                <span className="text-white/65">Votre fiche et vos réservations restent gratuites.</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/services#contact" className="rounded-xl border border-white/30 px-4 py-2.5 text-sm font-bold">
                  Être recontacté
                </Link>
                {/* MAQUETTE : activation directe pour la démonstration, sans paiement */}
                <button
                  onClick={() => changerFormule("premium")}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground"
                >
                  Essayer Premium
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
          <nav aria-label="Espace boutique" className="-mx-5 mb-5 overflow-x-auto px-5 lg:mx-0 lg:mb-0 lg:overflow-visible lg:px-0">
            <ul className="flex gap-2 lg:sticky lg:top-24 lg:flex-col lg:gap-1">
              {ONGLETS.map(({ id, label, Icon }) => {
                const actif = onglet === id;
                const badge = id === "reservations" ? etat.reservations.filter((r) => r.statut === "a-confirmer").length : 0;
                return (
                  <li key={id} className="shrink-0">
                    <button
                      onClick={() => setOnglet(id)}
                      aria-current={actif ? "page" : undefined}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                        actif ? "bg-primary text-white shadow-sm" : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground lg:bg-transparent lg:ring-0"
                      }`}
                    >
                      <Icon className="size-4" /> {label}
                      {badge > 0 && (
                        <span className="ml-auto rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">{badge}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0">
            {onglet === "accueil" && <Dashboard etat={etat} aller={setOnglet} />}
            {onglet === "reservations" && <Reservations reservations={etat.reservations} maj={maj} />}
            {onglet === "caisse" && <Caisse etat={etat} maj={maj} />}
            {onglet === "stock" && <Stock etat={etat} maj={maj} />}
            {onglet === "clients" && <Clients etat={etat} maj={maj} />}
            {onglet === "promotions" && <Promotions etat={etat} maj={maj} />}
            {onglet === "boutique" && <MaBoutique etat={etat} maj={maj} />}

            <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Check className="size-3.5 text-success" /> Formule Premium active
              </span>
              <button onClick={() => changerFormule("gratuit")} className="underline">
                Revenir à la formule gratuite (démo)
              </button>
              <button onClick={reinitialiser} className="underline">
                Réinitialiser les données de démo
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
