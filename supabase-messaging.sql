-- Pchelar.bg messaging MVP
-- Run this in Supabase SQL Editor after the listings table exists.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null,
  seller_id uuid not null,
  created_at timestamptz not null default now(),
  constraint conversations_buyer_not_seller check (buyer_id <> seller_id),
  constraint conversations_unique_pair unique (listing_id, buyer_id, seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists conversations_buyer_id_idx
  on public.conversations (buyer_id, created_at desc);

create index if not exists conversations_seller_id_idx
  on public.conversations (seller_id, created_at desc);

create index if not exists conversations_listing_id_idx
  on public.conversations (listing_id);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at asc);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
on public.conversations
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Buyers can create conversations" on public.conversations;
create policy "Buyers can create conversations"
on public.conversations
for insert
to authenticated
with check (
  auth.uid() = buyer_id
  and auth.uid() <> seller_id
  and exists (
    select 1
    from public.listings
    where listings.id = conversations.listing_id
      and listings.user_id = conversations.seller_id
  )
);

drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (auth.uid() = conversations.buyer_id or auth.uid() = conversations.seller_id)
  )
);

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (auth.uid() = conversations.buyer_id or auth.uid() = conversations.seller_id)
  )
);

drop policy if exists "Participants can mark messages read" on public.messages;
create policy "Participants can mark messages read"
on public.messages
for update
to authenticated
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (auth.uid() = conversations.buyer_id or auth.uid() = conversations.seller_id)
  )
)
with check (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (auth.uid() = conversations.buyer_id or auth.uid() = conversations.seller_id)
  )
);
