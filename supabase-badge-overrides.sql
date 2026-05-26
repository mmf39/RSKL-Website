create table if not exists public.badge_overrides (
  id text primary key,
  data jsonb not null default '{"risingStars":[],"rookie":{},"allStar":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.badge_overrides (id)
values ('global')
on conflict (id) do nothing;

alter table public.badge_overrides enable row level security;

drop policy if exists "badge_overrides_public_read" on public.badge_overrides;
create policy "badge_overrides_public_read"
on public.badge_overrides
for select
to anon, authenticated
using (true);
