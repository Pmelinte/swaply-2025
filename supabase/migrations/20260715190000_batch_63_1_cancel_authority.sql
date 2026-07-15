begin;

-- Batch 63.1: canonical participant-only cancellation authority.
-- Cancellation remains a terminal Swap status from C2, but its reason,
-- cleanup, counters, trust and notifications are applied atomically here.

create table if not exists public.swap_cancel_requests (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  expected_status text not null,
  reason text not null,
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  constraint swap_cancel_requests_actor_key_unique
    unique (actor_id, idempotency_key),
  constraint swap_cancel_requests_key_length
    check (char_length(idempotency_key) between 8 and 200),
  constraint swap_cancel_requests_reason_length
    check (char_length(reason) between 1 and 500),
  constraint swap_cancel_requests_expected_status
    check (expected_status in ('pending', 'accepted', 'in_progress'))
);

create index if not exists swap_cancel_requests_swap_created_idx
  on public.swap_cancel_requests (swap_id, created_at desc);

alter table public.swap_cancel_requests enable row level security;
revoke all on table public.swap_cancel_requests
  from public, anon, authenticated;
grant all on table public.swap_cancel_requests to service_role;

create table if not exists public.swap_cancel_effects (
  swap_id uuid primary key references public.swaps(id) on delete cascade,
  cancelled_by uuid not null references auth.users(id) on delete restrict,
  from_status text not null
    check (from_status in ('pending', 'accepted', 'in_progress')),
  reason text not null check (char_length(reason) between 1 and 500),
  idempotency_key text not null,
  reactivated_item_count integer not null default 0
    check (reactivated_item_count between 0 and 2),
  cancellation_counted boolean not null default false,
  applied_at timestamptz not null default now()
);

alter table public.swap_cancel_effects enable row level security;
revoke all on table public.swap_cancel_effects
  from public, anon, authenticated;
grant all on table public.swap_cancel_effects to service_role;

-- Completion confirmations may be cleared only by the bilateral completion
-- authority or by the canonical cancel authority.
create or replace function public.require_swap_completion_authority()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if old.requester_confirmed is not distinct from new.requester_confirmed
     and old.responder_confirmed is not distinct from new.responder_confirmed
     and old.confirmed_by is not distinct from new.confirmed_by then
    return new;
  end if;

  if coalesce(current_setting('swaply.completion_authority', true), '')
     not in ('confirm_swap_completion_v1', 'cancel_swap_v1') then
    raise exception 'Direct completion confirmation updates are forbidden'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke execute on function public.require_swap_completion_authority()
  from public, anon, authenticated;

-- Preserve the C2 direct-update compatibility bridge, but make cancelled
-- reachable only through cancel_swap_v1. This prevents generic transition
-- callers from bypassing cancellation reason and cleanup effects.
create or replace function public.validate_swap_status_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if old.status = new.status then
    return new;
  end if;

  if new.status = 'cancelled'
     and coalesce(current_setting('swaply.cancel_authority', true), '')
       <> 'cancel_swap_v1' then
    raise exception 'Cancellation requires cancel_swap_v1'
      using errcode = '42501';
  end if;

  if coalesce(current_setting('swaply.transition_authority', true), '')
     <> 'apply_swap_transition_v1' then
    if auth.uid() is null then
      raise exception 'Direct privileged swap status updates are forbidden'
        using errcode = '42501';
    end if;

    perform public.apply_swap_transition_v1(
      old.id,
      old.status,
      new.status,
      auth.uid(),
      'direct_update_compat',
      null
    );

    perform set_config('swaply.transition_authority', '', true);
    return null;
  end if;

  if old.status = 'pending'
     and new.status not in ('accepted', 'rejected', 'cancelled', 'expired') then
    raise exception 'Invalid swap transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  if old.status = 'accepted'
     and new.status not in ('in_progress', 'completed', 'cancelled', 'disputed') then
    raise exception 'Invalid swap transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  if old.status = 'in_progress'
     and new.status not in ('completed', 'cancelled', 'disputed') then
    raise exception 'Invalid swap transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  if old.status in ('completed', 'rejected', 'cancelled', 'expired', 'disputed') then
    raise exception 'Terminal swap status cannot transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

revoke execute on function public.validate_swap_status_transition()
  from public, anon, authenticated;

