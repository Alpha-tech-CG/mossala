"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConnexionTelephone } from "@/components/ConnexionTelephone";
import { SUPABASE_ACTIF } from "@/lib/backend/supabase";
import { monProfilPro } from "@/lib/backend/pros";
import { rechargerProConnecte } from "@/lib/pro-connecte";

/** Connexion d'un artisan ou d'une boutique par code SMS, puis redirection vers son espace. */
export function ConnexionPro() {
  const router = useRouter();
  const [sansProfil, setSansProfil] = useState(false);

  if (!SUPABASE_ACTIF) {
    return (
      <div className="mt-6 rounded-2xl bg-card p-6 text-sm shadow-sm">
        <p>La connexion des professionnels sera active avec la mise en ligne. En attendant, découvrez les espaces de démonstration :</p>
        <div className="mt-4 grid gap-2">
          <Link href="/pro/espace" className="rounded-xl bg-primary py-3 text-center font-bold text-primary-foreground">
            Espace artisan (démo)
          </Link>
          <Link href="/pro/boutique" className="rounded-xl border border-border py-3 text-center font-bold">
            Espace boutique (démo)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
      <h1 className="font-serif text-2xl">Connexion à mon espace</h1>
      {sansProfil ? (
        <div className="mt-4 space-y-3 text-sm">
          <p>Ce numéro n’a pas encore de profil professionnel.</p>
          <Link href="/pro/inscription" className="block rounded-xl bg-accent py-3 text-center font-bold text-accent-foreground">
            Créer mon profil artisan
          </Link>
          <Link href="/pro/inscription?type=boutique" className="block rounded-xl border border-border py-3 text-center font-bold">
            Inscrire ma boutique
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <ConnexionTelephone
            intro="Saisissez le numéro utilisé à l’inscription : vous recevrez un code par SMS."
            onConnecte={async ({ id }) => {
              const pro = await monProfilPro(id);
              await rechargerProConnecte();
              if (!pro) return setSansProfil(true);
              router.push(pro.type === "boutique" ? "/pro/boutique" : "/pro/espace");
            }}
          />
        </div>
      )}
    </div>
  );
}
