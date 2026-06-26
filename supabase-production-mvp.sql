-- Pchelar.bg production-MVP upgrades.
-- Run in Supabase SQL Editor. Safe to rerun where possible.

alter table public.listings
  add column if not exists subcategory text null,
  add column if not exists city text null,
  add column if not exists neighborhood text null,
  add column if not exists latitude double precision null,
  add column if not exists longitude double precision null,
  add column if not exists expires_at timestamptz null,
  add column if not exists is_negotiable boolean not null default false;

update public.listings
set expires_at = coalesce(expires_at, created_at + interval '30 days')
where expires_at is null;

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  path text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_images_listing_id_sort_order_idx
  on public.listing_images (listing_id, sort_order);

alter table public.listing_images enable row level security;

drop policy if exists "Anyone can view listing images rows" on public.listing_images;
create policy "Anyone can view listing images rows"
on public.listing_images
for select
to public
using (true);

drop policy if exists "Owners can insert listing images rows" on public.listing_images;
create policy "Owners can insert listing images rows"
on public.listing_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.user_id = auth.uid()
  )
);

drop policy if exists "Owners can update listing images rows" on public.listing_images;
create policy "Owners can update listing images rows"
on public.listing_images
for update
to authenticated
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.user_id = auth.uid()
  )
);

drop policy if exists "Owners can delete listing images rows" on public.listing_images;
create policy "Owners can delete listing images rows"
on public.listing_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_images.listing_id
      and listings.user_id = auth.uid()
  )
);

alter table public.messages
  add column if not exists attachment_url text null,
  add column if not exists attachment_type text null,
  add column if not exists attachment_name text null,
  add column if not exists attachment_size integer null;

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  ip text null,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_user_action_created_at_idx
  on public.rate_limits (user_id, action, created_at desc);

alter table public.rate_limits enable row level security;

drop policy if exists "Users can read own rate limits" on public.rate_limits;
create policy "Users can read own rate limits"
on public.rate_limits
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own rate limits" on public.rate_limits;
create policy "Users can create own rate limits"
on public.rate_limits
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_unique_user_listing unique (user_id, listing_id)
);

alter table public.favorites enable row level security;

drop policy if exists "Users can read own favorites" on public.favorites;
create policy "Users can read own favorites"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own favorites" on public.favorites;
create policy "Users can create own favorites"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Owners can update own listings" on public.listings;
create policy "Owners can update own listings"
on public.listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Owners can delete own listings" on public.listings;
create policy "Owners can delete own listings"
on public.listings
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Participants can mark messages read" on public.messages;
create policy "Participants can mark messages read"
on public.messages
for update
to authenticated
using (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (auth.uid() = conversations.buyer_id or auth.uid() = conversations.seller_id)
  )
)
with check (
  sender_id <> auth.uid()
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (auth.uid() = conversations.buyer_id or auth.uid() = conversations.seller_id)
  )
);

-- Storage buckets to create manually:
-- 1. listing-images (public)
-- 2. message-attachments (public for MVP; private signed URLs can be added later)

drop policy if exists "Anyone can view listing images" on storage.objects;
create policy "Anyone can view listing images"
on storage.objects
for select
to public
using (bucket_id = 'listing-images');

drop policy if exists "Authenticated users can upload listing images" on storage.objects;
create policy "Authenticated users can upload listing images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Anyone can view message attachments" on storage.objects;
create policy "Anyone can view message attachments"
on storage.objects
for select
to public
using (bucket_id = 'message-attachments');

drop policy if exists "Authenticated users can upload message attachments" on storage.objects;
create policy "Authenticated users can upload message attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'message-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);
-- Tighten listing creation: only logged-in users can create their own listings

drop policy if exists "Anyone can create listings" on public.listings;

drop policy if exists "Authenticated users can create own listings" on public.listings;
create policy "Authenticated users can create own listings"
on public.listings
for insert
to authenticated
with check (auth.uid() = user_id);
drop policy if exists "Users can update own listing images storage" on storage.objects;
create policy "Users can update own listing images storage"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own listing images storage" on storage.objects;
create policy "Users can delete own listing images storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete own message attachments storage" on storage.objects;
create policy "Users can delete own message attachments storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'message-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);