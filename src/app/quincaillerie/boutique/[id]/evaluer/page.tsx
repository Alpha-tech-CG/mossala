import { notFound } from "next/navigation";
import { Evaluation } from "@/components/Evaluation";
import { BackHeader } from "@/components/ui";
import { boutiques } from "@/lib/data";

export const instant = false;

export function generateStaticParams() {
  return boutiques.map((b) => ({ id: b.id }));
}

const trouver = (id: string) => boutiques.find((b) => b.id === id);

export async function generateMetadata(props: PageProps<"/quincaillerie/boutique/[id]/evaluer">) {
  const b = trouver((await props.params).id);
  return { title: b ? `Évaluer ${b.nom} — Artopif` : "Magasin introuvable" };
}

export default async function EvaluerMagasinPage(props: PageProps<"/quincaillerie/boutique/[id]/evaluer">) {
  const b = trouver((await props.params).id);
  if (!b) notFound();
  return (
    <div className="mx-auto max-w-3xl px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Évaluer un magasin" href={`/quincaillerie/boutique/${b.id}`} />
      <Evaluation
        type="magasin"
        cibleId={b.id}
        nom={b.nom}
        sousTitre={`Quincaillerie · ${b.quartier}, ${b.ville}`}
        retour={`/quincaillerie/boutique/${b.id}`}
      />
    </div>
  );
}
