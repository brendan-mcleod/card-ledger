create extension if not exists pgcrypto;

create table if not exists public.collector_states (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_card_copies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  global_card_id text not null,
  copy_label text,
  selected_back_id text not null default 'none',
  back_variation_notes text,
  condition text,
  format text not null default 'Raw',
  grading_company text,
  grade text,
  certification_number text,
  purchase_price numeric(12,2),
  estimated_value numeric(12,2),
  date_acquired date,
  acquired_from text,
  notes text,
  visibility text not null default 'public',
  availability_status text not null default 'not_available',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.showcase_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  global_card_id text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id, global_card_id),
  unique(user_id, position)
);

create index if not exists collector_states_updated_idx on public.collector_states(updated_at desc);
create index if not exists user_card_copies_user_idx on public.user_card_copies(user_id, created_at desc);
create index if not exists user_card_copies_card_idx on public.user_card_copies(global_card_id);
create index if not exists showcase_cards_user_idx on public.showcase_cards(user_id, position);

drop trigger if exists collector_states_set_updated_at on public.collector_states;
create trigger collector_states_set_updated_at before update on public.collector_states
for each row execute function public.set_updated_at();

drop trigger if exists user_card_copies_set_updated_at on public.user_card_copies;
create trigger user_card_copies_set_updated_at before update on public.user_card_copies
for each row execute function public.set_updated_at();

alter table public.collector_states enable row level security;
alter table public.user_card_copies enable row level security;
alter table public.showcase_cards enable row level security;

drop policy if exists "collector states own read" on public.collector_states;
create policy "collector states own read" on public.collector_states
for select using (auth.uid() = user_id);

drop policy if exists "collector states own write" on public.collector_states;
create policy "collector states own write" on public.collector_states
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user card copies public read visible" on public.user_card_copies;
create policy "user card copies public read visible" on public.user_card_copies
for select using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "user card copies own write" on public.user_card_copies;
create policy "user card copies own write" on public.user_card_copies
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "showcase cards public read" on public.showcase_cards;
create policy "showcase cards public read" on public.showcase_cards
for select using (true);

drop policy if exists "showcase cards own write" on public.showcase_cards;
create policy "showcase cards own write" on public.showcase_cards
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
