"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { noterPageVue } from "@/lib/audience";

/** Compte chaque page vue (maquette : dans ce navigateur, voir src/lib/audience.ts). */
export function MesureAudience() {
  const path = usePathname();
  useEffect(() => {
    noterPageVue(path);
  }, [path]);
  return null;
}
