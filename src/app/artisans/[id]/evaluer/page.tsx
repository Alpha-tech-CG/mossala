import { notFound } from "next/navigation";
import { BackHeader } from "@/components/ui";
import { artisans, getArtisan, metierLabel } from "@/lib/data";
import { Evaluation } from "./Evaluation";

export const instant = false;

export function generateStaticParams() {
  return artisans.map((a) => ({ id: a.id }));
}

export async function generateMetadata(props: PageProps<"/artisans/[id]/evaluer">) {
  const a = getArtisan((await props.params).id);
  return { title: a ? `Évaluer ${a.nom} — Artico` : "Artisan introuvable" };
}

export default async function EvaluerPage(props: PageProps<"/artisans/[id]/evaluer">) {
  const a = getArtisan((await props.params).id);
  if (!a) notFound();
  return (
    <div className="mx-auto max-w-3xl px-5 pt-4 pb-16 md:pt-8">
      <BackHeader title="Évaluer un professionnel" href={`/artisans/${a.id}`} />
      <Evaluation id={a.id} nom={a.nom} metier={metierLabel(a.metier).artisan} quartier={a.quartier} />
    </div>
  );
}
