create table if not exists public.player_profiles (
  player_tag text primary key,
  user_id text unique not null,
  photo_url text,
  updated_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;

drop policy if exists "player_profiles_public_read" on public.player_profiles;
create policy "player_profiles_public_read"
on public.player_profiles
for select
to anon, authenticated
using (true);

create index if not exists player_profiles_user_id_idx
on public.player_profiles (user_id);
