"use client";

import { useState } from "react";

/** Bascule « Je suis disponible » (maquette validée). */
export function DispoToggle({ quartier }: { quartier: string }) {
  const [on, setOn] = useState(true);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left shadow-sm ring-1 transition ${
        on ? "bg-success/10 ring-success/30" : "bg-card ring-border"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{on ? "Je suis disponible" : "Je ne suis pas disponible"}</span>
        <span className="block text-sm text-muted-foreground">
          {on
            ? `Les clients de ${quartier} peuvent vous contacter`
            : "Vous n’apparaissez plus dans « Dispo aujourd’hui »"}
        </span>
      </span>
      <span
        aria-hidden
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-muted-foreground/40"}`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}
