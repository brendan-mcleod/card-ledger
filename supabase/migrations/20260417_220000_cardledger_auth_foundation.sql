create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  avatar_url text,
  favorite_team text,
  location text,
  onboarding_completed boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  sport text not null default 'baseball',
  year integer not null,
  brand text not null,
  set_name text not null,
  set_slug text not null,
  series text,
  subset text,
  card_number text not null,
  player_name text not null,
  player_slug text not null,
  team text,
  rookie_card boolean not null default false,
  parallel text,
  variation text,
  autograph boolean not null default false,
  memorabilia boolean not null default false,
  grading_candidate boolean not null default true,
  image_front_url text,
  image_back_url text,
  source text not null default 'internal',
  external_source_id text,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  condition_raw text,
  graded boolean not null default false,
  grader text,
  grade text,
  certification_number text,
  purchase_price numeric(12,2),
  estimated_value numeric(12,2),
  acquired_date date,
  acquired_source text,
  notes text,
  quantity integer not null default 1,
  image_override_url text,
  is_for_trade boolean not null default false,
  is_for_sale boolean not null default false,
  visibility text not null default 'public',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id, card_id)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id, card_id)
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique(follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.activity_feed_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  card_id uuid references public.cards(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activity_event_likes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.activity_feed_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique(event_id, user_id)
);

create table if not exists public.activity_event_comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.activity_feed_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  status text not null default 'pending',
  dry_run boolean not null default false,
  summary jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.psa_cert_cache (
  id uuid primary key default gen_random_uuid(),
  certification_number text not null unique,
  card_id uuid references public.cards(id) on delete set null,
  payload jsonb not null,
  cached_at timestamptz not null default timezone('utc', now())
);

create index if not exists cards_catalog_idx on public.cards(year, brand, set_name, card_number, player_name);
create index if not exists cards_player_slug_idx on public.cards(player_slug);
create index if not exists cards_set_slug_idx on public.cards(set_slug);
create index if not exists cards_team_idx on public.cards(team);
create index if not exists cards_rookie_idx on public.cards(rookie_card);
create index if not exists cards_search_idx on public.cards using gin (to_tsvector('english', coalesce(player_name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(set_name,'') || ' ' || coalesce(card_number,'') || ' ' || coalesce(team,'')));
create index if not exists user_cards_user_idx on public.user_cards(user_id, created_at desc);
create index if not exists user_cards_card_idx on public.user_cards(card_id, created_at desc);
create index if not exists activity_events_feed_idx on public.activity_feed_events(user_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at before update on public.cards
for each row execute function public.set_updated_at();

drop trigger if exists user_cards_set_updated_at on public.user_cards;
create trigger user_cards_set_updated_at before update on public.user_cards
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_username text;
begin
  generated_username := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_]+', '_', 'g'));
  generated_username := left(generated_username, 24);

  insert into public.profiles (id, username, display_name, onboarding_completed)
  values (
    new.id,
    case when generated_username = '' then 'collector_' || substr(replace(new.id::text, '-', ''), 1, 8) else generated_username end,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.user_cards enable row level security;
alter table public.wishlists enable row level security;
alter table public.favorites enable row level security;
alter table public.follows enable row level security;
alter table public.activity_feed_events enable row level security;
alter table public.activity_event_likes enable row level security;
alter table public.activity_event_comments enable row level security;
alter table public.import_jobs enable row level security;
alter table public.psa_cert_cache enable row level security;

drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select using (true);

drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "cards public read" on public.cards;
create policy "cards public read" on public.cards for select using (true);

drop policy if exists "user_cards public read visible" on public.user_cards;
create policy "user_cards public read visible" on public.user_cards for select using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "user_cards own write" on public.user_cards;
create policy "user_cards own write" on public.user_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wishlists public read" on public.wishlists;
create policy "wishlists public read" on public.wishlists for select using (true);

drop policy if exists "wishlists own write" on public.wishlists;
create policy "wishlists own write" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "favorites public read" on public.favorites;
create policy "favorites public read" on public.favorites for select using (true);

drop policy if exists "favorites own write" on public.favorites;
create policy "favorites own write" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "follows public read" on public.follows;
create policy "follows public read" on public.follows for select using (true);

drop policy if exists "follows own write" on public.follows;
create policy "follows own write" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "activity feed public read" on public.activity_feed_events;
create policy "activity feed public read" on public.activity_feed_events for select using (true);

drop policy if exists "activity feed own insert" on public.activity_feed_events;
create policy "activity feed own insert" on public.activity_feed_events for insert with check (auth.uid() = user_id);

drop policy if exists "activity likes public read" on public.activity_event_likes;
create policy "activity likes public read" on public.activity_event_likes for select using (true);

drop policy if exists "activity likes own write" on public.activity_event_likes;
create policy "activity likes own write" on public.activity_event_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "activity comments public read" on public.activity_event_comments;
create policy "activity comments public read" on public.activity_event_comments for select using (true);

drop policy if exists "activity comments own write" on public.activity_event_comments;
create policy "activity comments own write" on public.activity_event_comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "import jobs admin only" on public.import_jobs;
create policy "import jobs admin only" on public.import_jobs for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
) with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "psa cache admin read" on public.psa_cert_cache;
create policy "psa cache admin read" on public.psa_cert_cache for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
) with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);