drop trigger if exists validate_swap_transition on public.swaps;
create trigger validate_swap_transition
  before update of status on public.swaps
  for each row execute function public.validate_swap_status_transition();

create or replace function public.cancel_swap_v1(
  p_swap_id uuid,
  p_expected_status text,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_existing public.swap_cancel_requests%rowtype;
  v_reason text := pg_catalog.btrim(coalesce(p_reason, ''));
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
  v_transition jsonb;
  v_response jsonb;
  v_partner_id uuid;
  v_reactivated_item_count integer := 0;
  v_profile_count integer := 0;
  v_cancellation_counted boolean := false;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_swap_id is null
     or p_expected_status not in ('pending', 'accepted', 'in_progress')
     or char_length(v_key) not between 8 and 200
     or char_length(v_reason) > 500 then
    raise exception 'Invalid cancellation input' using errcode = '22023';
  end if;

  if p_expected_status = 'pending' and v_reason = '' then
    v_reason := 'withdrawn';
  end if;

  if p_expected_status in ('accepted', 'in_progress')
     and char_length(v_reason) < 3 then
    raise exception 'Cancellation reason is required after acceptance'
      using errcode = '22023';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'swap_id', p_swap_id,
      'actor_id', v_actor_id,
      'expected_status', p_expected_status,
      'reason', v_reason
    )::text
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor_id::text || ':' || v_key, 0)
  );

  select * into v_existing
  from public.swap_cancel_requests
  where actor_id = v_actor_id
    and idempotency_key = v_key;

  if found then
    if v_existing.swap_id <> p_swap_id
       or v_existing.expected_status <> p_expected_status
       or v_existing.request_hash <> v_hash then
      raise exception 'Idempotency key conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{replayed}',
      'true'::jsonb,
      true
    );
  end if;

  select * into v_swap
  from public.swaps
  where id = p_swap_id
  for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if v_actor_id = v_swap.requester_id then
    v_partner_id := v_swap.responder_id;
  elsif v_actor_id = v_swap.responder_id then
    v_partner_id := v_swap.requester_id;
  else
    raise exception 'Actor is not a swap participant' using errcode = '42501';
  end if;

  if v_swap.status is distinct from p_expected_status then
    raise exception 'Stale swap status: expected %, current %',
      p_expected_status,
      v_swap.status
      using errcode = '40001';
  end if;

  if p_expected_status = 'pending'
     and v_actor_id <> v_swap.requester_id then
    raise exception 'Only the requester may cancel a pending swap'
      using errcode = '42501';
  end if;

  if exists (
    select 1 from public.swap_cancel_effects where swap_id = p_swap_id
  ) then
    raise exception 'Cancellation effects already exist'
      using errcode = '23505';
  end if;

  perform pg_catalog.set_config(
    'swaply.cancel_authority',
    'cancel_swap_v1',
    true
  );

  v_transition := public.apply_swap_transition_v1(
    p_swap_id,
    p_expected_status,
    'cancelled',
    v_actor_id,
    'cancel_authority',
    v_key
  );

  perform pg_catalog.set_config('swaply.cancel_authority', '', true);
  perform pg_catalog.set_config(
    'swaply.completion_authority',
    'cancel_swap_v1',
    true
  );

  update public.swaps
     set cancel_reason = v_reason,
         requester_confirmed = false,
         responder_confirmed = false,
         confirmed_by = '{}'::uuid[],
         updated_at = pg_catalog.clock_timestamp()
   where id = p_swap_id
   returning * into v_swap;

  perform pg_catalog.set_config('swaply.completion_authority', '', true);

  delete from public.swap_completion_confirmations
   where swap_id = p_swap_id;

  update public.items
     set status = 'active',
         is_active = true,
         locked_by = null,
         locked_until = null,
         lock_reason = null,
         updated_at = pg_catalog.clock_timestamp()
   where id in (v_swap.offered_item_id, v_swap.requested_item_id)
     and status = 'reserved'
     and lock_reason = 'swap_active';

  get diagnostics v_reactivated_item_count = row_count;

  if v_swap.conversation_id is not null then
    update public.conversations
       set status = 'cancelled',
           updated_at = pg_catalog.clock_timestamp()
     where id = v_swap.conversation_id
       and status in ('active', 'agreed');
  end if;

  v_cancellation_counted := p_expected_status in ('accepted', 'in_progress');

  if v_cancellation_counted then
    update public.profiles
       set swaps_cancelled = coalesce(swaps_cancelled, 0) + 1,
           updated_at = pg_catalog.clock_timestamp()
     where user_id = v_actor_id;

    get diagnostics v_profile_count = row_count;
    if v_profile_count <> 1 then
      raise exception 'Cancelling participant Profile is required'
        using errcode = 'P0002';
    end if;

    perform public.calculate_trust_score(v_actor_id);
  end if;

  insert into public.swap_cancel_effects (
    swap_id,
    cancelled_by,
    from_status,
    reason,
    idempotency_key,
    reactivated_item_count,
    cancellation_counted
  ) values (
    p_swap_id,
    v_actor_id,
    p_expected_status,
    v_reason,
    v_key,
    v_reactivated_item_count,
    v_cancellation_counted
  );

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    data,
    priority,
    source_type,
    source_id,
    dedupe_key,
    is_read,
    read
  ) values
    (
      v_actor_id,
      'swap_cancelled',
      'Exchange cancelled',
      'The exchange was cancelled.',
      pg_catalog.jsonb_build_object(
        'swap_id', p_swap_id,
        'event', 'swap_cancelled',
        'reason', v_reason,
        'cancelled_by', v_actor_id
      ),
      'warning',
      'swap',
      p_swap_id,
      'swap:' || p_swap_id::text || ':cancelled:' || v_actor_id::text,
      false,
      false
    ),
    (
      v_partner_id,
      'swap_cancelled',
      'Exchange cancelled',
      'The other participant cancelled the exchange.',
      pg_catalog.jsonb_build_object(
        'swap_id', p_swap_id,
        'event', 'swap_cancelled',
        'reason', v_reason,
        'cancelled_by', v_actor_id
      ),
      'warning',
      'swap',
      p_swap_id,
      'swap:' || p_swap_id::text || ':cancelled:' || v_partner_id::text,
      false,
      false
    )
  on conflict (dedupe_key) where dedupe_key is not null do nothing;

  insert into public.swap_events (
    swap_id,
    actor_id,
    action,
    from_status,
    to_status,
    metadata
  ) values (
    p_swap_id,
    v_actor_id,
    'cancel_effects_applied',
    p_expected_status,
    'cancelled',
    pg_catalog.jsonb_build_object(
      'authority', 'cancel_swap_v1',
      'idempotency_key', v_key,
      'reason', v_reason,
      'reactivated_item_count', v_reactivated_item_count,
      'cancellation_counted', v_cancellation_counted,
      'notification_count', 2
    )
  );

  v_response := pg_catalog.jsonb_build_object(
    'swap', pg_catalog.to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', v_key,
    'reason', v_reason,
    'reactivated_item_count', v_reactivated_item_count,
    'cancellation_counted', v_cancellation_counted,
    'transition', v_transition
  );

  insert into public.swap_cancel_requests (
    swap_id,
    actor_id,
    idempotency_key,
    expected_status,
    reason,
    request_hash,
    response
  ) values (
    p_swap_id,
    v_actor_id,
    v_key,
    p_expected_status,
    v_reason,
    v_hash,
    v_response
  );

  return v_response;
exception
  when unique_violation then
    select * into v_existing
    from public.swap_cancel_requests
    where actor_id = v_actor_id
      and idempotency_key = v_key;

    if not found
       or v_existing.swap_id <> p_swap_id
       or v_existing.expected_status <> p_expected_status
       or v_existing.request_hash <> v_hash then
      raise exception 'Idempotency key conflict' using errcode = '23505';
    end if;

    return pg_catalog.jsonb_set(
      v_existing.response,
      '{replayed}',
      'true'::jsonb,
      true
    );
end;
$function$;

revoke execute on function public.cancel_swap_v1(uuid, text, text, text)
  from public, anon, service_role;
grant execute on function public.cancel_swap_v1(uuid, text, text, text)
  to authenticated;

comment on table public.swap_cancel_requests is
  'Batch 63.1 private idempotency registry for canonical participant cancellation commands.';
comment on table public.swap_cancel_effects is
  'Batch 63.1 exactly-once cancellation cleanup, counter and notification effect registry.';
comment on function public.cancel_swap_v1(uuid, text, text, text) is
  'Batch 63.1 participant-only atomic cancellation authority with CAS, reason, cleanup, trust and idempotent replay.';

commit;
