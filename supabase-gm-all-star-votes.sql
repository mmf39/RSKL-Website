create table if not exists public.gm_all_star_votes_public (
  voter_id uuid primary key,
  voter_email text not null default '',
  voter_team text not null default '',
  voter_handle text not null default '',
  votes jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.gm_all_star_votes_public enable row level security;

drop policy if exists "gm_all_star_votes_public_write" on public.gm_all_star_votes_public;
create policy "gm_all_star_votes_public_write"
on public.gm_all_star_votes_public
for insert
to anon, authenticated
with check (true);

drop policy if exists "gm_all_star_votes_public_update" on public.gm_all_star_votes_public;
create policy "gm_all_star_votes_public_update"
on public.gm_all_star_votes_public
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "gm_all_star_votes_block_reads" on public.gm_all_star_votes_public;
create policy "gm_all_star_votes_block_reads"
on public.gm_all_star_votes_public
for select
to anon, authenticated
using (false);
