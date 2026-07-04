-- RSKL team renames
-- The Lions -> Pandas
-- The Snipers -> Super Kings
--
-- Run this in Supabase SQL Editor after deploying the website change.

do $$
declare
  target record;
begin
  for target in
    select *
    from (values
      ('gm_assignments', 'team'),
      ('draft_picks', 'team'),
      ('draft_picks', 'original_team'),
      ('draft_picks', 'from_team'),
      ('draft_picks', 'picked_by_team'),
      ('draft_prospects', 'picked_by_team'),
      ('news_articles', 'team1'),
      ('news_articles', 'team2'),
      ('game_flow_snapshots', 'team1'),
      ('game_flow_snapshots', 'team2')
    ) as columns_to_update(table_name, column_name)
  loop
    if to_regclass('public.' || target.table_name) is not null
      and exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = target.table_name
          and column_name = target.column_name
      )
    then
      execute format(
        'update public.%I
         set %I = case
           when %I in (''The Lions'', ''Lions'') then ''Pandas''
           when %I in (''The Snipers'', ''Snipers'') then ''Super Kings''
           else %I
         end
         where %I in (''The Lions'', ''Lions'', ''The Snipers'', ''Snipers'')',
        target.table_name,
        target.column_name,
        target.column_name,
        target.column_name,
        target.column_name,
        target.column_name
      );
    end if;
  end loop;

  if to_regclass('public.bracket_challenge_entries') is not null then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'bracket_challenge_entries'
        and column_name = 'champion'
    ) then
      update public.bracket_challenge_entries
      set champion = case
        when champion in ('The Lions', 'Lions') then 'Pandas'
        when champion in ('The Snipers', 'Snipers') then 'Super Kings'
        else champion
      end
      where champion in ('The Lions', 'Lions', 'The Snipers', 'Snipers');
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'bracket_challenge_entries'
        and column_name = 'picks'
    ) then
      update public.bracket_challenge_entries
      set picks = replace(
        replace(
          replace(
            replace(picks::text, '"The Lions"', '"Pandas"'),
            '"Lions"',
            '"Pandas"'
          ),
          '"The Snipers"',
          '"Super Kings"'
        ),
        '"Snipers"',
        '"Super Kings"'
      )::jsonb
      where picks::text like '%The Lions%'
        or picks::text like '%Lions%'
        or picks::text like '%The Snipers%'
        or picks::text like '%Snipers%';
    end if;
  end if;
end $$;
