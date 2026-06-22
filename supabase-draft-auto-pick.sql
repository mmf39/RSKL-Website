alter table public.draft_settings
  add column if not exists pick_started_at timestamptz,
  add column if not exists pick_duration_seconds int not null default 120;

create or replace function public.start_draft_pick_timer(
  p_season text default 'c2s4',
  p_duration_seconds int default 120
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn_start$
declare
  settings_row public.draft_settings%rowtype;
  is_commish_user boolean;
begin
  select exists (
    select 1
    from public.gm_assignments
    where user_id = auth.uid()
      and (
        is_commish = true
        or lower(coalesce(role, '')) in ('admin', 'commish', 'commissioner')
      )
  )
  into is_commish_user;

  if is_commish_user is not true then
    raise exception 'Commissioner access required.';
  end if;

  select *
  into settings_row
  from public.draft_settings
  where season = p_season
  for update;

  if not found then
    raise exception 'Draft settings not found for season %', p_season;
  end if;

  if settings_row.submissions_open is not true then
    raise exception 'Draft submissions are locked.';
  end if;

  update public.draft_settings
  set
    pick_started_at = now(),
    pick_duration_seconds = greatest(1, coalesce(p_duration_seconds, 120)),
    updated_at = now()
  where season = p_season;

  return jsonb_build_object(
    'ok', true,
    'season', p_season,
    'current_round', settings_row.current_round,
    'current_pick', settings_row.current_pick,
    'duration_seconds', greatest(1, coalesce(p_duration_seconds, 120))
  );
end;
$fn_start$;

create or replace function public.process_expired_draft_pick(
  p_season text default 'c2s4'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn_auto$
declare
  settings_row public.draft_settings%rowtype;
  pick_row public.draft_picks%rowtype;
  prospect_row public.draft_prospects%rowtype;
  next_pick public.draft_picks%rowtype;
  expires_at timestamptz;
begin
  select *
  into settings_row
  from public.draft_settings
  where season = p_season
  for update;

  if not found then
    return jsonb_build_object('ok', true, 'action', 'none', 'reason', 'missing_settings');
  end if;

  if settings_row.submissions_open is not true then
    return jsonb_build_object('ok', true, 'action', 'none', 'reason', 'locked');
  end if;

  if settings_row.pick_started_at is null then
    return jsonb_build_object('ok', true, 'action', 'none', 'reason', 'timer_not_started');
  end if;

  expires_at := settings_row.pick_started_at + make_interval(secs => settings_row.pick_duration_seconds);

  if now() < expires_at then
    return jsonb_build_object('ok', true, 'action', 'none', 'reason', 'not_expired', 'expires_at', expires_at);
  end if;

  select *
  into pick_row
  from public.draft_picks
  where season = p_season
    and "round" = settings_row.current_round
    and pick = settings_row.current_pick
  for update;

  if not found then
    update public.draft_settings
    set pick_started_at = null, updated_at = now()
    where season = p_season;

    return jsonb_build_object('ok', true, 'action', 'none', 'reason', 'missing_pick');
  end if;

  if coalesce(trim(pick_row.player), '') <> '' then
    update public.draft_settings
    set pick_started_at = null, updated_at = now()
    where season = p_season;

    return jsonb_build_object('ok', true, 'action', 'none', 'reason', 'pick_already_submitted');
  end if;

  select *
  into prospect_row
  from public.draft_prospects
  where season = p_season
    and available = true
  order by monthly desc nulls last, ranked_days desc nulls last, created_at asc
  limit 1
  for update skip locked;

  if not found then
    update public.draft_settings
    set pick_started_at = null, updated_at = now()
    where season = p_season;

    return jsonb_build_object('ok', true, 'action', 'none', 'reason', 'no_available_prospects');
  end if;

  update public.draft_picks
  set
    player = prospect_row.player,
    status = 'auto',
    submitted_at = now(),
    updated_at = now()
  where id = pick_row.id;

  update public.draft_prospects
  set
    available = false,
    picked_round = pick_row."round",
    picked_pick = pick_row.pick,
    picked_by_team = pick_row.team,
    updated_at = now()
  where id = prospect_row.id;

  select *
  into next_pick
  from public.draft_picks
  where season = p_season
    and pick > pick_row.pick
    and coalesce(trim(player), '') = ''
  order by pick asc
  limit 1;

  if found then
    update public.draft_settings
    set
      current_round = next_pick."round",
      current_pick = next_pick.pick,
      pick_started_at = null,
      updated_at = now()
    where season = p_season;
  else
    update public.draft_settings
    set
      pick_started_at = null,
      updated_at = now()
    where season = p_season;
  end if;

  return jsonb_build_object(
    'ok', true,
    'action', 'auto_pick',
    'season', p_season,
    'round', pick_row."round",
    'pick', pick_row.pick,
    'team', pick_row.team,
    'player', prospect_row.player
  );
end;
$fn_auto$;

grant execute on function public.start_draft_pick_timer(text, int) to authenticated;
grant execute on function public.process_expired_draft_pick(text) to authenticated;
grant execute on function public.process_expired_draft_pick(text) to service_role;
