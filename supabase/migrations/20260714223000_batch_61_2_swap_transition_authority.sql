begin;

-- Batch 61.2 makes one internal database function the only authority allowed to
-- change the global public.swaps.status value. The function performs participant
-- authorization, expected-state compare-and-swap and idempotent replay handling
-- in the same transaction as the status update and audit event.

create table if not exists public.swap_transition_requests (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  actor_role text not null check (actor_role in ('requester', 'responder')),
  idempotency_key text not null check (
    char_length(idempotency_key) between 8 and 200
  ),
  expected_status text not null,
  requested_status text not null,
  result jsonb not null,
  replay_count integer not null default 0 check (replay_count >= 0),
  created_at timestamptz not null default now(),
  last_replayed_at timestamptz,
  constraint swap_transition_requests_unique_key
    unique (swap_id, actor_id, idempotency_key)
);

create index if not exists swap_transition_requests_swap_created_idx
  on public.swap_transition_requests (swap_id, created_at desc);

alter table public.swap_transition_requests enable row level security;

revoke all on table public.swap_transition_requests
  from public, anon, authenticated;
grant all on table public.swap_transition_requests to service_role;

create or replace function public.require_swap_transition_authority()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if old.status is distinct from new.status
     and coalesce(
       current_setting('swaply.swap_transition_authority', true),
       ''
     ) <> 'on' then
    raise exception 'Direct swap status updates are forbidden'
      using
        errcode = '42501',
        detail = 'SWAP_STATUS_WRITE_AUTHORITY_REQUIRED';
  end if;

  return new;
end;
$function$;

revoke execute on function public.require_swap_transition_authority()
  from public, anon, authenticated;

drop trigger if exists aaa_require_swap_transition_authority
  on public.swaps;

create trigger aaa_require_swap_transition_authority
  before update of status on public.swaps
  for each row
  execute function public.require_swap_transition_authority();

-- A new swap must always enter the lifecycle at pending. Participants retain
-- their existing ability to create a proposal, but cannot insert a terminal or
-- already-accepted row and bypass the transition authority.
drop policy if exists insert_own_swaps on public.swaps;

create policy insert_own_swaps on public.swaps
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
  );

