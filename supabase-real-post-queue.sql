create extension if not exists pgcrypto;

create table if not exists public.real_post_queue (
  id uuid primary key default gen_random_uuid(),
  group_id bigint,
  announcement_type text not null,
  title text,
  message text not null,
  status text not null default 'pending',
  event_key text not null unique,
  created_at timestamptz not null default now(),
  copied_at timestamptz,
  posted_at timestamptz,
  created_by text,
  error_message text,
  constraint real_post_queue_status_check
    check (status in ('pending', 'copied', 'posted', 'dismissed'))
);

create index if not exists real_post_queue_status_created_idx
  on public.real_post_queue (status, created_at desc);

create index if not exists real_post_queue_created_idx
  on public.real_post_queue (created_at desc);

alter table public.real_post_queue enable row level security;

drop policy if exists "real_post_queue_commish_read" on public.real_post_queue;
create policy "real_post_queue_commish_read"
  on public.real_post_queue
  for select
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
  );

drop policy if exists "real_post_queue_commish_update" on public.real_post_queue;
create policy "real_post_queue_commish_update"
  on public.real_post_queue
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
  );
