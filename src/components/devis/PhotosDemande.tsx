/** Photos jointes à une demande de devis (Devis en photo, application mobile). Toucher ouvre en grand. */
export function PhotosDemande({ photos }: { photos?: string[] }) {
  if (!photos?.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {photos.map((src, i) => (
        <li key={i}>
          <a href={src} target="_blank" rel="noreferrer" className="block size-24 overflow-hidden rounded-xl bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Photo ${i + 1} du problème`} className="size-full object-cover" />
          </a>
        </li>
      ))}
    </ul>
  );
}
