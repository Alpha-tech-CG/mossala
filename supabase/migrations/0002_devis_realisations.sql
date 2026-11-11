-- Devis et réalisations Artopif, prêts pour la production (la démo les garde dans le navigateur :
-- src/lib/devis.ts et src/lib/realisations.ts).
-- Appliquer avec : supabase db push  (ou coller dans le SQL Editor du projet Supabase).
--
-- Devis : le client décrit son besoin en langage naturel à un artisan ou à une boutique ;
-- le pro répond par un devis en rubriques (Fondations, Élévation…) et lignes
-- désignation / quantité / unité / prix unitaire, avec une fourchette de prix facultative.

-- ——— Demandes de devis ———
create table if not exists public.demandes_devis (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references auth.users (id) on delete cascade,
  -- artisan ou boutique (compte du professionnel)
  pro_id          uuid not null references auth.users (id) on delete cascade,
  pro_type        text not null check (pro_type in ('artisan', 'boutique')),
  texte           text not null check (char_length(texte) between 10 and 2000),
  quartier        text not null,
  date_souhaitee  date,
  budget          text,
  statut          text not null default 'nouvelle'
                  check (statut in ('nouvelle', 'brouillon', 'envoyee', 'acceptee', 'refusee', 'declinee')),
  motif_declin    text,
  cree_le         timestamptz not null default now()
);

create index if not exists demandes_devis_pro on public.demandes_devis (pro_id, cree_le desc);
create index if not exists demandes_devis_client on public.demandes_devis (client_id, cree_le desc);

alter table public.demandes_devis enable row level security;

-- Chaque partie voit ses demandes ; seul le client en crée (statut « nouvelle »).
create policy "voir ses demandes" on public.demandes_devis
  for select using (auth.uid() in (client_id, pro_id));

create policy "le client demande" on public.demandes_devis
  for insert with check (auth.uid() = client_id and statut = 'nouvelle');

-- Le pro fait avancer le statut (brouillon, envoyée, déclinée) ; le client accepte ou refuse.
-- Le contrôle fin des transitions est fait par le trigger ci-dessous.
create policy "faire avancer sa demande" on public.demandes_devis
  for update using (auth.uid() in (client_id, pro_id)) with check (auth.uid() in (client_id, pro_id));

create or replace function public.controler_statut_devis() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.client_id <> old.client_id or new.pro_id <> old.pro_id or new.texte <> old.texte then
    raise exception 'demande non modifiable';
  end if;
  if auth.uid() = old.pro_id then
    if new.statut not in ('brouillon', 'envoyee', 'declinee') or old.statut in ('acceptee', 'refusee') then
      raise exception 'statut interdit au professionnel';
    end if;
  elsif auth.uid() = old.client_id then
    if not (old.statut = 'envoyee' and new.statut in ('acceptee', 'refusee')) then
      raise exception 'le client ne peut que répondre à un devis envoyé';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists controler_statut_devis on public.demandes_devis;
create trigger controler_statut_devis before update on public.demandes_devis
  for each row execute function public.controler_statut_devis();

-- ——— Devis (un par demande, remplacé à chaque renvoi) ———
create table if not exists public.devis (
  demande_id        uuid primary key references public.demandes_devis (id) on delete cascade,
  delai             text not null default '',
  validite          text not null default '30 jours',
  materiaux_inclus  boolean not null default true,
  paiement          text not null default '',
  note              text not null default '',
  -- rubriques et lignes : [{ "titre": "Fondations", "lignes": [{ "designation", "quantite",
  --   "unite", "prix_unitaire", "prix_min", "prix_max" }] }]
  rubriques         jsonb not null default '[]'::jsonb,
  envoye_le         timestamptz,
  modifie_le        timestamptz not null default now()
);

alter table public.devis enable row level security;

-- Le pro écrit le devis de ses demandes ; le client ne le lit qu'une fois envoyé.
create policy "le pro chiffre" on public.devis
  for all
  using (exists (select 1 from public.demandes_devis d where d.id = demande_id and d.pro_id = auth.uid()))
  with check (exists (select 1 from public.demandes_devis d where d.id = demande_id and d.pro_id = auth.uid()));

create policy "le client lit le devis envoyé" on public.devis
  for select using (
    envoye_le is not null
    and exists (select 1 from public.demandes_devis d where d.id = demande_id and d.client_id = auth.uid())
  );

-- ——— Réalisations des artisans (onglet « Réalisations » du profil public) ———
create table if not exists public.realisations (
  id           uuid primary key default gen_random_uuid(),
  artisan_id   uuid not null references auth.users (id) on delete cascade,
  titre        text not null check (char_length(titre) between 2 and 120),
  type         text not null default '',
  quartier     text not null default '',
  description  text not null default '',
  materiaux    text not null default '',
  duree        text not null default '',
  -- chemins dans le bucket Storage « realisations », le premier sert de couverture
  photos       text[] not null check (cardinality(photos) between 1 and 10),
  -- seule l'équipe Artopif marque une réalisation comme vérifiée
  verifiee     boolean not null default false,
  cree_le      timestamptz not null default now()
);

create index if not exists realisations_artisan on public.realisations (artisan_id, cree_le desc);

alter table public.realisations enable row level security;

create policy "réalisations publiques" on public.realisations for select using (true);

create policy "l'artisan publie" on public.realisations
  for insert with check (auth.uid() = artisan_id and verifiee = false);

create policy "l'artisan modifie" on public.realisations
  for update using (auth.uid() = artisan_id)
  with check (auth.uid() = artisan_id and verifiee = (select r.verifiee from public.realisations r where r.id = id));

create policy "l'artisan retire" on public.realisations
  for delete using (auth.uid() = artisan_id);

-- Photos : bucket public en lecture, chaque artisan écrit dans son dossier (<uid>/…).
insert into storage.buckets (id, name, public) values ('realisations', 'realisations', true)
  on conflict (id) do nothing;

create policy "photos de ses réalisations" on storage.objects
  for all to authenticated
  using (bucket_id = 'realisations' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'realisations' and (storage.foldername(name))[1] = auth.uid()::text);
