begin;

-- V1-05.4.7 isolated cross-domain E2E fixture.
--
-- Apply after:
--   1. v1_05_4_4_current_contract_fixture.sql
--   2. v1_05_4_6_completion_contract_fixture.sql
--   3. v1_05_4_5_event_contract_fixture.sql
--
-- This file adds only the current matching, chat and domain-listing columns
-- required to compile the exact V1-05.4.1–V1-05.4.6.1 migrations and run the
-- canonical Property <-> Service replay. It is test-only and is never applied
-- to Supabase Production.

alter table public.items
  add column if not exists estimated_value numeric,
  add column if not exists approximate_value numeric,
  add column if not exists images jsonb not null default '[]'::jsonb,
  add column if not exists image_url text,
  add column if not exists subcategory text,
  add column if not exists subcategory_slug text,
  add column if not exists location text,
  add column if not exists location_city text,
  add column if not exists location_country text,
  add column if not exists category_l1 text,
  add column if not exists category_l2 text,
  add column if not exists category_l3 text,
  add column if not exists perceived_value_tier text,
  add column if not exists swap_open_to text[] not null default array['object']::text[],
  add column if not exists swap_wants_type text[],
  add column if not exists swap_wants_category_l1 text,
  add column if not exists swap_wants_description text,
  add column if not exists swap_wants_value_tier text,
  add column if not exists cross_category_swap boolean not null default false;

alter table public.properties
  add column if not exists property_type text,
  add column if not exists property_subtype text,
  add column if not exists country_code text,
  add column if not exists city text,
  add column if not exists lat numeric,
  add column if not exists lon numeric,
  add column if not exists bedrooms integer,
  add column if not exists bathrooms integer,
  add column if not exists sleeps_max integer,
  add column if not exists max_guests integer,
  add column if not exists surface_total_sqm numeric,
  add column if not exists flexible_dates boolean not null default true,
  add column if not exists exchange_type text not null default 'simultaneous',
  add column if not exists check_in_time time not null default time '15:00',
  add column if not exists check_out_time time not null default time '11:00',
  add column if not exists additional_rules text,
  add column if not exists home_insurance_active boolean not null default false,
  add column if not exists security_deposit_eur numeric not null default 0,
  add column if not exists timezone text not null default 'UTC';

alter table public.services_listings
  add column if not exists category_l1 text,
  add column if not exists category_l2 text,
  add column if not exists category_l3 text,
  add column if not exists service_name text,
  add column if not exists delivery_mode text not null default 'remote',
  add column if not exists service_area_type text,
  add column if not exists service_area_countries text[],
  add column if not exists service_area_cities text[],
  add column if not exists service_area_radius_km integer,
  add column if not exists experience_years integer,
  add column if not exists skill_level text,
  add column if not exists available_days text[] not null default array['monday']::text[],
  add column if not exists available_from_time time not null default time '09:00',
  add column if not exists available_until_time time not null default time '18:00',
  add column if not exists available_date_from date,
  add column if not exists available_date_until date,
  add column if not exists blocked_dates jsonb not null default '[]'::jsonb,
  add column if not exists estimated_hours integer,
  add column if not exists estimated_days integer,
  add column if not exists scope_description text,
  add column if not exists deliverables text[],
  add column if not exists milestones jsonb not null default '[]'::jsonb,
  add column if not exists timezone text not null default 'UTC';

alter table public.events_listings
  add column if not exists event_group text,
  add column if not exists event_category text,
  add column if not exists event_subcategory text,
  add column if not exists end_date date,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists location_type text not null default 'physical',
  add column if not exists country_code text,
  add column if not exists city text,
  add column if not exists includes_meals boolean not null default false;

alter table public.conversations
  add column if not exists match_id uuid,
  add column if not exists summary jsonb,
  add column if not exists summary_approved_by uuid[];

alter table public.swaps
  add column if not exists logistics jsonb not null default '{}'::jsonb,
  add column if not exists notifications text[] not null default '{}'::text[],
  add column if not exists swap_type text not null default 'object';

create table if not exists public.matching_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  slot_1_item_id uuid references public.items(id) on delete set null,
  slot_2_item_id uuid references public.items(id) on delete set null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.matching_interests (
  id uuid primary key default extensions.gen_random_uuid(),
  from_user_id uuid not null references public.profiles(user_id) on delete cascade,
  to_user_id uuid not null references public.profiles(user_id) on delete cascade,
  from_item_id uuid not null references public.items(id) on delete cascade,
  to_item_id uuid not null references public.items(id) on delete cascade,
  match_score numeric,
  source text not null default 'browsing'
    check (source in ('browsing', 'map', 'ai')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'refused', 'chat_started')),
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id),
  check (from_item_id <> to_item_id)
);

create unique index if not exists matching_interests_one_active_pair_idx
  on public.matching_interests (
    from_user_id,
    from_item_id,
    to_user_id,
    to_item_id
  )
  where status in ('pending', 'accepted');

