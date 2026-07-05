alter table public.wishlists
  add column if not exists source_owner_id uuid,
  add column if not exists source_list_id text,
  add column if not exists source_username text;

create index if not exists wishlists_source_idx
  on public.wishlists (source_owner_id, source_list_id)
  where source_owner_id is not null;

alter table public.wishlists drop constraint if exists wishlists_link_source_complete;
alter table public.wishlists add constraint wishlists_link_source_complete check (
  (source_owner_id is null and source_list_id is null and source_username is null)
  or
  (source_owner_id is not null and source_list_id is not null and source_username is not null)
);

comment on column public.wishlists.source_owner_id is 'Créateur de la wishlist suivie en lecture seule.';
comment on column public.wishlists.source_list_id is 'Identifiant de la wishlist source suivie dynamiquement.';
