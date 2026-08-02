begin;

-- Supplemental current-contract fixture for the V1-05.4.5 isolated replay.
-- Apply after v1_05_4_4_current_contract_fixture.sql.
create table if not exists public.events_listings (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null unique references public.items(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  start_date date,
  timezone text not null default 'UTC',
  capacity_total integer,
  capacity_available integer,
  is_transferable boolean not null default false,
  transfer_rule_confirmed boolean not null default false,
  transfer_rule_source text,
  transfer_deadline_at timestamptz,
  includes_accommodation boolean not null default false,
  includes_transport boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft', 'active', 'paused', 'expired', 'completed', 'cancelled')),
  check (capacity_total is null or capacity_total >= 0),
  check (capacity_available is null or capacity_available >= 0),
  check (
    capacity_total is null
    or capacity_available is null
    or capacity_available <= capacity_total
  )
);

commit;
