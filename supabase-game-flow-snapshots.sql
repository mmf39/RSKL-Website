create table if not exists public.game_flow_snapshots (
  id bigint generated always as identity primary key,
  season_key text not null,
  game_key text not null,
  game_date text,
  team1 text not null,
  team2 text not null,
  team1_score numeric not null default 0,
  team2_score numeric not null default 0,
  snapshot_minute integer not null,
  snapshot_label text,
  source text not null default 'auto',
  created_at timestamptz not null default now()
);

create index if not exists game_flow_snapshots_game_key_idx
on public.game_flow_snapshots (game_key);

create index if not exists game_flow_snapshots_season_key_idx
on public.game_flow_snapshots (season_key);

create index if not exists game_flow_snapshots_game_key_minute_idx
on public.game_flow_snapshots (game_key, snapshot_minute);

create unique index if not exists game_flow_snapshots_unique_checkpoint
on public.game_flow_snapshots (game_key, snapshot_minute);

alter table public.game_flow_snapshots enable row level security;

drop policy if exists "game_flow_snapshots_public_read" on public.game_flow_snapshots;
create policy "game_flow_snapshots_public_read"
on public.game_flow_snapshots
for select
to anon, authenticated
using (true);
