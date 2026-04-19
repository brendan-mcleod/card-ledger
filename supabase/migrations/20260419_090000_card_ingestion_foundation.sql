create extension if not exists pgcrypto;

alter table public.cards
  add column if not exists set_full_name text,
  add column if not exists position text,
  add column if not exists canonical_key text,
  add column if not exists image_url text,
  add column if not exists source_image_url text;

update public.cards
set
  set_full_name = coalesce(set_full_name, concat(year, ' ', brand, ' ', set_name)),
  canonical_key = coalesce(canonical_key, lower(concat(year, '-', set_slug, '-', card_number))),
  image_url = coalesce(image_url, image_front_url),
  source_image_url = coalesce(source_image_url, image_front_url)
where
  set_full_name is null
  or canonical_key is null
  or image_url is null
  or source_image_url is null;

alter table public.cards
  alter column set_full_name set not null,
  alter column canonical_key set not null;

create unique index if not exists cards_canonical_key_idx on public.cards(canonical_key);
create index if not exists cards_player_name_idx on public.cards(player_name);
create index if not exists cards_set_full_name_idx on public.cards(set_full_name);

create table if not exists public.card_ingest_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null default 'pending',
  cardsight_budget integer not null default 0,
  ebay_budget integer not null default 0,
  cardsight_calls_used integer not null default 0,
  ebay_calls_used integer not null default 0,
  cards_seeded integer not null default 0,
  cards_enriched integer not null default 0,
  cards_deferred integer not null default 0,
  summary jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.card_ingest_failures (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.card_ingest_runs(id) on delete set null,
  set_full_name text not null,
  canonical_key text not null,
  stage text not null,
  error_message text not null,
  raw_payload jsonb,
  retryable boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists card_ingest_failures_set_idx on public.card_ingest_failures(set_full_name, stage);
create index if not exists card_ingest_failures_canonical_key_idx on public.card_ingest_failures(canonical_key);

drop trigger if exists card_ingest_runs_set_updated_at on public.card_ingest_runs;
create trigger card_ingest_runs_set_updated_at before update on public.card_ingest_runs
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'card-images'
  ) then
    insert into storage.buckets (id, name, public)
    values ('card-images', 'card-images', true);
  end if;
end $$;
