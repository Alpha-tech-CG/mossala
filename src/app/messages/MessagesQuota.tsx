"use client";

import Link from "next/link";
import { useState } from "react";
import { BellRing, Infinity as InfinityIcon, Phone } from "lucide-react";
import { QuotaLine } from "@/components/Contact";
import { DUREE_ILLIMITE_JOURS, PRIX_ILLIMITE_FCFA, fcfa } from "@/lib/data";
import { useQuota } from "@/lib/quota";

export function MessagesQuota() {
  const q = useQuota();
  const [operateur, setOperateur] = useState<"MTN MoMo" | "Airtel Money">("MTN MoMo");
  const [enCours, setEnCours] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      <QuotaLine illimite={q.illimite} restants={q.restants} jusqua={q.illimiteJusqua} mois={q.mois} />

      {!q.illimite && (
        <div className="rounded-2xl bg-foreground p-5 text-white">
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-accent uppercase">
            <InfinityIcon className="size-4" /> Messages illimités
          </p>
          <p className="mt-2 font-serif text-4xl">{fcfa(PRIX_ILLIMITE_FCFA)}</p>
          <p className="mt-1 text-sm text-white/75">
            Contactez autant d’artisans que vous voulez pendant {DUREE_ILLIMITE_JOURS} jours.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["MTN MoMo", "Airtel Money"] as const).map((o) => (
              <button
                key={o}
                aria-pressed={operateur === o}
                onClick={() => setOperateur(o)}
                className={`rounded-xl border-2 py-2.5 text-sm font-bold ${
                  operateur === o ? "border-accent bg-white/10" : "border-white/20"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <button
            disabled={enCours}
            onClick={() => {
              setEnCours(true);
              setTimeout(() => {
                q.activerIllimite();
                setEnCours(false);
              }, 1200);
            }}
            className="mt-3 w-full rounded-xl bg-accent py-3.5 font-bold disabled:opacity-70"
          >
            {enCours ? "Confirmation sur votre téléphone…" : `Payer avec ${operateur}`}
          </button>
        </div>
      )}

      <ul className="space-y-3 rounded-2xl bg-card p-5 text-sm shadow-sm ring-1 ring-black/[0.03]">
        <li className="flex gap-3">
          <Phone className="mt-0.5 size-4 shrink-0 text-success" />
          Les appels aux artisans dont le numéro est public sont toujours gratuits et illimités.
        </li>
        <li className="flex gap-3">
          <BellRing className="mt-0.5 size-4 shrink-0 text-primary" />
          Chaque message prévient l’artisan par WhatsApp et SMS : il vous rappelle sur votre numéro.
        </li>
      </ul>

      <Link
        href="/recherche"
        className="block rounded-xl bg-accent py-4 text-center font-bold text-accent-foreground"
      >
        Contactez un artisan
      </Link>
    </div>
  );
}
