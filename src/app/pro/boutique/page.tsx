import type { Metadata } from "next";
import { EspaceBoutique } from "./EspaceBoutique";

export const metadata: Metadata = { title: "Mon espace boutique — Artopif" };

export default function BoutiquePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-5 pb-14 md:pt-8">
      <EspaceBoutique />
    </div>
  );
}
