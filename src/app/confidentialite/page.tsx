import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Artico",
  description: "Comment Artico collecte, utilise et protège vos données personnelles, et comment exercer vos droits.",
};

/**
 * Coordonnées du responsable de traitement.
 * ⚠️ À COMPLÉTER par le client avant la mise en production (affichées en surbrillance tant qu'elles sont vides).
 */
const RESPONSABLE = {
  raisonSociale: "",
  formeEtCapital: "",
  rccm: "",
  adresse: "",
  email: "",
  telephone: "",
};
const MISE_A_JOUR = "9 novembre 2026";

function Champ({ v, label }: { v: string; label: string }) {
  return v ? <>{v}</> : <mark className="rounded bg-accent/30 px-1 text-foreground">[{label} à compléter]</mark>;
}
const email = RESPONSABLE.email;
const Email = () => (email ? <a href={`mailto:${email}`} className="font-semibold text-primary underline">{email}</a> : <Champ v="" label="adresse e-mail de contact" />);

const sections = [
  ["responsable", "Qui est responsable de vos données ?"],
  ["donnees", "Quelles données collectons-nous ?"],
  ["finalites", "Pourquoi et sur quelle base légale ?"],
  ["destinataires", "Qui peut voir vos données ?"],
  ["transferts", "Transferts hors de l’Union européenne"],
  ["conservation", "Combien de temps les gardons-nous ?"],
  ["traceurs", "Cookies et stockage local"],
  ["securite", "Sécurité"],
  ["droits", "Vos droits"],
  ["mineurs", "Mineurs"],
  ["modifications", "Modifications"],
] as const;

