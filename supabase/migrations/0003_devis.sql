-- Devis : le client décrit son besoin en langage naturel à un artisan ou une boutique ;
-- le pro répond par un devis en rubriques et lignes (désignation, quantité, unité, prix
-- unitaire, fourchette de prix facultative). Prérequis : 0001 et 0002.

create table if not exists public.demandes_devis (
  id              uuid primary key default gen_random_uuid(),
  client_id       text not null references public.comptes (id) on delete cascade,
  pro_id          text not null references public.pros (id) on delete cascade,
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

create policy "voir mes demandes" on public.demandes_devis
  for select using (public.moi() in (client_id, pro_id));
create policy "le client demande un devis" on public.demandes_devis
  for insert with check (client_id = public.moi() and statut = 'nouvelle');
create policy "faire avancer la demande" on public.demandes_devis
  for update using (public.moi() in (client_id, pro_id)) with check (public.moi() in (client_id, pro_id));

-- Transitions autorisées : le pro chiffre ou décline, le client répond à un devis envoyé.
create or replace function public.controler_statut_devis() returns trigger
language plpgsql as $$
begin
  if public.est_equipe() then return new; end if;
  if new.client_id <> old.client_id or new.pro_id <> old.pro_id or new.texte <> old.texte then
    raise exception 'demande non modifiable';
  end if;
  if new.statut = old.statut then return new; end if;
  if public.moi() = old.pro_id then
    if new.statut not in ('brouillon', 'envoyee', 'declinee') or old.statut in ('acceptee', 'refusee') then
      raise exception 'statut interdit au professionnel';
    end if;
  elsif public.moi() = old.client_id then
    if not (old.statut = 'envoyee' and new.statut in ('acceptee', 'refusee')) then
      raise exception 'le client ne peut que répondre à un devis envoyé';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists controler_statut_devis on public.demandes_devis;
create trigger controler_statut_devis before update on public.demandes_devis
  for each row execute function public.controler_statut_devis();

-- ——— Le devis chiffré (un par demande, remplacé à chaque renvoi) ———
create table if not exists public.devis (
  demande_id        uuid primary key references public.demandes_devis (id) on delete cascade,
  -- [{ "id", "titre", "lignes": [{ "id", "designation", "quantite", "unite",
  --    "prixUnitaire", "prixMin", "prixMax" }] }]  (format de src/lib/devis.ts)
  rubriques         jsonb not null default '[]'::jsonb,
  delai             text not null default '',
  validite          text not null default '30 jours',
  materiaux_inclus  boolean not null default true,
  paiement          text not null default '',
  note              text not null default '',
  envoye_le         timestamptz,
  modifie_le        timestamptz not null default now()
);

alter table public.devis enable row level security;

create policy "le pro chiffre ses demandes" on public.devis
  for all
  using (exists (select 1 from public.demandes_devis d where d.id = demande_id and d.pro_id = public.moi()))
  with check (exists (select 1 from public.demandes_devis d where d.id = demande_id and d.pro_id = public.moi()));
-- Le client ne voit le devis qu'une fois envoyé (pas les brouillons).
create policy "le client lit le devis envoyé" on public.devis
  for select using (
    envoye_le is not null
    and exists (select 1 from public.demandes_devis d where d.id = demande_id and d.client_id = public.moi())
  );

create policy "compte de mes interlocuteurs (devis)" on public.comptes
  for select using (
    exists (select 1 from public.demandes_devis d where d.client_id = comptes.id and d.pro_id = public.moi())
  );

alter publication supabase_realtime add table public.demandes_devis, public.devis;

-- Alertes : nouvelle demande → le pro ; devis envoyé → le client.
create or replace function public.notifier_devis() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_table_name = 'demandes_devis' then
    perform public.appeler_notifier('demande', new.id);
  elsif new.envoye_le is not null and (tg_op = 'INSERT' or new.envoye_le is distinct from old.envoye_le) then
    perform public.appeler_notifier('devis', new.demande_id);
  end if;
  return new;
end $$;

drop trigger if exists on_demande_insert on public.demandes_devis;
create trigger on_demande_insert after insert on public.demandes_devis
  for each row execute function public.notifier_devis();
drop trigger if exists on_devis_envoye on public.devis;
create trigger on_devis_envoye after insert or update on public.devis
  for each row execute function public.notifier_devis();
