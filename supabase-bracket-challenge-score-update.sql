update public.bracket_challenge_entries
set
  score =
    case
      when picks::jsonb ->> 'northWildCard' = 'Gus N Em'
      then 3 else 0
    end
    +
    case
      when picks::jsonb ->> 'lockedWildCard' = 'Bad Bois'
      then 3 else 0
    end
    +
    case
      when picks::jsonb ->> 'northFinal' = 'Gus N Em'
      then 6 else 0
    end
    +
    case
      when picks::jsonb ->> 'lockedFinal' = 'Bad Bois'
      then 6 else 0
    end,
  updated_at = now()
where season = 'c2s3-playoffs';

select
  handle,
  score,
  picks::jsonb ->> 'northWildCard' as north_wild_card,
  picks::jsonb ->> 'lockedWildCard' as locked_wild_card,
  picks::jsonb ->> 'northFinal' as north_final,
  picks::jsonb ->> 'lockedFinal' as locked_final
from public.bracket_challenge_entries
where season = 'c2s3-playoffs'
order by score desc, handle asc;
