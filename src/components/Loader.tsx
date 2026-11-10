"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Castor Artopif qui flotte + barre dorée qui défile. */
export function LoaderArtopif({ label = "Chargement…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
      <Image
        src="/images/artopif-embleme.png"
        alt=""
        width={1076}
        height={470}
        priority
        className="loader-emblem h-16 w-auto md:h-20"
      />
      <span className="loader-bar" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Écran d'accueil affiché au premier chargement du site, puis effacé en fondu
 * dès que la page est prête (minimum 600 ms pour éviter un simple clignement).
 */
export function SplashLoader() {
  const [etape, setEtape] = useState<"visible" | "fondu" | "parti">("visible");

  useEffect(() => {
    const debut = performance.now();
    let t: ReturnType<typeof setTimeout>;
    const terminer = () => {
      t = setTimeout(() => {
        setEtape("fondu");
        // retiré de la page après le fondu, même si l'animation ne se joue pas (onglet en arrière-plan)
        t = setTimeout(() => setEtape("parti"), 500);
      }, Math.max(0, 600 - (performance.now() - debut)));
    };
    if (document.readyState === "complete") terminer();
    else window.addEventListener("load", terminer, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("load", terminer);
    };
  }, []);

  if (etape === "parti") return null;
  return (
    <div className={`splash ${etape === "fondu" ? "is-done" : ""}`} aria-hidden={etape === "fondu"}>
      <LoaderArtopif />
    </div>
  );
}
