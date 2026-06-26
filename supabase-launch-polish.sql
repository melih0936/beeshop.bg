-- BeeShop.bg launch polish placeholders.
-- Run after the previous moderation/reports SQL files.

-- Optional listing-level cache for future verified beekeeper badges.
alter table public.listings
  add column if not exists seller_is_verified boolean not null default false;

-- If you use a profiles table later, this is the recommended field.
create table if not exists public.profiles (
  id uuid primary key,
  email text null,
  full_name text null,
  phone text null,
  region text null,
  is_verified_beekeeper boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg', 'efsennchane@gmail.com'))
with check (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg', 'efsennchane@gmail.com'));

create table if not exists public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null,
  reviewer_id uuid not null,
  listing_id uuid null references public.listings(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text null,
  created_at timestamptz not null default now(),
  unique (seller_id, reviewer_id, listing_id),
  check (seller_id <> reviewer_id)
);

alter table public.seller_reviews enable row level security;

drop policy if exists "Seller reviews are public" on public.seller_reviews;
create policy "Seller reviews are public"
on public.seller_reviews
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can create seller reviews" on public.seller_reviews;
create policy "Authenticated users can create seller reviews"
on public.seller_reviews
for insert
to authenticated
with check (auth.uid() = reviewer_id and auth.uid() <> seller_id);

drop policy if exists "Users can update own seller reviews" on public.seller_reviews;
create policy "Users can update own seller reviews"
on public.seller_reviews
for update
to authenticated
using (auth.uid() = reviewer_id)
with check (auth.uid() = reviewer_id and auth.uid() <> seller_id);

drop policy if exists "Users can delete own seller reviews" on public.seller_reviews;
create policy "Users can delete own seller reviews"
on public.seller_reviews
for delete
to authenticated
using (auth.uid() = reviewer_id);

-- Admin powers for listings. Keep owner policies you already have; these add admin access.
drop policy if exists "Admins can update any listing" on public.listings;
create policy "Admins can update any listing"
on public.listings
for update
to authenticated
using (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg', 'efsennchane@gmail.com'))
with check (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg', 'efsennchane@gmail.com'));

drop policy if exists "Admins can delete any listing" on public.listings;
create policy "Admins can delete any listing"
on public.listings
for delete
to authenticated
using (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg', 'efsennchane@gmail.com'));

-- Admin can mark Top without a payment flow for now.
-- Use this only from the admin account until real payments are added.
