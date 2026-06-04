create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text default '',
  body text not null,
  author text default 'Commissioner',
  content_type text not null default 'article',
  game_key text default '',
  season text default '',
  date_token text default '',
  team1 text default '',
  team2 text default '',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_articles add column if not exists content_type text not null default 'article';
alter table public.news_articles add column if not exists game_key text default '';
alter table public.news_articles add column if not exists season text default '';
alter table public.news_articles add column if not exists date_token text default '';
alter table public.news_articles add column if not exists team1 text default '';
alter table public.news_articles add column if not exists team2 text default '';

create index if not exists news_articles_status_created_at_idx
  on public.news_articles (status, created_at desc);

create index if not exists news_articles_game_content_idx
  on public.news_articles (content_type, season, game_key, created_at desc);

create or replace function public.set_news_articles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_articles_updated_at on public.news_articles;
create trigger news_articles_updated_at
before update on public.news_articles
for each row
execute function public.set_news_articles_updated_at();
