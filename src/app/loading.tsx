import { LoaderArtopif } from "@/components/Loader";

/** Affiché pendant le chargement d'une page. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoaderArtopif />
    </div>
  );
}
