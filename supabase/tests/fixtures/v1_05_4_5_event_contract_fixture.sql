begin;

-- Supplemental current-contract fixture for the V1-05.4.5 isolated replay.
-- Apply after v1_05_4_4_current_contract_fixture.sql.
--
-- This file models only the additional Production contracts that the Event
-- transfer migration and authenticated replay depend on. It is test-only and
-- is never applied to Supabase Production.
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

-- Minimal current-contract representation of the canonical cancellation
-- authority. The Event replay needs the real public signature and the
-- authoritative Swap status transition so that V1-05.4.5 triggers can prove
-- cancellation and capacity release. Production's richer cancellation side
-- effects remain outside this isolated fixture.
create or replace function public.cancel_swap_v1(
  p_swap_id uuid,
  p_expected_status text,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_reason text := pg_catalog.btrim(pg_catalog.coalesce(p_reason, ''));
  v_key text := pg_catalog.btrim(pg_catalog.coalesce(p_idempotency_key, ''));
  v_transition jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_swap_id is null
    or p_expected_status not in ('pending', 'accepted', 'in_progress')
    or pg_catalog.char_length(v_key) not between 8 and 200
    or pg_catalog.char_length(v_reason) > 500
  then
    raise exception using errcode = '22023', message = 'Invalid cancellation input.';
  end if;

  if p_expected_status in ('accepted', 'in_progress')
    and pg_catalog.char_length(v_reason) < 3
  then
    raise exception using errcode = '22023', message = 'Cancellation reason is required after acceptance.';
  end if;

  v_transition := public.apply_swap_transition_v1(
    p_swap_id,
    p_expected_status,
    'cancelled',
    v_actor,
    'cancel_authority',
    v_key
  );

  return pg_catalog.jsonb_build_object(
    'swap', v_transition -> 'swap',
    'replayed', false,
    'idempotency_key', v_key,
    'reason', v_reason,
    'transition', v_transition
  );
end;
$function$;

revoke all on function public.cancel_swap_v1(uuid, text, text, text)
  from public, anon;
grant execute on function public.cancel_swap_v1(uuid, text, text, text)
  to authenticated;

commit;
