-- V1-02-R8 — canonical Swapleni ledger and reconciliation
-- Forward-only schema and data reconciliation.
-- Do not apply to Production without explicit owner authorisation.

create table if not exists public.swapleni_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  amount bigint not null check (amount <> 0 and abs(amount) <= 1000000),
  event_type text not null check (length(btrim(event_type)) between 1 and 80),
  source_type text not null check (length(btrim(source_type)) between 1 and 80),
  source_id uuid,
  idempotency_key text not null unique
    check (length(btrim(idempotency_key)) between 8 and 240),
  reversal_of uuid unique references public.swapleni_ledger(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default clock_timestamp(),
  imported_from_legacy_id uuid unique,
  check (
    (reversal_of is null)
    or (amount < 0 and event_type = 'reversal')
  )
);

create table if not exists public.swapleni_accounts (
  user_id uuid primary key references auth.users(id) on delete restrict,
  balance bigint not null default 0,
  lifetime_earned bigint not null default 0 check (lifetime_earned >= 0),
  lifetime_spent bigint not null default 0 check (lifetime_spent >= 0),
  last_event_id uuid references public.swapleni_ledger(id) on delete restrict,
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists swapleni_ledger_user_created_idx
  on public.swapleni_ledger(user_id, created_at desc, id desc);
create index if not exists swapleni_ledger_source_idx
  on public.swapleni_ledger(source_type, source_id)
  where source_id is not null;
create index if not exists swapleni_ledger_reversal_idx
  on public.swapleni_ledger(reversal_of)
  where reversal_of is not null;

alter table public.swapleni_ledger enable row level security;
alter table public.swapleni_accounts enable row level security;

create or replace function private.apply_swapleni_account_event_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  insert into public.swapleni_accounts (
    user_id,
    balance,
    lifetime_earned,
    lifetime_spent,
    last_event_id,
    updated_at
  ) values (
    new.user_id,
    new.amount,
    greatest(new.amount, 0),
    greatest(-new.amount, 0),
    new.id,
    clock_timestamp()
  )
  on conflict (user_id) do update
     set balance = public.swapleni_accounts.balance + excluded.balance,
         lifetime_earned = public.swapleni_accounts.lifetime_earned + excluded.lifetime_earned,
         lifetime_spent = public.swapleni_accounts.lifetime_spent + excluded.lifetime_spent,
         last_event_id = excluded.last_event_id,
         updated_at = clock_timestamp();

  update public.profiles
     set token_balance = (
           select account_row.balance::integer
             from public.swapleni_accounts account_row
            where account_row.user_id = new.user_id
         ),
         lifetime_tokens = (
           select account_row.lifetime_earned::integer
             from public.swapleni_accounts account_row
            where account_row.user_id = new.user_id
         ),
         stats = jsonb_set(
           coalesce(stats, '{}'::jsonb),
           '{tokens}',
           to_jsonb((
             select account_row.balance
               from public.swapleni_accounts account_row
              where account_row.user_id = new.user_id
           )),
           true
         ),
         updated_at = clock_timestamp()
   where user_id = new.user_id;

  return new;
end;
$$;

create or replace function private.prevent_swapleni_ledger_mutation_v1()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'Swapleni ledger is append-only; use a compensating reversal event'
    using errcode = '55000';
end;
$$;

drop trigger if exists apply_swapleni_account_event on public.swapleni_ledger;
create trigger apply_swapleni_account_event
after insert on public.swapleni_ledger
for each row execute function private.apply_swapleni_account_event_v1();

drop trigger if exists prevent_swapleni_ledger_update on public.swapleni_ledger;
create trigger prevent_swapleni_ledger_update
before update on public.swapleni_ledger
for each row execute function private.prevent_swapleni_ledger_mutation_v1();

drop trigger if exists prevent_swapleni_ledger_delete on public.swapleni_ledger;
create trigger prevent_swapleni_ledger_delete
before delete on public.swapleni_ledger
for each row execute function private.prevent_swapleni_ledger_mutation_v1();

create or replace function public.post_swapleni_event_v1(
  p_user_id uuid,
  p_amount bigint,
  p_event_type text,
  p_source_type text,
  p_source_id uuid,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default clock_timestamp()
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  event_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service authority required' using errcode = '42501';
  end if;

  if p_user_id is null
     or p_amount is null
     or p_amount = 0
     or abs(p_amount) > 1000000
     or nullif(btrim(p_event_type), '') is null
     or nullif(btrim(p_source_type), '') is null
     or length(btrim(p_event_type)) > 80
     or length(btrim(p_source_type)) > 80
     or nullif(btrim(p_idempotency_key), '') is null
     or length(btrim(p_idempotency_key)) < 8
     or length(btrim(p_idempotency_key)) > 240 then
    raise exception 'Invalid Swapleni event' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles where user_id = p_user_id) then
    raise exception 'Profile is required for Swapleni event' using errcode = 'P0002';
  end if;

  insert into public.swapleni_ledger (
    user_id,
    amount,
    event_type,
    source_type,
    source_id,
    idempotency_key,
    metadata,
    occurred_at
  ) values (
    p_user_id,
    p_amount,
    btrim(p_event_type),
    btrim(p_source_type),
    p_source_id,
    btrim(p_idempotency_key),
    coalesce(p_metadata, '{}'::jsonb),
    coalesce(p_occurred_at, clock_timestamp())
  )
  on conflict (idempotency_key) do update
     set idempotency_key = excluded.idempotency_key
  returning id into event_id;

  return event_id;
end;
$$;

create or replace function public.reverse_swapleni_event_v1(
  p_original_event_id uuid,
  p_reason text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  original_row public.swapleni_ledger%rowtype;
  reversal_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service authority required' using errcode = '42501';
  end if;

  select * into original_row
    from public.swapleni_ledger
   where id = p_original_event_id
   for share;

  if not found then
    raise exception 'Original Swapleni event not found' using errcode = 'P0002';
  end if;

  if original_row.reversal_of is not null then
    raise exception 'A reversal event cannot be reversed directly' using errcode = '22023';
  end if;

  insert into public.swapleni_ledger (
    user_id,
    amount,
    event_type,
    source_type,
    source_id,
    idempotency_key,
    reversal_of,
    metadata,
    occurred_at
  ) values (
    original_row.user_id,
    -original_row.amount,
    'reversal',
    'swapleni_ledger',
    original_row.id,
    btrim(p_idempotency_key),
    original_row.id,
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('reason', nullif(btrim(p_reason), '')),
    clock_timestamp()
  )
  on conflict (idempotency_key) do update
     set idempotency_key = excluded.idempotency_key
  returning id into reversal_id;

  return reversal_id;
end;
$$;

create or replace function public.get_own_swapleni_account_v1()
returns table (
  balance bigint,
  lifetime_earned bigint,
  lifetime_spent bigint,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select account_row.balance,
         account_row.lifetime_earned,
         account_row.lifetime_spent,
         account_row.updated_at
    from public.swapleni_accounts account_row
   where account_row.user_id = auth.uid();
$$;

create or replace function public.award_tokens(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  canonical_key text;
  event_id uuid;
begin
  if p_user_id is null
     or p_amount is null
     or p_amount = 0
     or abs(p_amount) > 1000
     or nullif(btrim(p_reason), '') is null
     or length(btrim(p_reason)) > 80 then
    raise exception 'Invalid token award' using errcode = '22023';
  end if;

  if p_reference_id is null
     and btrim(p_reason) not like 'onboarding_step_%' then
    raise exception 'Reference id is required for non-onboarding Swapleni awards'
      using errcode = '22023';
  end if;

  canonical_key := case
    when p_reference_id is not null then
      format('legacy-award:%s:%s:%s', p_user_id, btrim(p_reason), p_reference_id)
    else
      format('legacy-award:%s:%s', p_user_id, btrim(p_reason))
  end;

  insert into public.swapleni_ledger (
    user_id,
    amount,
    event_type,
    source_type,
    source_id,
    idempotency_key,
    metadata
  ) values (
    p_user_id,
    p_amount,
    btrim(p_reason),
    'legacy_award_tokens',
    p_reference_id,
    canonical_key,
    jsonb_build_object('compatibility_wrapper', true)
  )
  on conflict (idempotency_key) do nothing
  returning id into event_id;

  if event_id is null then
    return;
  end if;

  insert into public.user_tokens (
    id,
    user_id,
    amount,
    reason,
    reference_id,
    created_at
  ) values (
    event_id,
    p_user_id,
    p_amount,
    btrim(p_reason),
    p_reference_id,
    clock_timestamp()
  )
  on conflict (id) do nothing;
end;
$$;

-- Import the complete legacy history once. The immutable legacy row id is the
-- provenance and idempotency anchor, so replay cannot create duplicates.
insert into public.swapleni_ledger (
  id,
  user_id,
  amount,
  event_type,
  source_type,
  source_id,
  idempotency_key,
  metadata,
  occurred_at,
  created_at,
  imported_from_legacy_id
)
select legacy_row.id,
       legacy_row.user_id,
       legacy_row.amount,
       legacy_row.reason,
       'user_tokens',
       legacy_row.reference_id,
       'legacy-user-tokens:' || legacy_row.id::text,
       jsonb_build_object('legacy_reason', legacy_row.reason),
       coalesce(legacy_row.created_at, clock_timestamp()),
       coalesce(legacy_row.created_at, clock_timestamp()),
       legacy_row.id
  from public.user_tokens legacy_row
on conflict (idempotency_key) do nothing;

-- Reconcile every profile to the canonical account state, including profiles
-- with no legacy events. No trust fields are read or written here.
insert into public.swapleni_accounts (user_id, balance, lifetime_earned, lifetime_spent)
select profile_row.user_id, 0, 0, 0
  from public.profiles profile_row
on conflict (user_id) do nothing;

update public.profiles profile_row
   set token_balance = account_row.balance::integer,
       lifetime_tokens = account_row.lifetime_earned::integer,
       stats = jsonb_set(
         coalesce(profile_row.stats, '{}'::jsonb),
         '{tokens}',
         to_jsonb(account_row.balance),
         true
       ),
       updated_at = clock_timestamp()
  from public.swapleni_accounts account_row
 where account_row.user_id = profile_row.user_id;

create policy swapleni_ledger_owner_select
on public.swapleni_ledger
for select
to authenticated
using (auth.uid() = user_id);

create policy swapleni_accounts_owner_select
on public.swapleni_accounts
for select
to authenticated
using (auth.uid() = user_id);

revoke all on table public.swapleni_ledger from public, anon, authenticated;
revoke all on table public.swapleni_accounts from public, anon, authenticated;
grant select on table public.swapleni_ledger to authenticated;
grant select on table public.swapleni_accounts to authenticated;

-- The legacy table remains as a compatibility mirror, but direct writes are
-- removed now that the canonical ledger owns event creation and balances.
revoke insert, update, delete, truncate, references, trigger
  on table public.user_tokens from public, anon, authenticated;
grant select on table public.user_tokens to authenticated;

revoke all on function private.apply_swapleni_account_event_v1()
  from public, anon, authenticated, service_role;
revoke all on function private.prevent_swapleni_ledger_mutation_v1()
  from public, anon, authenticated, service_role;

revoke all on function public.post_swapleni_event_v1(uuid, bigint, text, text, uuid, text, jsonb, timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.reverse_swapleni_event_v1(uuid, text, text, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.get_own_swapleni_account_v1()
  from public, anon, authenticated, service_role;
revoke all on function public.award_tokens(uuid, integer, text, uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.post_swapleni_event_v1(uuid, bigint, text, text, uuid, text, jsonb, timestamptz)
  to service_role;
grant execute on function public.reverse_swapleni_event_v1(uuid, text, text, jsonb)
  to service_role;
grant execute on function public.get_own_swapleni_account_v1()
  to authenticated;
grant execute on function public.award_tokens(uuid, integer, text, uuid)
  to service_role;

comment on table public.swapleni_ledger is
  'Canonical append-only Swapleni event ledger. Corrections use compensating reversal rows; trust and rank are separate systems.';
comment on table public.swapleni_accounts is
  'Derived Swapleni account cache maintained only from append-only ledger events. The ledger remains the source of truth.';
comment on function public.post_swapleni_event_v1(uuid, bigint, text, text, uuid, text, jsonb, timestamptz) is
  'Service-authority append-only Swapleni event writer with mandatory global idempotency key.';
comment on function public.reverse_swapleni_event_v1(uuid, text, text, jsonb) is
  'Creates one compensating event for a prior Swapleni ledger event; never mutates history.';
comment on function public.get_own_swapleni_account_v1() is
  'Returns only the authenticated user own derived Swapleni account totals.';