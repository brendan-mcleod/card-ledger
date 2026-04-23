create extension if not exists pgcrypto;

create table if not exists public.sets (
  id uuid primary key default gen_random_uuid(),
  sport text not null default 'baseball',
  year integer not null,
  brand text not null,
  set_name text not null,
  set_full_name text not null,
  set_slug text not null unique,
  era text,
  description text,
  total_cards integer not null default 0,
  cover_image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.sets (
  sport,
  year,
  brand,
  set_name,
  set_full_name,
  set_slug,
  total_cards,
  cover_image_url
)
select
  'baseball',
  c.year,
  c.brand,
  c.set_name,
  c.set_full_name,
  c.set_slug,
  count(*)::integer as total_cards,
  max(c.image_url) filter (where c.image_url is not null) as cover_image_url
from public.cards c
group by c.year, c.brand, c.set_name, c.set_full_name, c.set_slug
on conflict (set_slug) do update
set
  year = excluded.year,
  brand = excluded.brand,
  set_name = excluded.set_name,
  set_full_name = excluded.set_full_name,
  total_cards = excluded.total_cards,
  cover_image_url = coalesce(public.sets.cover_image_url, excluded.cover_image_url),
  updated_at = timezone('utc', now());

alter table public.cards
  add column if not exists set_id uuid references public.sets(id) on delete set null;

update public.cards c
set set_id = s.id
from public.sets s
where c.set_id is null
  and c.set_slug = s.set_slug;

create index if not exists cards_set_id_idx on public.cards(set_id);
create index if not exists sets_year_idx on public.sets(year desc);
create index if not exists sets_era_idx on public.sets(era);

create table if not exists public.user_set_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  set_id uuid not null references public.sets(id) on delete cascade,
  started_at timestamptz not null default timezone('utc', now()),
  featured boolean not null default false,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, set_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid references public.cards(id) on delete cascade,
  set_id uuid references public.sets(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  body text,
  spoiler boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (card_id is not null or set_id is not null)
);

create index if not exists user_set_tracks_user_idx on public.user_set_tracks(user_id, started_at desc);
create index if not exists user_set_tracks_set_idx on public.user_set_tracks(set_id);
create index if not exists reviews_user_idx on public.reviews(user_id, created_at desc);
create index if not exists reviews_card_idx on public.reviews(card_id, created_at desc);
create index if not exists reviews_set_idx on public.reviews(set_id, created_at desc);

drop trigger if exists sets_set_updated_at on public.sets;
create trigger sets_set_updated_at before update on public.sets
for each row execute function public.set_updated_at();

drop trigger if exists user_set_tracks_set_updated_at on public.user_set_tracks;
create trigger user_set_tracks_set_updated_at before update on public.user_set_tracks
for each row execute function public.set_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

alter table public.sets enable row level security;
alter table public.user_set_tracks enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "sets public read" on public.sets;
create policy "sets public read" on public.sets for select using (true);

drop policy if exists "user_set_tracks public read" on public.user_set_tracks;
create policy "user_set_tracks public read" on public.user_set_tracks for select using (true);

drop policy if exists "user_set_tracks own write" on public.user_set_tracks;
create policy "user_set_tracks own write" on public.user_set_tracks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);

drop policy if exists "reviews own write" on public.reviews;
create policy "reviews own write" on public.reviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop view if exists public.users;
create view public.users as
select
  id,
  username,
  display_name,
  bio,
  avatar_url,
  favorite_team,
  location,
  onboarding_completed,
  is_admin,
  created_at,
  updated_at
from public.profiles;

drop view if exists public.collections;
create view public.collections as
select
  id,
  user_id,
  card_id,
  quantity,
  graded,
  grader,
  grade,
  purchase_price,
  estimated_value,
  acquired_date,
  acquired_source,
  notes,
  visibility,
  created_at,
  updated_at
from public.user_cards;

drop view if exists public.activity_events;
create view public.activity_events as
select
  id,
  user_id,
  type,
  card_id,
  metadata,
  created_at
from public.activity_feed_events;
