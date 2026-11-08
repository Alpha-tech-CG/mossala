"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Camera, CheckCircle2, ChevronDown, Send } from "lucide-react";
import { getArtisan, metierLabel, metiers, quartiers } from "@/lib/data";

const urgences = [
  { id: "normal", label: "Normal", sub: "Cette semaine" },
  { id: "urgent", label: "Urgent", sub: "Sous 48 h" },
  { id: "tres-urgent", label: "Très urgent", sub: "Aujourd’hui" },
];

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-4 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

export function DevisForm() {
  const params = useSearchParams();
  const artisan = getArtisan(params.get("artisan") ?? "");
  const similaire = params.get("similaire");
  const [desc, setDesc] = useState(similaire ? `Travaux similaires à : ${similaire}. ` : "");
  const [urgence, setUrgence] = useState("normal");
  const [photos, setPhotos] = useState<string[]>([]);
  const [envoye, setEnvoye] = useState(false);

  if (envoye) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-2xl bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="size-14 text-success" />
        <h2 className="mt-4 text-xl font-bold">Demande envoyée</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {artisan
            ? `${artisan.nom} et d’autres artisans disponibles vont vous répondre.`
            : "Les artisans disponibles dans votre quartier vont vous répondre."}{" "}
          Vous serez prévenu par SMS ou WhatsApp.
        </p>
        <Link
          href="/devis"
          className="mt-6 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground"
        >
          Voir mes devis
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setEnvoye(true);
      }}
    >
      <div>
        <h2 className="text-xl font-bold">Décrivez votre besoin</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plus votre description est précise, mieux les artisans peuvent chiffrer votre travail.
        </p>
        {artisan && (
          <p className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm text-primary">
            Demande adressée en priorité à <strong>{artisan.nom}</strong>.
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="metier">
          Type de travaux
        </label>
        <div className="relative">
          <select
            id="metier"
            required
            defaultValue={artisan?.metier ?? ""}
            className={`${field} appearance-none`}
          >
            <option value="" disabled>
              Choisissez un métier
            </option>
            {metiers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="desc">
          Votre besoin
        </label>
        <textarea
          id="desc"
          required
          rows={4}
          maxLength={500}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className={`${field} resize-none`}
          placeholder="Ex. Fuite d’eau sous l’évier de la cuisine, le robinet goutte aussi."
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{desc.length} / 500</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Photos (facultatif)</p>
        <div className="grid grid-cols-4 gap-3">
          {photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="aspect-square rounded-xl object-cover" />
          ))}
          {photos.length < 4 && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary bg-secondary text-sm font-semibold text-primary">
              <Camera className="size-6" />
              Ajouter
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []).slice(0, 4 - photos.length);
                  setPhotos((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
                }}
              />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Jusqu’à 4 photos du problème.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="quartier">
            Quartier
          </label>
          <div className="relative">
            <select id="quartier" required defaultValue="" className={`${field} appearance-none`}>
              <option value="" disabled>
                Choisissez votre quartier
              </option>
              {quartiers.map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="date">
            Date souhaitée
          </label>
          <input id="date" type="date" required className={field} />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Niveau d’urgence</legend>
        <div className="grid grid-cols-3 gap-3">
          {urgences.map((u) => (
            <button
              key={u.id}
              type="button"
              aria-pressed={urgence === u.id}
              onClick={() => setUrgence(u.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-xs ${
                urgence === u.id ? "border-primary bg-secondary text-primary" : "border-border bg-card"
              }`}
            >
              <span className="text-sm font-bold">{u.label}</span>
              {u.sub}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="budget">
          Budget indicatif (facultatif)
        </label>
        <div className="relative">
          <input id="budget" inputMode="numeric" placeholder="Ex. 50 000" className={`${field} pr-20`} />
          <span className="absolute top-1/2 right-4 -translate-y-1/2 text-sm font-bold text-muted-foreground">
            FCFA
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Indicatif seulement : les artisans établiront leur propre devis.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="tel">
          Téléphone / WhatsApp
        </label>
        <input id="tel" type="tel" required placeholder="06 000 00 00" className={field} />
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-bold text-accent-foreground transition-transform active:scale-[0.98]"
      >
        <Send className="size-5" /> Envoyer ma demande
      </button>
      {artisan && (
        <p className="text-center text-xs text-muted-foreground">
          {metierLabel(artisan.metier).label} · Aucune commission prélevée sur la prestation.
        </p>
      )}
    </form>
  );
}