create or replace function public.transition_swap_status_authoritative(
  p_swap_id uuid,
  p_actor_id uuid,
  p_expected_status text,
  p_to_status text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_swap public.swaps%rowtype;
  v_existing public.swap_transition_requests%rowtype;
  v_actor_role text;
  v_result jsonb;
begin
  if p_swap_id is null
     or p_actor_id is null
     or p_expected_status is null
     or p_to_status is null
     or p_idempotency_key is null
     or char_length(btrim(p_idempotency_key)) not between 8 and 200 then
    return jsonb_build_object(
      'outcome', 'invalid_request',
      'replayed', false
    );
  end if;

  if p_expected_status not in (
       'pending', 'accepted', 'in_progress', 'completed',
       'rejected', 'cancelled', 'expired', 'disputed'
     )
     or p_to_status not in (
       'pending', 'accepted', 'in_progress', 'completed',
       'rejected', 'cancelled', 'expired', 'disputed'
     ) then
    return jsonb_build_object(
      'outcome', 'invalid_request',
      'replayed', false
    );
  end if;

  select request.*
    into v_existing
  from public.swap_transition_requests as request
  where request.swap_id = p_swap_id
    and request.actor_id = p_actor_id
    and request.idempotency_key = btrim(p_idempotency_key);

  if found then
    if v_existing.expected_status <> p_expected_status
       or v_existing.requested_status <> p_to_status then
      return jsonb_build_object(
        'outcome', 'idempotency_conflict',
        'replayed', false
      );
    end if;

    update public.swap_transition_requests
      set replay_count = replay_count + 1,
          last_replayed_at = clock_timestamp()
    where id = v_existing.id;

    return v_existing.result || jsonb_build_object(
      'outcome', 'replayed',
      'replayed', true
    );
  end if;

  select swap.*
    into v_swap
  from public.swaps as swap
  where swap.id = p_swap_id
  for update;

  if not found then
    return jsonb_build_object(
      'outcome', 'not_found',
      'replayed', false
    );
  end if;

  -- Recheck after acquiring the row lock. A concurrent call with the same key
  -- may have completed while this transaction was waiting.
  select request.*
    into v_existing
  from public.swap_transition_requests as request
  where request.swap_id = p_swap_id
    and request.actor_id = p_actor_id
    and request.idempotency_key = btrim(p_idempotency_key);

  if found then
    if v_existing.expected_status <> p_expected_status
       or v_existing.requested_status <> p_to_status then
      return jsonb_build_object(
        'outcome', 'idempotency_conflict',
        'replayed', false
      );
    end if;

    update public.swap_transition_requests
      set replay_count = replay_count + 1,
          last_replayed_at = clock_timestamp()
    where id = v_existing.id;

    return v_existing.result || jsonb_build_object(
      'outcome', 'replayed',
      'replayed', true
    );
  end if;

  if v_swap.requester_id = p_actor_id then
    v_actor_role := 'requester';
  elsif v_swap.responder_id = p_actor_id then
    v_actor_role := 'responder';
  else
    return jsonb_build_object(
      'outcome', 'not_participant',
      'replayed', false
    );
  end if;

  if v_swap.status <> p_expected_status then
    return jsonb_build_object(
      'outcome', 'stale_state',
      'replayed', false,
      'expectedStatus', p_expected_status,
      'currentStatus', v_swap.status
    );
  end if;

  if not (
    (p_expected_status = 'pending'
      and p_to_status in ('accepted', 'rejected', 'cancelled', 'expired'))
    or (p_expected_status = 'accepted'
      and p_to_status in ('in_progress', 'completed', 'cancelled', 'disputed'))
    or (p_expected_status = 'in_progress'
      and p_to_status in ('completed', 'cancelled', 'disputed'))
  ) then
    return jsonb_build_object(
      'outcome', 'invalid_transition',
      'replayed', false,
      'fromStatus', p_expected_status,
      'toStatus', p_to_status
    );
  end if;

  perform set_config('swaply.swap_transition_authority', 'on', true);

  update public.swaps
    set status = p_to_status,
        completed_at = case
          when p_to_status = 'completed' then coalesce(completed_at, clock_timestamp())
          else completed_at
        end,
        updated_at = clock_timestamp()
  where id = p_swap_id
    and status = p_expected_status
  returning * into v_swap;

  if not found then
    return jsonb_build_object(
      'outcome', 'stale_state',
      'replayed', false,
      'expectedStatus', p_expected_status
    );
  end if;

  if p_to_status = 'accepted' then
    update public.swap_bundles
      set locked = true,
          locked_at = coalesce(locked_at, clock_timestamp())
    where swap_id = p_swap_id
      and locked = false;

    insert into public.swap_events (
      swap_id,
      actor_id,
      action,
      metadata
    ) values (
      p_swap_id,
      p_actor_id,
      'bundle_locked',
      jsonb_build_object(
        'reason', 'swap_accepted',
        'idempotencyKey', btrim(p_idempotency_key)
      )
    );
  end if;

  insert into public.swap_events (
    swap_id,
    actor_id,
    action,
    from_status,
    to_status,
    metadata
  ) values (
    p_swap_id,
    p_actor_id,
    'status_transition',
    p_expected_status,
    p_to_status,
    jsonb_build_object(
      'actorRole', v_actor_role,
      'idempotencyKey', btrim(p_idempotency_key),
      'authorityVersion', 'batch-61.2'
    )
  );

  v_result := jsonb_build_object(
    'outcome', 'applied',
    'replayed', false,
    'actorRole', v_actor_role,
    'fromStatus', p_expected_status,
    'toStatus', p_to_status,
    'swap', to_jsonb(v_swap)
  );

  insert into public.swap_transition_requests (
    swap_id,
    actor_id,
    actor_role,
    idempotency_key,
    expected_status,
    requested_status,
    result
  ) values (
    p_swap_id,
    p_actor_id,
    v_actor_role,
    btrim(p_idempotency_key),
    p_expected_status,
    p_to_status,
    v_result
  );

  return v_result;
end;
$function$;

revoke execute on function public.transition_swap_status_authoritative(
  uuid,
  uuid,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.transition_swap_status_authoritative(
  uuid,
  uuid,
  text,
  text,
  text
) to service_role;

comment on table public.swap_transition_requests is
  'Batch 61.2 internal idempotency ledger for authoritative Swap/Exchange status transitions.';

comment on function public.require_swap_transition_authority() is
  'Batch 61.2 guard rejecting direct public.swaps.status updates.';

comment on function public.transition_swap_status_authoritative(
  uuid,
  uuid,
  text,
  text,
  text
) is
  'Batch 61.2 service-role-only participant authorization, CAS and idempotent status transition authority.';

commit;
