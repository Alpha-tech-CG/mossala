# Messagerie Artopif — branchement WhatsApp / SMS

Ce dossier contient tout le nécessaire pour que les messages voyagent entre deux téléphones
et pour que le destinataire soit prévenu par **WhatsApp** et **SMS**. Rien n'est actif tant
que le projet Supabase et le fournisseur d'envoi ne sont pas créés (ce sont des comptes
payants, à ouvrir par le client). Le code de l'application est déjà prêt : il appelle une
seule fonction, `notifierNouveauMessage` (`src/lib/backend/notifications.ts`).

## Ce qu'il y a ici

- `migrations/0001_messages.sql` — tables `profils`, `conversations`, `messages`, leurs règles
  d'accès (RLS), et le déclencheur qui notifie à chaque message.
- `functions/notifier-message/` — la fonction serveur qui envoie l'alerte WhatsApp/SMS.

## Mise en route (une fois pour toutes)

1. **Créer le projet Supabase** (~10 $/mois) et récupérer : l'URL du projet, la clé
   `anon` (publique) et la clé `service_role` (secrète).
2. **Ouvrir un compte chez un fournisseur d'envoi** qui couvre le Congo :
   - **Africa's Talking** (recommandé, SMS + WhatsApp) → `AT_USERNAME`, `AT_API_KEY`,
     un numéro WhatsApp validé par Meta (`AT_WHATSAPP_FROM`), un nom d'expéditeur SMS
     (`AT_SENDER_ID`, facultatif) ;
   - ou **Twilio** (variante commentée en bas de la fonction).
3. **Appliquer le schéma** : `supabase db push` (ou coller le SQL dans le SQL Editor).
4. **Renseigner les secrets du déclencheur** (Supabase → Settings → Vault) :
   - `app.settings.functions_url` = `https://<project-ref>.functions.supabase.co`
   - `app.settings.service_role_key` = la clé `service_role`.
5. **Déployer la fonction** et ses secrets :
   ```bash
   supabase functions deploy notifier-message
   supabase secrets set AT_USERNAME=... AT_API_KEY=... AT_WHATSAPP_FROM=+242... AT_SENDER_ID=ARTOPIF
   ```
6. **Côté application**, ajouter l'URL et la clé publique dans `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   puis écrire `src/lib/backend/supabase.ts` (client `@supabase/supabase-js`) et faire
   `notifierNouveauMessage` écrire le message dans la table `messages`. Le reste de
   l'application ne change pas : c'est le seul point de branchement.

## Pourquoi l'envoi part du serveur

On n'appelle jamais Africa's Talking (ou Twilio) depuis le navigateur : la clé secrète
serait visible par tout le monde. Le message est écrit dans Supabase, un déclencheur appelle
la fonction `notifier-message`, et c'est elle, côté serveur, qui contacte le fournisseur.