create table if not exists public.matches (
  id uuid primary key default extensions.gen_random_uuid(),
  initiator_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  initiator_item_id uuid references public.items(id) on delete set null,
  target_item_id uuid not null references public.items(id) on delete cascade,
  match_type text not null default 'manual'
    check (match_type in ('manual', 'ai', 'explore_swipe')),
  status text not null default 'pending_chat'
    check (status in (
      'accepted', 'pending_chat', 'in_negotiation',
      'converted_to_swap', 'dismissed', 'expired'
    )),
  ai_score numeric,
  ai_reasoning text,
  slot_position integer,
  converted_swap_id uuid references public.swaps(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (initiator_id, target_item_id),
  check (initiator_id <> target_user_id)
);

alter table public.conversations
  add constraint conversations_match_id_fkey_v1547
  foreign key (match_id) references public.matches(id) on delete cascade;

alter table public.conversations
  add constraint conversations_match_id_key_v1547 unique (match_id);

create table if not exists public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  swap_id uuid references public.swaps(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  attachments jsonb not null default '[]'::jsonb,
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  is_read boolean not null default false,
  conversation_id text,
  message_type text not null default 'text',
  check (sender_id <> recipient_id),
  check (char_length(btrim(content)) between 1 and 4000),
  check (
    (swap_id is not null and match_id is null)
    or (swap_id is null and match_id is not null)
  )
);

alter table public.items enable row level security;
alter table public.properties enable row level security;
alter table public.services_listings enable row level security;
alter table public.events_listings enable row level security;
alter table public.matching_sessions enable row level security;
alter table public.matching_interests enable row level security;
alter table public.matches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.swaps enable row level security;

grant select on table public.items to authenticated;
grant select on table public.properties to authenticated;
grant select on table public.services_listings to authenticated;
grant select on table public.events_listings to authenticated;
grant select on table public.matching_sessions to authenticated;
grant select on table public.matching_interests to authenticated;
grant select on table public.matches to authenticated;
grant select on table public.conversations to authenticated;
grant select, insert on table public.messages to authenticated;
grant select on table public.swaps to authenticated;

drop policy if exists v1547_items_active_select on public.items;
create policy v1547_items_active_select
on public.items for select to authenticated
using (is_active or owner_id = auth.uid());

drop policy if exists v1547_properties_active_select on public.properties;
create policy v1547_properties_active_select
on public.properties for select to authenticated
using (status = 'active' or owner_id = auth.uid());

drop policy if exists v1547_services_active_select on public.services_listings;
create policy v1547_services_active_select
on public.services_listings for select to authenticated
using (status = 'active' or owner_id = auth.uid());

drop policy if exists v1547_events_active_select on public.events_listings;
create policy v1547_events_active_select
on public.events_listings for select to authenticated
using (status = 'active' or owner_id = auth.uid());

drop policy if exists v1547_matching_sessions_own on public.matching_sessions;
create policy v1547_matching_sessions_own
on public.matching_sessions for select to authenticated
using (user_id = auth.uid());

drop policy if exists v1547_matching_interests_participants on public.matching_interests;
create policy v1547_matching_interests_participants
on public.matching_interests for select to authenticated
using (auth.uid() in (from_user_id, to_user_id));

drop policy if exists v1547_matches_participants on public.matches;
create policy v1547_matches_participants
on public.matches for select to authenticated
using (auth.uid() in (initiator_id, target_user_id));

drop policy if exists v1547_conversations_participants on public.conversations;
create policy v1547_conversations_participants
on public.conversations for select to authenticated
using (auth.uid() = any(participant_ids));

drop policy if exists v1547_messages_participants_select on public.messages;
create policy v1547_messages_participants_select
on public.messages for select to authenticated
using (auth.uid() in (sender_id, recipient_id));

drop policy if exists v1547_messages_participant_insert on public.messages;
create policy v1547_messages_participant_insert
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and recipient_id <> auth.uid()
  and (
    (
      match_id is not null
      and swap_id is null
      and exists (
        select 1
        from public.conversations conversation_row
        join public.matches match_row
          on match_row.id = conversation_row.match_id
        where conversation_row.id::text = messages.conversation_id
          and conversation_row.match_id = messages.match_id
          and match_row.status = 'accepted'
          and auth.uid() = any(conversation_row.participant_ids)
          and messages.recipient_id = any(conversation_row.participant_ids)
          and cardinality(conversation_row.participant_ids) = 2
      )
    )
    or (
      swap_id is not null
      and match_id is null
      and exists (
        select 1
        from public.conversations conversation_row
        where conversation_row.id::text = messages.conversation_id
          and conversation_row.swap_id = messages.swap_id
          and auth.uid() = any(conversation_row.participant_ids)
          and messages.recipient_id = any(conversation_row.participant_ids)
          and cardinality(conversation_row.participant_ids) = 2
      )
    )
  )
);

drop policy if exists v1547_swaps_participants on public.swaps;
create policy v1547_swaps_participants
on public.swaps for select to authenticated
using (auth.uid() in (requester_id, responder_id));

commit;
