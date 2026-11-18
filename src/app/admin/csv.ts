/**
 * Export CSV des listes du backoffice, lisible directement dans Excel en français :
 * séparateur « ; », encodage UTF-8 avec BOM (accents corrects).
 */
export type Ligne = Record<string, string | number | boolean | null | undefined>;

const cellule = (v: Ligne[string]) => {
  const t = v === null || v === undefined ? "" : typeof v === "boolean" ? (v ? "oui" : "non") : String(v);
  // une formule (=, +, -, @) serait exécutée par le tableur : on la neutralise
  const sur = /^[=+\-@]/.test(t) ? `'${t}` : t;
  return /[";\n\r]/.test(sur) ? `"${sur.replace(/"/g, '""')}"` : sur;
};

export function telechargerCsv(nom: string, lignes: Ligne[]) {
  const colonnes = [...new Set(lignes.flatMap((l) => Object.keys(l)))];
  const texte = [colonnes.map(cellule).join(";"), ...lignes.map((l) => colonnes.map((c) => cellule(l[c])).join(";"))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + texte], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `artopif-${nom}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Date lisible dans un tableur, à l'heure locale (« 2026-11-18 10:52 »). */
export function dateCsv(ms: number) {
  if (!ms) return "";
  const d = new Date(ms);
  const deux = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())} ${deux(d.getHours())}:${deux(d.getMinutes())}`;
}
