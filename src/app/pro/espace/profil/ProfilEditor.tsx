"use client";

import Image from "next/image";
import { useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Camera,
  Check,
  CheckCircle2,
  Lock,
  MessageSquareReply,
  Phone,
  Plus,
  Star,
  X,
} from "lucide-react";
import type { Avis, Realisation } from "@/lib/data";
import { quartiers } from "@/lib/data";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

function Carte({ titre, eyebrow, children }: { titre: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03] md:p-6">
      {eyebrow && <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">{eyebrow}</p>}
      <h2 className="mt-1 text-lg font-bold">{titre}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Interrupteur({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center gap-4 py-2 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-muted-foreground">{sub}</span>
      </span>
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-success" : "bg-muted-foreground/40"}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

export function ProfilEditor(props: {
  nom: string;
  metier: string;
  description: string;
  zones: string[];
  telephone: string;
  numeroPublic: boolean;
  realisations: Realisation[];
  avis: Avis[];
}) {
  const [description, setDescription] = useState(props.description);
  const [zones, setZones] = useState(props.zones);
  const [numeroPublic, setNumeroPublic] = useState(props.numeroPublic);
  const [alerteWa, setAlerteWa] = useState(true);
  const [alerteSms, setAlerteSms] = useState(true);
  const [enregistre, setEnregistre] = useState(false);

  const [realisations, setRealisations] = useState(props.realisations);
  const [formOuvert, setFormOuvert] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [titre, setTitre] = useState("");
  const [desc, setDesc] = useState("");

  const [reponses, setReponses] = useState<Record<string, string>>(
    Object.fromEntries(props.avis.filter((a) => a.reponse).map((a) => [a.auteur, a.reponse!])),
  );
  const [brouillons, setBrouillons] = useState<Record<string, string>>({});

  const sauver = () => {
    // TODO Firebase : mettre à jour le profil
    setEnregistre(true);
    setTimeout(() => setEnregistre(false), 2500);
  };

  return (
    <div className="mt-6 space-y-5">
      {/* Contact : le réglage central du nouveau fonctionnement */}
      <Carte eyebrow="Mise en relation" titre="Comment les clients vous contactent">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { v: true, Icon: Phone, t: "Numéro public", d: `Affiché sur votre profil : ${props.telephone}` },
            { v: false, Icon: Lock, t: "Numéro privé", d: "Caché. Les clients vous laissent un message." },
          ].map(({ v, Icon, t, d }) => (
            <button
              key={t}
              type="button"
              aria-pressed={numeroPublic === v}
              onClick={() => setNumeroPublic(v)}
              className={`flex gap-3 rounded-2xl border-2 p-4 text-left transition ${
                numeroPublic === v ? "border-primary bg-secondary" : "border-border bg-white"
              }`}
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${numeroPublic === v ? "bg-primary text-white" : "bg-muted"}`}>
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block font-bold">{t}</span>
                <span className="block text-sm text-muted-foreground">{d}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 divide-y divide-border border-t border-border">
          <Interrupteur on={alerteWa} onChange={setAlerteWa} label="Alerte WhatsApp" sub="Recevoir chaque nouveau message client sur WhatsApp" />
          <Interrupteur on={alerteSms} onChange={setAlerteSms} label="Alerte SMS" sub="Recevoir aussi un SMS (utile sans connexion internet)" />
        </div>
        {!alerteWa && !alerteSms && (
          <p className="mt-2 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" /> Sans alerte, vous risquez de manquer des clients.
          </p>
        )}
      </Carte>

      <Carte eyebrow="Profil public" titre="Mes informations">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-semibold">Nom professionnel</p>
              <p className="rounded-xl bg-muted px-4 py-3 text-sm">{props.nom}</p>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold">Métier</p>
              <p className="rounded-xl bg-muted px-4 py-3 text-sm">{props.metier}</p>
            </div>
          </div>
          <div>
            <label htmlFor="desc" className="mb-1.5 block text-sm font-semibold">
              Présentation
            </label>
            <textarea id="desc" rows={3} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} className={`${field} resize-none`} />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Quartiers couverts</legend>
            <div className="flex flex-wrap gap-2">
              {quartiers.map((q) => {
                const on = zones.includes(q);
                return (
                  <button
                    type="button"
                    key={q}
                    aria-pressed={on}
                    onClick={() => setZones(on ? zones.filter((z) => z !== q) : [...zones, q])}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${on ? "bg-primary text-white ring-primary" : "bg-white ring-border"}`}
                  >
                    {on && <Check className="size-3.5" />} {q}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      </Carte>

      <Carte eyebrow="Vitrine" titre={`Mes réalisations (${realisations.length})`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {realisations.map((r) => (
            <figure key={r.titre} className="relative overflow-hidden rounded-xl bg-muted">
              <Image src={r.image} alt={r.titre} width={300} height={300} className="aspect-square w-full object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 pt-6 text-xs font-semibold text-white">
                {r.titre}
              </figcaption>
              <button
                type="button"
                aria-label={`Supprimer ${r.titre}`}
                onClick={() => setRealisations(realisations.filter((x) => x !== r))}
                className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-white/90 shadow"
              >
                <X className="size-4" />
              </button>
            </figure>
          ))}
          {!formOuvert && (
            <button
              type="button"
              onClick={() => setFormOuvert(true)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary bg-secondary text-sm font-semibold text-primary"
            >
              <Plus className="size-6" /> Ajouter
            </button>
          )}
        </div>

        {formOuvert && (
          <form
            className="mt-5 space-y-4 rounded-2xl bg-background p-4 ring-1 ring-border"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO Firebase : envoyer les photos (Cloud Storage) et créer la réalisation
              setRealisations([
                ...realisations,
                { titre, type: props.metier, quartier: zones[0] ?? "", description: desc, materiaux: "", duree: "", image: photos[0] ?? "/images/jean-claude.jpg", verifiee: false },
              ]);
              setFormOuvert(false);
              setTitre("");
              setDesc("");
              setPhotos([]);
            }}
          >
            <p className="flex gap-2 rounded-xl bg-accent/10 p-3 text-xs text-foreground">
              <AlertTriangle className="size-4 shrink-0 text-accent-ink" />
              Ne publiez pas les informations personnelles, adresses, documents ou photos de clients sans
              autorisation.
            </p>
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={p} alt="" className="size-20 rounded-xl object-cover" />
              ))}
              {photos.length < 10 && (
                <label className="flex size-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary text-xs font-semibold text-primary">
                  <Camera className="size-5" /> Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) =>
                      setPhotos((p) => [...p, ...Array.from(e.target.files ?? []).slice(0, 10 - p.length).map((f) => URL.createObjectURL(f))])
                    }
                  />
                </label>
              )}
            </div>
            <input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre (ex. Rénovation salle de bain)" className={field} />
            <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description du travail, matériaux, durée…" className={`${field} resize-none`} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setFormOuvert(false)} className="flex-1 rounded-xl border border-border py-3 font-semibold">
                Annuler
              </button>
              <button className="flex-1 rounded-xl bg-primary py-3 font-bold text-primary-foreground">Publier</button>
            </div>
          </form>
        )}
      </Carte>

      <Carte eyebrow="Réputation" titre="Avis clients">
        <p className="mb-4 text-sm text-muted-foreground">
          Vous pouvez répondre publiquement à un avis, mais pas le supprimer. Un avis abusif peut être signalé à
          la modération.
        </p>
        <div className="space-y-4">
          {props.avis.map((a) => (
            <article key={a.auteur} className="rounded-xl bg-background p-4 ring-1 ring-border">
              <div className="flex items-center justify-between">
                <p className="font-bold">{a.auteur}</p>
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`size-3.5 ${i < a.note ? "fill-star text-star" : "text-border"}`} />
                  ))}
                </span>
              </div>
              <p className="mt-2 text-sm">{a.texte}</p>
              {reponses[a.auteur] ? (
                <p className="mt-3 border-l-2 border-primary pl-3 text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">Votre réponse : </span>
                  {reponses[a.auteur]}
                </p>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    value={brouillons[a.auteur] ?? ""}
                    onChange={(e) => setBrouillons({ ...brouillons, [a.auteur]: e.target.value })}
                    placeholder="Répondre publiquement…"
                    aria-label={`Répondre à ${a.auteur}`}
                    className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    disabled={!brouillons[a.auteur]?.trim()}
                    onClick={() => setReponses({ ...reponses, [a.auteur]: brouillons[a.auteur].trim() })}
                    aria-label="Publier la réponse"
                    className="flex items-center justify-center rounded-xl bg-primary px-3 text-white disabled:opacity-40"
                  >
                    <MessageSquareReply className="size-4" />
                  </button>
                </div>
              )}
            </article>
          ))}
          {!props.avis.length && <p className="text-sm text-muted-foreground">Pas encore d’avis.</p>}
        </div>
      </Carte>

      <div className="sticky bottom-4 z-20">
        <button
          type="button"
          onClick={sauver}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground shadow-lg"
        >
          {enregistre ? (
            <>
              <CheckCircle2 className="size-5" /> Modifications enregistrées
            </>
          ) : (
            <>
              <BellRing className="size-5" /> Enregistrer mon profil
            </>
          )}
        </button>
      </div>
    </div>
  );
}
