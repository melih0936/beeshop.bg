create table if not exists public.verified_beekeeper_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text null,
  full_name text null,
  phone text null,
  babh_registration_number text not null,
  message text null,
  status text not null default 'pending',
  admin_note text null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null,
  constraint verified_beekeeper_applications_status_check
    check (status in ('pending', 'approved', 'rejected'))
);

create unique index if not exists verified_beekeeper_one_pending_per_user_idx
  on public.verified_beekeeper_applications (user_id)
  where status = 'pending';

alter table public.verified_beekeeper_applications enable row level security;

drop policy if exists "Users can create own verified application" on public.verified_beekeeper_applications;
create policy "Users can create own verified application"
on public.verified_beekeeper_applications
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'
  and reviewed_at is null
  and reviewed_by is null
);

drop policy if exists "Users can read own verified applications" on public.verified_beekeeper_applications;
create policy "Users can read own verified applications"
on public.verified_beekeeper_applications
for select
to authenticated
using (
  auth.uid() = user_id
  or lower(coalesce(auth.jwt() ->> 'email', '')) in ('melih0936@abv.bg', 'efsennchane@gmail.com')
);

drop policy if exists "Admins can update verified applications" on public.verified_beekeeper_applications;
create policy "Admins can update verified applications"
on public.verified_beekeeper_applications
for update
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) in ('melih0936@abv.bg', 'efsennchane@gmail.com')
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) in ('melih0936@abv.bg', 'efsennchane@gmail.com')
);

-- Run only if you use a public.profiles table and it does not already have this field.
alter table public.profiles
  add column if not exists is_verified_beekeeper boolean not null default false;

-- Optional cache on listings, used for fast badge display if present.
alter table public.listings
  add column if not exists seller_is_verified boolean not null default false;

-- If profiles RLS blocks admin updates, add/adjust a policy like this:
-- create policy "Admins can update profile verification"
-- on public.profiles
-- for update
-- to authenticated
-- using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('melih0936@abv.bg', 'efsennchane@gmail.com'))
-- with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('melih0936@abv.bg', 'efsennchane@gmail.com'));
