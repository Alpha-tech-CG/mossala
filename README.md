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

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · lucide-react. Backend prévu : Firebase.

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
| `src/lib/quota.ts` | Compteur de messages (maquette navigateur, à déplacer côté Firebase) |
| `src/components/Hero.tsx` | Hero de l'accueil et mur de photos |

## À brancher (Firebase)

- Comptes clients/artisans par téléphone (OTP).
- Messages, notifications WhatsApp et SMS aux artisans.
- Quota de messages et paiement Mobile Money (MTN MoMo, Airtel Money) côté serveur.
- Back-office : métiers, propositions de métiers, modération des avis.
