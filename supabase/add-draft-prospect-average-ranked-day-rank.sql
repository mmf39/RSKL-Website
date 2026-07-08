alter table public.draft_prospects
  add column if not exists average_ranked_day_rank numeric;

comment on column public.draft_prospects.average_ranked_day_rank is
  'Average rank across the prospect''s ranked days.';
