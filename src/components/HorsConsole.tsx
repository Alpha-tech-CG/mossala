"use client";

import { usePathname } from "next/navigation";

/** Masque l'habillage du site (en-tête, pied de page…) dans la console admin, qui a le sien. */
export function HorsConsole({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return path.startsWith("/admin") ? null : <>{children}</>;
}
