-- Messagerie Artopif : conversations et messages, prêts pour la production.
-- Appliquer avec : supabase db push  (ou coller dans le SQL Editor du projet Supabase).
--
-- Principe : un client et un artisan échangent dans une conversation. Chaque partie ne voit
-- que ses conversations (RLS). À chaque message inséré, un trigger appelle l'Edge Function
-- `notifier-message`, qui envoie l'alerte WhatsApp/SMS au destinataire.

create extension if not exists pg_net with schema extensions;

-- ——— Profils (le minimum pour notifier : nom + numéros) ———
-- Rempli à l'inscription. `telephones` : [{ "numero": "+242…", "whatsapp": true }, …] (1 à 3).
create table if not exists public.profils (
  id          uuid primary key references auth.users (id) on delete cascade,
  nom         text not null,
  telephones  jsonb not null default '[]'::jsonb
);

alter table public.profils enable row level security;

-- Chacun lit/écrit son propre profil ; un participant lit le profil de son interlocuteur.
create policy "mon profil" on public.profils
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "profil de mon interlocuteur" on public.profils
  for select using (
    exists (
      select 1 from public.conversations c
      where (c.client_id = auth.uid() and c.artisan_id = profils.id)
         or (c.artisan_id = auth.uid() and c.client_id = profils.id)
    )
  );

-- ——— Conversations ———
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references auth.users (id) on delete cascade,
  artisan_id  uuid not null references auth.users (id) on delete cascade,
  cree_le     timestamptz not null default now(),
  -- une seule conversation par couple client/artisan
  unique (client_id, artisan_id)
);

alter table public.conversations enable row level security;

-- Le client comme l'artisan voient (et créent) leurs conversations.
create policy "ses conversations" on public.conversations
  for all
  using  (auth.uid() = client_id or auth.uid() = artisan_id)
  with check (auth.uid() = client_id or auth.uid() = artisan_id);

-- ——— Messages ———
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  expediteur_id    uuid not null references auth.users (id) on delete cascade,
  -- côté de l'expéditeur dans la conversation
  de               text not null check (de in ('client', 'artisan')),
  texte            text not null check (char_length(texte) between 1 and 1000),
  envoye_le        timestamptz not null default now(),
  lu_le            timestamptz
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, envoye_le);

alter table public.messages enable row level security;

-- On ne lit/écrit que les messages d'une conversation à laquelle on participe.
create policy "messages de mes conversations" on public.messages
  for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.client_id or auth.uid() = c.artisan_id)
    )
  );

create policy "écrire dans mes conversations" on public.messages
  for insert
  with check (
    auth.uid() = expediteur_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.client_id or auth.uid() = c.artisan_id)
    )
  );

-- Marquer comme lu (mettre à jour lu_le) par le destinataire.
create policy "marquer lu" on public.messages
  for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.client_id or auth.uid() = c.artisan_id)
    )
  );

-- ——— Notification à chaque nouveau message ———
-- Le trigger appelle l'Edge Function `notifier-message` (envoi WhatsApp/SMS côté serveur).
-- Renseigner d'abord, dans Supabase → Settings → Vault, les secrets :
--   app.settings.functions_url  = https://<project-ref>.functions.supabase.co
--   app.settings.service_role_key = <clé service_role>  (ne jamais exposer côté client)
create or replace function public.notifier_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  url   text := current_setting('app.settings.functions_url', true);
  clef  text := current_setting('app.settings.service_role_key', true);
begin
  if url is null or clef is null then
    return new;  -- notifications non configurées : on n'empêche pas l'envoi du message
  end if;
  perform net.http_post(
    url      := url || '/notifier-message',
    headers  := jsonb_build_object(
                  'Content-Type', 'application/json',
                  'Authorization', 'Bearer ' || clef
                ),
    body     := jsonb_build_object('message_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.notifier_message();
