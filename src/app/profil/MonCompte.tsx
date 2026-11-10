"use client";

import Image from "next/image";
import Link from "next/link";
import { Crown, Heart, LogOut } from "lucide-react";
import { ChoixFormules, CompteurProfils, InscriptionClient } from "@/components/Acces";
import { useCompte } from "@/lib/compte";

type Fiche = { id: string; nom: string; metier: string; quartier: string; image?: string };

export function MonCompte({ annuaire }: { annuaire: Fiche[] }) {
  const c = useCompte();

  if (!c.pret) return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-card" />;
  if (!c.inscrit)
    return (
      <div className="mt-6 rounded-2xl bg-card p-5 shadow-sm">
        <h2 className="font-serif text-2xl">Créez votre compte gratuit</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Consultez les profils complets des artisans, gardez vos favoris et donnez votre avis.
        </p>
        <InscriptionClient />
      </div>
    );

  const favoris = annuaire.filter((a) => c.favoris.includes(a.id));

  return (
    <div className="mt-6 space-y-5">
      <section className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-2xl text-white">
          {c.compte!.prenom[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-2xl">
            {c.compte!.prenom} {c.compte!.nom ?? ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {c.compte!.telephone}
            {c.compte!.ville && (
              <>
                {" · "}
                {c.compte!.quartier}, {c.compte!.ville}
              </>
            )}
          </p>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
            c.premium ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {c.premium && <Crown className="size-3.5" />} {c.premium ? "Premium" : "Gratuit"}
        </span>
      </section>

      <CompteurProfils />
      {!c.premium && (
        <section id="formules" className="scroll-mt-24">
          <h2 className="mb-3 text-xl font-bold">Les formules</h2>
          <ChoixFormules actuelle="gratuit" />
        </section>
      )}

      <section>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Heart className="size-5" /> Mes favoris
        </h2>
        {favoris.length ? (
          <ul className="mt-3 space-y-2">
            {favoris.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/artisans/${a.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm transition hover:shadow-md"
                >
                  {a.image ? (
                    <Image src={a.image} alt="" width={56} height={56} className="size-14 rounded-xl object-cover" />
                  ) : (
                    <span className="flex size-14 items-center justify-center rounded-xl bg-primary font-serif text-xl text-white">
                      {a.nom[0]}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{a.nom}</span>
                    <span className="text-sm text-muted-foreground">
                      {a.metier} · {a.quartier}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
            Aucun favori pour l’instant. Touchez « Ajouter aux favoris » sur le profil d’un artisan pour le
            retrouver ici.
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={c.deconnecter}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold text-muted-foreground"
      >
        <LogOut className="size-4" /> Se déconnecter
      </button>
    </div>
  );
}
