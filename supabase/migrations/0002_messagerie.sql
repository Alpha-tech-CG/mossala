-- Messagerie client ↔ artisan, et alertes WhatsApp/SMS.
-- Prérequis : 0001_socle.sql.
--
-- Chaque nouveau message (et, dans 0003, chaque demande de devis ou devis envoyé) appelle
-- l'Edge Function `notifier` qui prévient le destinataire par WhatsApp puis SMS.
-- Secrets à créer dans Supabase → Project Settings → Vault :
--   functions_url     = https://<project-ref>.functions.supabase.co
--   service_role_key  = <clé service_role>   (ne jamais l'exposer côté navigateur)
-- Tant qu'ils n'existent pas, les messages passent mais aucune alerte n'est envoyée.

create extension if not exists pg_net with schema extensions;

-- ——— Conversations : une par couple client / artisan ———
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  client_id   text not null references public.comptes (id) on delete cascade,
  pro_id      text not null references public.pros (id) on delete cascade,
  cree_le     timestamptz not null default now(),
  -- date du dernier message lu par chaque partie
  lu_client   timestamptz not null default 'epoch',
  lu_pro      timestamptz not null default 'epoch',
  unique (client_id, pro_id)
);

alter table public.conversations enable row level security;

create policy "mes conversations" on public.conversations
  for select using (public.moi() in (client_id, pro_id));
create policy "le client ouvre une conversation" on public.conversations
  for insert with check (client_id = public.moi());
create policy "marquer comme lu" on public.conversations
  for update using (public.moi() in (client_id, pro_id))
  with check (public.moi() in (client_id, pro_id));

-- ——— Messages ———
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  de               text not null check (de in ('client', 'pro')),
  texte            text not null check (char_length(texte) between 1 and 1000),
  envoye_le        timestamptz not null default now()
);

create index if not exists messages_conversation on public.messages (conversation_id, envoye_le);

alter table public.messages enable row level security;

create policy "messages de mes conversations" on public.messages
  for select using (
    exists (select 1 from public.conversations c
            where c.id = conversation_id and public.moi() in (c.client_id, c.pro_id))
  );
-- On écrit seulement de son propre côté de la conversation.
create policy "écrire dans mes conversations" on public.messages
  for insert with check (
    exists (select 1 from public.conversations c
            where c.id = conversation_id
              and ((de = 'client' and c.client_id = public.moi())
                or (de = 'pro' and c.pro_id = public.moi())))
  );

-- Le pro lit le prénom et le numéro du client avec qui il échange (pour le rappeler).
create policy "compte de mes interlocuteurs (messagerie)" on public.comptes
  for select using (
    exists (select 1 from public.conversations c where c.client_id = comptes.id and c.pro_id = public.moi())
  );

-- ——— Temps réel : les nouveaux messages arrivent sans recharger ———
alter publication supabase_realtime add table public.messages, public.conversations;

-- ——— Alertes WhatsApp/SMS ———
-- Appelle l'Edge Function `notifier` avec { "type": "...", "id": "..." }.
create or replace function public.appeler_notifier(type_alerte text, cible uuid) returns void
language plpgsql security definer set search_path = public, extensions, vault
as $$
declare
  url  text;
  clef text;
begin
  select decrypted_secret into url from vault.decrypted_secrets where name = 'functions_url';
  select decrypted_secret into clef from vault.decrypted_secrets where name = 'service_role_key';
  if url is null or clef is null then
    return; -- alertes non configurées : on n'empêche pas l'écriture
  end if;
  perform net.http_post(
    url     := url || '/notifier',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || clef),
    body    := jsonb_build_object('type', type_alerte, 'id', cible)
  );
end $$;

create or replace function public.notifier_message() returns trigger
language plpgsql security definer set search_path = public
as $$ begin perform public.appeler_notifier('message', new.id); return new; end $$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert after insert on public.messages
  for each row execute function public.notifier_message();
