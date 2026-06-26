alter table public.listings
  add column if not exists babh_registration_number text null;

create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null,
  reason text not null,
  message text null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  constraint listing_reports_status_check check (status in ('open', 'reviewed')),
  constraint listing_reports_reason_check check (
    reason in (
      'Невярна информация',
      'Измама или съмнителна обява',
      'Несвързана с пчеларство',
      'Забранен продукт',
      'Обиден/спам текст',
      'Друго'
    )
  )
);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  reporter_id uuid not null,
  reason text not null,
  message text null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  constraint message_reports_status_check check (status in ('open', 'reviewed')),
  constraint message_reports_reason_check check (
    reason in (
      'Спам',
      'Измама',
      'Обиден език',
      'Забранено съдържание',
      'Друго'
    )
  )
);

create index if not exists listing_reports_status_created_idx
  on public.listing_reports (status, created_at desc);

create index if not exists message_reports_status_created_idx
  on public.message_reports (status, created_at desc);

alter table public.listing_reports enable row level security;
alter table public.message_reports enable row level security;

drop policy if exists "Users can create listing reports" on public.listing_reports;
create policy "Users can create listing reports"
on public.listing_reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Admins can read listing reports" on public.listing_reports;
create policy "Admins can read listing reports"
on public.listing_reports
for select
to authenticated
using (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg'));

drop policy if exists "Admins can update listing reports" on public.listing_reports;
create policy "Admins can update listing reports"
on public.listing_reports
for update
to authenticated
using (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg'))
with check (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg'));

drop policy if exists "Participants can create message reports" on public.message_reports;
create policy "Participants can create message reports"
on public.message_reports
for insert
to authenticated
with check (
  auth.uid() = reporter_id
  and exists (
    select 1
    from public.conversations c
    where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  )
);

drop policy if exists "Admins can read message reports" on public.message_reports;
create policy "Admins can read message reports"
on public.message_reports
for select
to authenticated
using (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg'));

drop policy if exists "Admins can update message reports" on public.message_reports;
create policy "Admins can update message reports"
on public.message_reports
for update
to authenticated
using (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg'))
with check (lower(auth.jwt() ->> 'email') in ('melih0936@abv.bg'));
