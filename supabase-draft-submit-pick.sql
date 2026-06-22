drop function if exists public.submit_draft_pick(text, int, int, text, text, text);

create or replace function public.submit_draft_pick(
  p_season text default 'c2s4',
  p_round int default 1,
  p_pick int default 1,
  p_team text default '',
  p_player text default '',
  p_user uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn_submit$
declare
  settings_row public.draft_settings%rowtype;
  pick_row public.draft_picks%rowtype;
  prospect_row public.draft_prospects%rowtype;
  next_pick public.draft_picks%rowtype;
  clean_player text;
  clean_user text;
  is_commish_user boolean;
  is_gm_user boolean;
begin
  clean_player := trim(coalesce(p_player, ''));
  clean_user := trim(coalesce(p_user::text, auth.uid()::text, ''));

  if clean_player = '' then
    raise exception 'Missing player name.';
  end if;

  select exists (
    select 1
    from public.gm_assignments ga
    where ga.user_id::text = clean_user
      and (
        ga.is_commish = true
        or lower(coalesce(ga.role, '')) in ('admin', 'commish', 'commissioner')
      )
  )
  into is_commish_user;

  select exists (
    select 1
    from public.gm_assignments ga
    where ga.user_id::text = clean_user
  )
  into is_gm_user;

  if is_gm_user is not true and is_commish_user is not true then
    raise exception 'GM access required.';
  end if;

  select *
  into settings_row
  from public.draft_settings
  where season = p_season
  for update;

  if not found then
    raise exception 'Draft settings not found for season %.', p_season;
  end if;

  if settings_row.submissions_open is not true then
    raise exception 'Draft submissions are locked.';
  end if;

  if settings_row.current_round <> p_round or settings_row.current_pick <> p_pick then
    raise exception 'Pick % is not on the clock.', p_pick;
  end if;

  select *
  into pick_row
  from public.draft_picks
  where season = p_season
    and "round" = p_round
    and pick = p_pick
  for update;

  if not found then
    raise exception 'Could not find Round %, Pick %.', p_round, p_pick;
  end if;

  if coalesce(trim(pick_row.player), '') <> '' then
    raise exception 'Round %, Pick % has already been submitted.', p_round, p_pick;
  end if;

  select *
  into prospect_row
  from public.draft_prospects
  where season = p_season
    and available = true
    and lower(trim(player)) = lower(clean_player)
  limit 1
  for update;

  if not found then
    raise exception '% is not an available draft prospect.', clean_player;
  end if;

  update public.draft_picks
  set
    player = prospect_row.player,
    status = 'submitted',
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
    'action', 'submit_pick',
    'season', p_season,
    'round', pick_row."round",
    'pick', pick_row.pick,
    'team', pick_row.team,
    'player', prospect_row.player,
    'clock_stopped', true
  );
end;
$fn_submit$;

grant execute on function public.submit_draft_pick(text, int, int, text, text, uuid) to authenticated;
