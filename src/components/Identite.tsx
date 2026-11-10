"use client";

import { Hammer, MessageCircle, Plus, Search, Store, X } from "lucide-react";
import { VILLE_DEFAUT, getVille, villes } from "@/lib/data";

/* Champs communs à toutes les inscriptions (client, artisan, magasin). */

export type Telephone = { numero: string; whatsapp: boolean };

export type Identite = {
  nom: string;
  prenom: string;
  adresse: string;
  ville: string;
  quartier: string;
  /** facultatif */
  email: string;
  /** de 1 à 3 numéros ; le premier est obligatoire */
  telephones: Telephone[];
};

export const MAX_TELEPHONES = 3;

export const identiteVide = (telephone = ""): Identite => ({
  nom: "",
  prenom: "",
  adresse: "",
  ville: VILLE_DEFAUT,
  quartier: "",
  email: "",
  telephones: [{ numero: telephone, whatsapp: true }],
});

const numeroValide = (n: string) => n.replace(/\D/g, "").length >= 9;
const emailValide = (e: string) => !e.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export const identiteValide = (i: Identite) =>
  !!(i.nom.trim() && i.prenom.trim() && i.adresse.trim() && i.ville && i.quartier.trim()) &&
  numeroValide(i.telephones[0]?.numero ?? "") &&
  i.telephones.every((t, k) => k === 0 || !t.numero.trim() || numeroValide(t.numero)) &&
  emailValide(i.email);

/** Identité nettoyée : espaces retirés, numéros vides supprimés. */
export const identitePropre = (i: Identite): Identite => ({
  ...i,
  nom: i.nom.trim(),
  prenom: i.prenom.trim(),
  adresse: i.adresse.trim(),
  quartier: i.quartier.trim(),
  email: i.email.trim(),
  telephones: i.telephones.filter((t) => t.numero.trim()).map((t) => ({ ...t, numero: t.numero.trim() })),
});

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";
const etiquette = "mb-1.5 block text-sm font-semibold";
const obligatoire = <span className="text-destructive"> *</span>;

/**
 * Nom et prénom chacun sur sa ligne, adresse, ville et quartier obligatoires,
 * email facultatif, jusqu'à 3 téléphones en précisant ceux qui ont WhatsApp.
 */
