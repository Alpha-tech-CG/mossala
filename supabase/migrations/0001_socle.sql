-- Socle Artopif : comptes clients, profils professionnels, réalisations.
-- Appliquer avec : supabase db push  (ou coller dans le SQL Editor, dans l'ordre 0001 → 0003).
--
-- IDENTITÉ : la connexion se fait par code SMS avec Firebase Authentication (projet
-- mossala-6f297). Supabase accepte le jeton Firebase (Authentication → Third-party auth →
-- Firebase). L'identifiant d'un utilisateur est donc l'uid Firebase, un TEXTE (pas un uuid) :
-- on n'utilise jamais auth.uid() (qui convertit en uuid), mais public.moi() ci-dessous.
-- Le numéro vérifié par SMS est dans le jeton : auth.jwt() ->> 'phone_number'.

-- Utilisateur connecté (uid Firebase) ou null.
create or replace function public.moi() returns text
language sql stable
as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

-- Numéro vérifié par le code SMS (format international, ex. +242066123456).
create or replace function public.mon_telephone() returns text
language sql stable
as $$ select nullif(auth.jwt() ->> 'phone_number', '') $$;

-- L'équipe Artopif (clé service_role, back-office) peut tout changer ; les utilisateurs non.
create or replace function public.est_equipe() returns boolean
language sql stable
as $$ select coalesce(auth.jwt() ->> 'role', '') = 'service_role' $$;

-- ——— Comptes clients ———
-- Un compte par numéro vérifié. `telephones` : [{ "numero": "+242…", "whatsapp": true }] (1 à 3).
create table if not exists public.comptes (
  id          text primary key,
  prenom      text not null check (char_length(prenom) between 1 and 60),
  nom         text,
  telephone   text not null,
  telephones  jsonb not null default '[]'::jsonb,
  adresse     text,
  ville       text,
  quartier    text,
  email       text,
  cree_le     timestamptz not null default now()
);

alter table public.comptes enable row level security;

create policy "mon compte : lire" on public.comptes
  for select using (id = public.moi());
create policy "mon compte : créer" on public.comptes
  for insert with check (id = public.moi() and telephone = public.mon_telephone());
create policy "mon compte : modifier" on public.comptes
  for update using (id = public.moi()) with check (id = public.moi() and telephone = public.mon_telephone());
-- (les interlocuteurs d'une conversation ou d'une demande de devis lisent aussi le compte :
--  politiques ajoutées dans 0002 et 0003, une fois ces tables créées)

-- ——— Profils professionnels (artisans et boutiques) : publics une fois vérifiés ———
create table if not exists public.pros (
  id                text primary key,
  type              text not null check (type in ('artisan', 'boutique')),
  nom               text not null check (char_length(nom) between 2 and 80),
  metier            text,
  ville             text not null,
  quartier          text not null,
  zones             text[] not null default '{}',
  adresse           text,
  description       text not null default '',
  numero_public     boolean not null default false,
  telephone_public  text,
  image             text,
  -- la vérification (identité, références) est faite par l'équipe Artopif
  statut            text not null default 'en_verification'
                    check (statut in ('en_verification', 'verifie', 'suspendu')),
  cree_le           timestamptz not null default now(),
  -- le numéro n'est affiché que si le pro l'a choisi
  check (numero_public = (telephone_public is not null))
);

create index if not exists pros_recherche on public.pros (statut, type, ville, metier);

alter table public.pros enable row level security;

create policy "pros vérifiés publics" on public.pros
  for select using (statut = 'verifie' or id = public.moi());
create policy "créer mon profil pro" on public.pros
  for insert with check (
    id = public.moi()
    and statut = 'en_verification'
    and (telephone_public is null or telephone_public = public.mon_telephone())
  );
create policy "modifier mon profil pro" on public.pros
  for update using (id = public.moi())
  with check (id = public.moi() and (telephone_public is null or telephone_public = public.mon_telephone()));

-- Coordonnées privées du pro (numéros pour les alertes, responsable) : lui seul les lit.
create table if not exists public.pros_prive (
  id               text primary key references public.pros (id) on delete cascade,
  telephone        text not null,
  telephones       jsonb not null default '[]'::jsonb,
  responsable      jsonb not null default '{}'::jsonb,
  alerte_whatsapp  boolean not null default true,
  alerte_sms       boolean not null default true
);

alter table public.pros_prive enable row level security;

create policy "mes coordonnées pro" on public.pros_prive
  for all using (id = public.moi())
  with check (id = public.moi() and telephone = public.mon_telephone());

-- ——— Réalisations (onglet « Réalisations » du profil public) ———
create table if not exists public.realisations (
  id           uuid primary key default gen_random_uuid(),
  artisan_id   text not null references public.pros (id) on delete cascade,
  titre        text not null check (char_length(titre) between 2 and 120),
  type         text not null default '',
  quartier     text not null default '',
  description  text not null default '',
  materiaux    text not null default '',
  duree        text not null default '',
  date         text,
  -- URL publiques (bucket « realisations »), la première sert de couverture
  photos       text[] not null check (cardinality(photos) between 1 and 10),
  verifiee     boolean not null default false,
  cree_le      timestamptz not null default now()
);

create index if not exists realisations_artisan on public.realisations (artisan_id, cree_le desc);

alter table public.realisations enable row level security;

create policy "réalisations publiques" on public.realisations
  for select using (
    artisan_id = public.moi()
    or exists (select 1 from public.pros p where p.id = artisan_id and p.statut = 'verifie')
  );
create policy "l'artisan gère ses réalisations" on public.realisations
  for all using (artisan_id = public.moi()) with check (artisan_id = public.moi());

-- Seule l'équipe change le statut d'un pro ou marque une réalisation « vérifiée ».
create or replace function public.proteger_verification() returns trigger
language plpgsql as $$
begin
  if public.est_equipe() then return new; end if;
  if tg_table_name = 'pros' and new.statut is distinct from coalesce(old.statut, 'en_verification') then
    raise exception 'seule l''équipe Artopif change le statut d''un professionnel';
  end if;
  if tg_table_name = 'realisations' and new.verifiee and (tg_op = 'INSERT' or not old.verifiee) then
    raise exception 'seule l''équipe Artopif vérifie une réalisation';
  end if;
  return new;
end $$;

drop trigger if exists proteger_pros on public.pros;
create trigger proteger_pros before insert or update on public.pros
  for each row execute function public.proteger_verification();
drop trigger if exists proteger_realisations on public.realisations;
create trigger proteger_realisations before insert or update on public.realisations
  for each row execute function public.proteger_verification();

-- ——— Photos des réalisations : lecture publique, chacun écrit dans son dossier <uid>/… ———
insert into storage.buckets (id, name, public) values ('realisations', 'realisations', true)
  on conflict (id) do nothing;

create policy "photos : l'artisan écrit dans son dossier" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'realisations' and (storage.foldername(name))[1] = public.moi());
create policy "photos : l'artisan retire les siennes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'realisations' and (storage.foldername(name))[1] = public.moi());