function Section({ id, n, children }: { id: string; n: number; children: ReactNode }) {
  const titre = sections.find((s) => s[0] === id)![1];
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="flex items-baseline gap-3 text-xl font-bold md:text-2xl">
        <span className="font-serif text-accent-ink">{String(n).padStart(2, "0")}</span>
        {titre}
      </h2>
      <div className="mt-4 space-y-3 leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <table className="w-full min-w-[560px] border-separate border-spacing-0 overflow-hidden rounded-2xl text-left text-sm ring-1 ring-border">
        <thead className="bg-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="border-t border-border px-4 py-3 align-top">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Confidentialite() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-8 pb-20 md:pt-14">
      <header className="max-w-3xl">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase md:text-[11px]">Vos données</p>
        <h1 className="mt-2 font-serif text-3xl md:text-5xl">Politique de confidentialité</h1>
        <p className="mt-4 text-muted-foreground">
          Artico met en relation des clients avec des artisans et des quincailleries de Brazzaville. Cette page
          explique simplement quelles données nous traitons, pourquoi, et comment vous gardez la main dessus,
          conformément au Règlement général sur la protection des données (RGPD, règlement UE 2016/679) et à la
          loi congolaise n° 29-2019 du 10 octobre 2019 portant protection des données à caractère personnel.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">Dernière mise à jour : {MISE_A_JOUR}</p>
      </header>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 md:grid-cols-[220px_minmax(0,1fr)] md:gap-14">
        <nav aria-label="Sommaire" className="md:sticky md:top-24 md:self-start">
          <ol className="space-y-2 rounded-2xl bg-card p-5 text-sm ring-1 ring-border">
            {sections.map(([id, t], i) => (
              <li key={id}>
                <a href={`#${id}`} className="flex gap-2 text-muted-foreground hover:text-foreground">
                  <span className="font-semibold text-accent-ink">{i + 1}.</span>
                  {t}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl space-y-12">
          <div className="rounded-2xl bg-secondary p-5 text-sm text-primary">
            <p className="font-bold">L’essentiel</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Nous ne vendons pas vos données. Les publicités sont signalées et ne sont pas ciblées à partir de vos données.</li>
              <li>Un artisan qui garde son numéro privé ne le voit jamais affiché : vous le contactez par message.</li>
              <li>Pas de cookie publicitaire ni de mesure d’audience : aucun bandeau de consentement n’est donc nécessaire.</li>
              <li>Vous pouvez à tout moment consulter, corriger ou supprimer vos données en nous écrivant.</li>
            </ul>
          </div>

          <Section id="responsable" n={1}>
            <p>Le responsable du traitement de vos données est :</p>
            <address className="rounded-2xl bg-card p-5 not-italic ring-1 ring-border">
              <strong><Champ v={RESPONSABLE.raisonSociale} label="raison sociale" /></strong> (Artico)
              <br />
              <Champ v={RESPONSABLE.formeEtCapital} label="forme juridique et capital" /> · RCCM{" "}
              <Champ v={RESPONSABLE.rccm} label="numéro RCCM" />
              <br />
              <Champ v={RESPONSABLE.adresse} label="adresse du siège" />, Brazzaville, République du Congo
              <br />
              Contact données personnelles : <Email />
              {RESPONSABLE.telephone && <> · {RESPONSABLE.telephone}</>}
            </address>
            <p>
              Pour toute question sur vos données ou pour exercer vos droits, écrivez à cette adresse. Nous vous
              répondons dans un délai d’un mois.
            </p>
          </Section>

          <Section id="donnees" n={2}>
            <p>Nous collectons uniquement ce qui est utile au service :</p>
            <Table
              head={["Vous êtes", "Données", "D’où viennent-elles ?"]}
              rows={[
                [
                  "Client",
                  "Prénom et numéro de téléphone (compte), profils d’artisans consultés dans le mois, favoris, statut Premium et historique de paiement (opérateur, montant, date, référence de transaction), contenu de vos messages, numéro laissé pour être rappelé, avis, notes et signalements.",
                  "Vous, lorsque vous créez votre compte, consultez un profil, contactez un artisan, payez le Premium ou notez une prestation ; votre opérateur Mobile Money pour la confirmation du paiement.",
                ],
                [
                  "Artisan ou boutique",
                  "Nom, numéro de téléphone (vérifié par SMS), métier, zones d’intervention ou adresse de la boutique, photos de réalisations, choix d’afficher ou non votre numéro, préférences d’alerte (WhatsApp, SMS), disponibilité, prix et stocks, réponses aux avis. Pour obtenir les badges de confiance : pièce d’identité et références.",
                  "Vous, lors de l’inscription et dans votre espace pro.",
                ],
                [
                  "Tout visiteur",
                  "Données techniques : adresse IP, type de navigateur, pages consultées et horodatage (journaux du serveur), signaux anti-robot reCAPTCHA lors de l’envoi d’un code SMS.",
                  "Votre navigateur, automatiquement.",
                ],
              ]}
            />
            <p>
              Nous ne demandons aucune donnée dite « sensible » (santé, religion, opinions…). Merci de ne pas en
              inscrire dans vos messages.
            </p>
          </Section>

          <Section id="finalites" n={3}>
            <Table
              head={["Pourquoi", "Base légale (RGPD art. 6)"]}
              rows={[
                ["Créer et gérer votre compte professionnel, publier votre fiche", "Exécution du contrat (conditions d’utilisation)"],
                ["Créer votre compte client, compter les profils consultés et gérer le Premium", "Exécution du contrat (conditions d’utilisation)"],
                ["Encaisser le Premium par Mobile Money et conserver les justificatifs", "Exécution du contrat et obligation légale (comptabilité)"],
                ["Traiter les signalements et modérer les avis", "Intérêt légitime : fiabilité des avis et sécurité des utilisateurs"],
                ["Rappeler les annonceurs qui le demandent", "Mesures précontractuelles à votre demande"],
                ["Transmettre votre message à l’artisan et le prévenir par WhatsApp et SMS", "Exécution du contrat"],
                ["Afficher publiquement le numéro d’un artisan", "Consentement de l’artisan, retirable à tout moment dans son profil"],
                ["Vérifier votre numéro par code SMS et bloquer les robots (reCAPTCHA)", "Intérêt légitime : sécurité du service et lutte contre la fraude"],
                ["Vérifier l’identité et les références des professionnels (badges)", "Consentement du professionnel, qui choisit de demander un badge"],
                ["Publier les avis et permettre d’y répondre", "Intérêt légitime : informer les clients sur la qualité des prestations"],
                ["Assurer le bon fonctionnement technique et la sécurité du site", "Intérêt légitime"],
              ]}
            />
            <p>
              Aucune décision automatisée produisant des effets juridiques à votre égard n’est prise. Le classement
              des résultats de recherche dépend de critères affichés (métier, quartier, disponibilité, note) ; les
              fiches « Sponsorisé » sont signalées comme telles.
            </p>
          </Section>

          <Section id="destinataires" n={4}>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>L’artisan que vous contactez</strong> reçoit votre message et le numéro que vous laissez pour
                être rappelé.
              </li>
              <li>
                <strong>Le public</strong> voit la fiche des professionnels (nom, métier, quartier, réalisations, avis),
                ainsi que leur numéro uniquement s’ils ont choisi de l’afficher.
              </li>
              <li>
                <strong>Nos sous-traitants techniques</strong>, liés par contrat et tenus à la confidentialité :
                Vercel Inc. (hébergement du site), Google (Firebase : connexion par téléphone et base de données
                hébergée en Belgique ; reCAPTCHA : protection anti-robot), le prestataire d’envoi des alertes
                WhatsApp et SMS, et votre opérateur Mobile Money (MTN MoMo ou Airtel Money) pour le paiement du
                Premium.
              </li>
              <li>Les autorités, uniquement sur demande légale.</li>
            </ul>
            <p>
              La version de base est gratuite. Le Premium se paie par Mobile Money : nous ne voyons ni ne
              conservons votre code secret, seulement la confirmation de l’opérateur. Les publicités affichées sur
              Artico sont des emplacements signalés, jamais ciblées à partir de vos données personnelles.
            </p>
            <p>Vos données ne sont jamais vendues ni louées.</p>
          </Section>

          <Section id="transferts" n={5}>
            <p>
              Certains prestataires (Vercel, Google) sont établis aux États-Unis. Lorsque des données quittent
              l’Union européenne, ces transferts sont encadrés par le Data Privacy Framework UE–États-Unis, auquel
              ces sociétés adhèrent, ou à défaut par les clauses contractuelles types de la Commission européenne.
              Vous pouvez en obtenir une copie en nous écrivant.
            </p>
          </Section>

          <Section id="conservation" n={6}>
            <Table
              head={["Donnée", "Durée"]}
              rows={[
                ["Compte et fiche professionnelle", "Tant que le compte est actif ; supprimés 3 ans après la dernière connexion, ou sur demande"],
                ["Pièce d’identité fournie pour le badge", "Supprimée dès la vérification faite (30 jours maximum) ; seul le résultat est conservé"],
                ["Messages entre client et artisan", "12 mois après l’envoi"],
                ["Numéro laissé pour être rappelé", "Avec le message, 12 mois"],
                ["Compte client, favoris et profils consultés", "Tant que le compte est actif ; supprimés 3 ans après la dernière connexion, ou sur demande. Le décompte des profils repart à zéro chaque mois"],
                ["Justificatifs de paiement Premium", "10 ans (obligation comptable)"],
                ["Signalements", "12 mois après leur traitement"],
                ["Avis publiés", "Tant que la fiche de l’artisan existe, sauf suppression à votre demande"],
                ["Journaux techniques du serveur", "12 mois maximum"],
              ]}
            />
          </Section>

          <Section id="traceurs" n={7}>
            <p>Artico n’utilise que des traceurs strictement nécessaires au service, exemptés de consentement :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Session de connexion</strong> des clients et des professionnels, pour rester connecté et
                retenir les profils consultés, les favoris et le statut Premium.
              </li>
              <li>
                <strong>reCAPTCHA</strong> (Google), chargé uniquement au moment de l’envoi d’un code SMS, pour bloquer
                les robots.
              </li>
            </ul>
            <p>
              Nous n’utilisons ni cookie publicitaire, ni outil de mesure d’audience, ni pixel de réseau social. Si
              cela change, nous vous demanderons d’abord votre accord.
            </p>
          </Section>

          <Section id="securite" n={8}>
            <p>
              Le site est chiffré (HTTPS). Les numéros privés des artisans sont stockés séparément des fiches
              publiques et ne sont lisibles que par leur propriétaire ; des règles d’accès empêchent toute autre
              lecture. L’accès aux données par notre équipe est limité aux personnes qui en ont besoin. En cas de
              violation de données présentant un risque pour vous, nous prévenons l’autorité compétente et, si
              nécessaire, les personnes concernées.
            </p>
          </Section>

          <Section id="droits" n={9}>
            <p>Vous disposez des droits suivants sur vos données :</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                ["Accès", "obtenir une copie de vos données"],
                ["Rectification", "corriger des données inexactes"],
                ["Effacement", "faire supprimer vos données"],
                ["Limitation", "geler temporairement un traitement"],
                ["Opposition", "refuser un traitement fondé sur l’intérêt légitime"],
                ["Portabilité", "récupérer vos données dans un format lisible"],
                ["Retrait du consentement", "à tout moment, sans effet sur le passé"],
                ["Directives", "indiquer ce que deviennent vos données après votre décès"],
              ].map(([t, d]) => (
                <li key={t} className="rounded-2xl bg-card p-4 ring-1 ring-border">
                  <p className="font-bold">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ul>
            <p>
              Pour les exercer, écrivez à <Email /> en précisant votre demande et le numéro de téléphone lié à votre
              compte. Nous pourrons vous demander de confirmer votre identité. Réponse sous un mois, gratuitement.
            </p>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l’autorité de protection des
              données compétente : l’autorité congolaise instituée par la loi n° 29-2019, ou, si vous résidez dans
              l’Union européenne, l’autorité de votre pays (en France, la{" "}
              <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
                CNIL
              </a>
              ).
            </p>
          </Section>

          <Section id="mineurs" n={10}>
            <p>
              L’inscription comme professionnel est réservée aux personnes majeures. Le service n’est pas destiné aux
              enfants de moins de 16 ans ; si vous pensez qu’un mineur nous a transmis des données, contactez-nous
              pour que nous les supprimions.
            </p>
          </Section>

          <Section id="modifications" n={11}>
            <p>
              Nous pouvons mettre à jour cette politique, par exemple lors de l’ajout d’un nouveau service. La date
              de mise à jour figure en haut de la page ; en cas de changement important, nous vous en informerons
              sur le site ou par SMS.
            </p>
            <p>
              <Link href="/" className="font-semibold text-primary underline">
                Retour à l’accueil
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
