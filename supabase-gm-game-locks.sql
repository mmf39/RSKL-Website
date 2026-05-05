create table if not exists public.gm_game_locks (
  date_text text primary key,
  lock_at text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.gm_game_locks enable row level security;

drop policy if exists "gm_game_locks_select_authenticated" on public.gm_game_locks;
create policy "gm_game_locks_select_authenticated"
on public.gm_game_locks
for select
to authenticated
using (true);

drop policy if exists "gm_game_locks_commish_insert" on public.gm_game_locks;
create policy "gm_game_locks_commish_insert"
on public.gm_game_locks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.gm_assignments ga
    where ga.user_id = auth.uid()
      and (
        ga.is_commish = true
        or lower(coalesce(ga.role, '')) in ('commish', 'commissioner', 'admin')
      )
  )
  or exists (
    select 1
    from public.gm_users gu
    where gu.user_id = auth.uid()
      and gu.is_commish = true
  )
);

drop policy if exists "gm_game_locks_commish_update" on public.gm_game_locks;
create policy "gm_game_locks_commish_update"
on public.gm_game_locks
for update
to authenticated
using (
  exists (
    select 1
    from public.gm_assignments ga
    where ga.user_id = auth.uid()
      and (
        ga.is_commish = true
        or lower(coalesce(ga.role, '')) in ('commish', 'commissioner', 'admin')
      )
  )
  or exists (
    select 1
    from public.gm_users gu
    where gu.user_id = auth.uid()
      and gu.is_commish = true
  )
)
with check (
  exists (
    select 1
    from public.gm_assignments ga
    where ga.user_id = auth.uid()
      and (
        ga.is_commish = true
        or lower(coalesce(ga.role, '')) in ('commish', 'commissioner', 'admin')
      )
  )
  or exists (
    select 1
    from public.gm_users gu
    where gu.user_id = auth.uid()
      and gu.is_commish = true
  )
);
