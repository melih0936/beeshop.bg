-- BeeShop.bg AI moderation fields for public.listings
-- Run this in Supabase SQL Editor before enabling the app changes.

alter table public.listings
  add column if not exists moderation_status text not null default 'approved',
  add column if not exists moderation_reason text null,
  add column if not exists moderation_confidence numeric null,
  add column if not exists moderated_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_moderation_status_check'
  ) then
    alter table public.listings
      add constraint listings_moderation_status_check
      check (moderation_status in ('approved', 'review', 'rejected'));
  end if;
end $$;

create index if not exists listings_public_moderation_idx
  on public.listings (moderation_status, created_at desc);

-- Existing public SELECT policies should be tightened so public visitors only see approved listings.
-- If your current SELECT policy is broad, replace it with one like this:
--
-- drop policy if exists "Public can view listings" on public.listings;
-- create policy "Public can view approved listings"
-- on public.listings
-- for select
-- using (
--   moderation_status = 'approved'
--   and (expires_at is null or expires_at > now())
-- );
--
-- Owners still need to see their own pending/rejected listings in Profile:
--
-- create policy "Owners can view own listings"
-- on public.listings
-- for select
-- using (auth.uid() = user_id);
--
-- Admin review placeholder: replace the email with your admin email before running.
--
-- create policy "Admins can moderate listings"
-- on public.listings
-- for update
-- using ((auth.jwt() ->> 'email') in ('admin@example.com'))
-- with check ((auth.jwt() ->> 'email') in ('admin@example.com'));
