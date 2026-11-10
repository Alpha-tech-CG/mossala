import type { Metadata } from "next";
import { Agenda } from "./Agenda";

export const metadata: Metadata = { title: "Mon agenda — Artopif" };

export default function AgendaPage() {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Novembre 2026</p>
      <h1 className="mt-1 font-serif text-3xl">Mon agenda</h1>
      <Agenda />
    </div>
  );
}
