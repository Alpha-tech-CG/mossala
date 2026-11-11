# Mossala — artisans et quincaillerie à Brazzaville

Plateforme de mise en relation entre les habitants de Brazzaville et des artisans vérifiés
(141 métiers en 11 secteurs), avec un annuaire de quincailleries partenaires à prix affichés.

## Fonctionnement

- **Contactez** : appel direct ou WhatsApp si l'artisan a rendu son numéro public ;
  sinon message sur la plateforme, l'artisan est prévenu par WhatsApp et SMS.
- **Quota client** : 5 messages gratuits par mois, puis accès illimité à 500 FCFA pour 30 jours.
- **Quincaillerie** : catalogue à prix fixe, réservation avec code de retrait, paiement au retrait.
- Aucune commission sur les prestations des artisans.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · lucide-react.

**Backend** : connexion par **code SMS avec Firebase** (projet `mossala-6f297`) et données dans
**Supabase** (comptes, profils pros, réalisations, messagerie, devis). Sans clés Supabase dans
`.env.local`, le site tourne en **maquette** (données dans le navigateur). Mode d'emploi complet :
[`supabase/README.md`](supabase/README.md). Les pages passent par `src/lib/backend/`.

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Où modifier quoi

| Fichier | Contenu |
|---|---|
| `src/lib/metiers.ts` | Catalogue des secteurs et métiers (ajouter un métier ici) |
| `src/lib/metierIcons.ts` | Icône de chaque métier |
| `src/lib/data.ts` | Données de démonstration (artisans, boutiques, produits) et règles du quota |
| `src/lib/devis.ts` | Demandes de devis en langage naturel, devis en rubriques/lignes, calculs (maquette navigateur) |
| `src/components/devis/` | Éditeur de devis (artisan et boutique) et affichage imprimable du devis |
| `src/lib/realisations.ts` | Réalisations publiées par les artisans (onglet « Réalisations » du profil) |
| `supabase/` | Schéma de la base (migrations 0001 à 0003), règles d’accès, fonction d’alerte WhatsApp/SMS |
| `src/lib/backend/supabase.ts` | Client Supabase et interrupteur maquette / production (`SUPABASE_ACTIF`) |
| `src/lib/session.ts` · `src/lib/pro-connecte.ts` | Compte connecté par SMS, et pro dont on affiche l’espace |
| `src/lib/quota.ts` | Compteur de messages (maquette navigateur, à déplacer côté serveur) |
| `src/lib/backend/` | Accès au backend (Firebase en démo) |
| `firestore.rules` | Règles de sécurité de la démo — tests : `npm run test:rules` |
| `src/components/Hero.tsx` | Hero de l'accueil et mur de photos |

## À brancher

- Comptes clients/artisans par téléphone (OTP).
- Messages, notifications WhatsApp et SMS aux artisans.
- Quota de messages et paiement Mobile Money (MTN MoMo, Airtel Money) côté serveur.
- Back-office : métiers, propositions de métiers, modération des avis.
