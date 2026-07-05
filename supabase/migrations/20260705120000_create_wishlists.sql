create table if not exists public.wishlists (
  owner_id uuid not null,
  list_id text not null check (char_length(list_id) between 1 and 100),
  name text not null check (char_length(name) between 1 and 80),
  card_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, list_id)
);

create index if not exists wishlists_owner_updated_idx
  on public.wishlists (owner_id, updated_at desc);

alter table public.wishlists enable row level security;
alter table public.wishlists force row level security;
revoke all on public.wishlists from anon, authenticated;

comment on table public.wishlists is
  'Wishlists WikiMasters+, accessibles uniquement par l Edge Function après vérification du JWT WikiMasters.';