export function ChampsIdentite({
  value: v,
  onChange,
  id = "id",
  adresseLabel = "Adresse",
  premierVerrouille = false,
}: {
  value: Identite;
  onChange: (v: Identite) => void;
  id?: string;
  adresseLabel?: string;
  /** le 1er numéro vient d'être vérifié par SMS : on ne le modifie plus ici */
  premierVerrouille?: boolean;
}) {
  const set = (k: keyof Identite) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...v, [k]: e.target.value });
  const quartiers = getVille(v.ville)?.quartiers ?? [];
  const setTel = (k: number, t: Partial<Telephone>) =>
    onChange({ ...v, telephones: v.telephones.map((x, j) => (j === k ? { ...x, ...t } : x)) });

  return (
    <div className="space-y-3.5">
      <div>
        <label htmlFor={`${id}-nom`} className={etiquette}>
          Nom{obligatoire}
        </label>
        <input id={`${id}-nom`} required autoComplete="family-name" value={v.nom} onChange={set("nom")} placeholder="Ex. Mbemba" className={field} />
      </div>
      <div>
        <label htmlFor={`${id}-prenom`} className={etiquette}>
          Prénom{obligatoire}
        </label>
        <input id={`${id}-prenom`} required autoComplete="given-name" value={v.prenom} onChange={set("prenom")} placeholder="Ex. Grâce" className={field} />
      </div>
      <div>
        <label htmlFor={`${id}-adresse`} className={etiquette}>
          {adresseLabel}
          {obligatoire}
        </label>
        <input
          id={`${id}-adresse`}
          required
          autoComplete="street-address"
          value={v.adresse}
          onChange={set("adresse")}
          placeholder="Rue, numéro, repère connu"
          className={field}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-ville`} className={etiquette}>
            Ville{obligatoire}
          </label>
          <select
            id={`${id}-ville`}
            required
            value={v.ville}
            onChange={(e) => onChange({ ...v, ville: e.target.value, quartier: "" })}
            className={field}
          >
            {villes.map((x) => (
              <option key={x.nom} value={x.nom}>
                {x.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-quartier`} className={etiquette}>
            Quartier{obligatoire}
          </label>
          {quartiers.length ? (
            <select id={`${id}-quartier`} required value={v.quartier} onChange={set("quartier")} className={field}>
              <option value="" disabled>
                Choisissez
              </option>
              {quartiers.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          ) : (
            <input id={`${id}-quartier`} required value={v.quartier} onChange={set("quartier")} placeholder="Votre quartier" className={field} />
          )}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-email`} className={etiquette}>
          Email <span className="font-normal text-muted-foreground">(facultatif)</span>
        </label>
        <input id={`${id}-email`} type="email" autoComplete="email" value={v.email} onChange={set("email")} placeholder="vous@exemple.com" className={field} />
      </div>

      <fieldset>
        <legend className={etiquette}>
          Téléphone{obligatoire}{" "}
          <span className="font-normal text-muted-foreground">· jusqu’à {MAX_TELEPHONES} numéros</span>
        </legend>
        <div className="space-y-2">
          {v.telephones.map((t, k) => {
            const verrou = premierVerrouille && k === 0;
            return (
              <div key={k} className="flex items-center gap-2">
                <input
                  type="tel"
                  inputMode="tel"
                  aria-label={`Téléphone ${k + 1}`}
                  required={k === 0}
                  readOnly={verrou}
                  autoComplete={k === 0 ? "tel" : "off"}
                  value={t.numero}
                  onChange={(e) => setTel(k, { numero: e.target.value })}
                  placeholder={k === 0 ? "06 000 00 00" : `Numéro ${k + 1} (facultatif)`}
                  className={`${field} min-w-0 flex-1 ${verrou ? "bg-muted" : ""}`}
                />
                <button
                  type="button"
                  aria-pressed={t.whatsapp}
                  onClick={() => setTel(k, { whatsapp: !t.whatsapp })}
                  title="Ce numéro a WhatsApp"
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold transition ${
                    t.whatsapp ? "border-[#25D366] bg-[#25D366]/10 text-[#128C4B]" : "border-border bg-white text-muted-foreground"
                  }`}
                >
                  <MessageCircle className="size-4" /> WhatsApp
                </button>
                {k > 0 && (
                  <button
                    type="button"
                    aria-label={`Retirer le numéro ${k + 1}`}
                    onClick={() => onChange({ ...v, telephones: v.telephones.filter((_, j) => j !== k) })}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {v.telephones.length < MAX_TELEPHONES && (
          <button
            type="button"
            onClick={() => onChange({ ...v, telephones: [...v.telephones, { numero: "", whatsapp: false }] })}
            className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <Plus className="size-4" /> Ajouter un numéro
          </button>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">Touchez « WhatsApp » pour indiquer les numéros joignables sur WhatsApp.</p>
      </fieldset>
    </div>
  );
}

export type TypeProfil = "client" | "artisan" | "magasin";

export const PROFILS: { id: TypeProfil; label: string; d: string; Icon: typeof Store }[] = [
  { id: "client", label: "Client", d: "Recherche des artisans et des magasins.", Icon: Search },
  { id: "artisan", label: "Artisan", d: "Présente ses compétences et reçoit des demandes de prestations.", Icon: Hammer },
  { id: "magasin", label: "Magasin", d: "Présente ses produits et reçoit des demandes de clients.", Icon: Store },
];

/** Choix du type de compte : Client, Artisan ou Magasin. */
export function ChoixProfil({ actuel, onChoisir }: { actuel: TypeProfil; onChoisir: (t: TypeProfil) => void }) {
  const choisi = PROFILS.find((p) => p.id === actuel)!;
  return (
    <div>
      <p className={etiquette}>Je m’inscris en tant que</p>
      <div role="radiogroup" aria-label="Type de compte" className="grid grid-cols-3 gap-2">
        {PROFILS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={actuel === id}
            onClick={() => onChoisir(id)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-sm font-bold transition ${
              actuel === id ? "border-primary bg-secondary text-primary" : "border-border bg-white"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        <strong className="text-foreground">{choisi.label} :</strong> {choisi.d}
      </p>
    </div>
  );
}
