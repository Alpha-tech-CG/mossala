import { notFound } from "next/navigation";
import { BackHeader } from "@/components/ui";
import { artisans, getArtisan, metierLabel } from "@/lib/data";
import { Evaluation } from "@/components/Evaluation";

export const instant = false;

export function generateStaticParams() {
  return artisans.map((a) => ({ id: a.id }));
}

export async function generateMetadata(props: PageProps<"/artisans/[id]/evaluer">) {
  const a = getArtisan((await props.params).id);
  return { title: a ? `Évaluer ${a.nom} — Artopif` : "Artisan introuvable" };
}

export default async function EvaluerPage(props: PageProps<"/artisans/[id]/evaluer">) {
  const a = getArtisan((await props.params).id);
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-3xl px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Évaluer un professionnel" href={`/artisans/${a.id}`} />
      <Evaluation
        cibleId={a.id}
        nom={a.nom}
        sousTitre={`${metierLabel(a.metier).artisan} · ${a.quartier}`}
        retour={`/artisans/${a.id}`}
      />
    </div>
  );
}
