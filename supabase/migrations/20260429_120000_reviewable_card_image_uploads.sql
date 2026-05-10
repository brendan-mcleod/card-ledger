create extension if not exists pgcrypto;

create table if not exists public.card_image_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  global_card_id text not null,
  user_card_copy_id uuid references public.user_card_copies(id) on delete set null,
  side text not null check (side in ('front', 'back')),
  storage_bucket text not null default 'card-image-submissions',
  storage_path text not null,
  original_file_name text,
  mime_type text,
  file_size_bytes integer,
  rights_attestation text not null default 'user_uploaded_own_scan',
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'needs_changes')),
  review_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  approved_image_url text,
  approved_rights_status text default 'user_uploaded' check (approved_rights_status in ('user_uploaded', 'licensed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(storage_bucket, storage_path)
);

create index if not exists card_image_submissions_user_idx on public.card_image_submissions(user_id, created_at desc);
create index if not exists card_image_submissions_card_idx on public.card_image_submissions(global_card_id, side, review_status);
create index if not exists card_image_submissions_review_idx on public.card_image_submissions(review_status, created_at asc);

drop trigger if exists card_image_submissions_set_updated_at on public.card_image_submissions;
create trigger card_image_submissions_set_updated_at before update on public.card_image_submissions
for each row execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'card-image-submissions'
  ) then
    insert into storage.buckets (id, name, public)
    values ('card-image-submissions', 'card-image-submissions', false);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'card-images-approved'
  ) then
    insert into storage.buckets (id, name, public)
    values ('card-images-approved', 'card-images-approved', true);
  end if;
end $$;

alter table public.card_image_submissions enable row level security;

drop policy if exists "card image submissions own read" on public.card_image_submissions;
create policy "card image submissions own read" on public.card_image_submissions
for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);

drop policy if exists "card image submissions own insert" on public.card_image_submissions;
create policy "card image submissions own insert" on public.card_image_submissions
for insert with check (
  auth.uid() = user_id
  and review_status = 'pending'
  and approved_image_url is null
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "card image submissions admin review" on public.card_image_submissions;
create policy "card image submissions admin review" on public.card_image_submissions
for update using (
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

drop policy if exists "card image submissions own delete pending" on public.card_image_submissions;
create policy "card image submissions own delete pending" on public.card_image_submissions
for delete using (auth.uid() = user_id and review_status = 'pending');
