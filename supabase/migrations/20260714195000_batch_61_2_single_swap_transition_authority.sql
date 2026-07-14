begin;

-- Batch 61.2: every global Swap/Exchange status change must pass through
-- one atomic server-side authority with compare-and-set and idempotency.

create table if not exists public.swap_transition_requests (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  expected_status text not null,
  to_status text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  constraint swap_transition_requests_key_length
    check (char_length(idempotency_key) between 8 and 200),
  constraint swap_transition_requests_actor_key_unique
    unique (actor_id, idempotency_key)
);

alter table public.swap_transition_requests enable row level security;
revoke all on table public.swap_transition_requests from public, anon, authenticated;
grant all on table public.swap_transition_requests to service_role;

create index if not exists swap_transition_requests_swap_created_idx
  on public.swap_transition_requests (swap_id, created_at desc);

create or replace function public.apply_swap_transition_v1(
  p_swap_id uuid,
  p_expected_status text,
  p_to_status text,
  p_actor_id uuid,
  p_source text,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_swap public.swaps%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_allowed boolean := false;
begin
  select *
    into v_swap
    from public.swaps
   where id = p_swap_id
   for update;

  if not found then
    raise exception 'Swap not found'
      using errcode = 'P0002';
  end if;

  if v_swap.status is distinct from p_expected_status then
    raise exception 'Stale swap status: expected %, current %', p_expected_status, v_swap.status
      using errcode = '40001';
  end if;

  if p_actor_id is null then
    if p_source <> 'system_expiry'
       or p_expected_status <> 'pending'
       or p_to_status <> 'expired' then
      raise exception 'System transition is not permitted'
        using errcode = '42501';
    end if;
  else
    if p_actor_id <> v_swap.requester_id and p_actor_id <> v_swap.responder_id then
      raise exception 'Actor is not a swap participant'
        using errcode = '42501';
    end if;

    if p_expected_status = 'pending'
       and p_to_status in ('accepted', 'rejected')
       and p_actor_id <> v_swap.responder_id then
      raise exception 'Only the responder may accept or reject a pending swap'
        using errcode = '42501';
    end if;

    if p_expected_status = 'pending'
       and p_to_status = 'cancelled'
       and p_actor_id <> v_swap.requester_id then
      raise exception 'Only the requester may cancel a pending swap'
        using errcode = '42501';
    end if;

    if p_to_status = 'expired' then
      raise exception 'Expiry is a system transition'
        using errcode = '42501';
    end if;
  end if;

  v_allowed := case p_expected_status
    when 'pending' then p_to_status in ('accepted', 'rejected', 'cancelled', 'expired')
    when 'accepted' then p_to_status in ('in_progress', 'completed', 'cancelled', 'disputed')
    when 'in_progress' then p_to_status in ('completed', 'cancelled', 'disputed')
    else false
  end;

  if not v_allowed then
    raise exception 'Invalid swap transition: % -> %', p_expected_status, p_to_status
      using errcode = '23514';
  end if;

  perform pg_catalog.set_config(
    'swaply.transition_authority',
    'apply_swap_transition_v1',
    true
  );

  update public.swaps
     set status = p_to_status,
         completed_at = case
           when p_to_status = 'completed' then coalesce(completed_at, v_now)
           else completed_at
         end,
         updated_at = v_now
   where id = p_swap_id
   returning * into v_swap;

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
      'authority', 'apply_swap_transition_v1',
      'source', p_source,
      'idempotency_key', p_idempotency_key
    )
  );

  return jsonb_build_object(
    'swap', to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', p_idempotency_key
  );
end;
$function$;

revoke execute on function public.apply_swap_transition_v1(uuid, text, text, uuid, text, text)
  from public, anon, authenticated, service_role;

create or replace function public.transition_swap_v1(
  p_swap_id uuid,
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
  v_actor_id uuid := auth.uid();
  v_existing public.swap_transition_requests%rowtype;
  v_response jsonb;
begin
  if v_actor_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if p_swap_id is null
     or p_expected_status is null
     or p_to_status is null
     or p_idempotency_key is null
     or char_length(trim(p_idempotency_key)) not between 8 and 200 then
    raise exception 'Invalid transition input'
      using errcode = '22023';
  end if;

  select *
    into v_existing
    from public.swap_transition_requests
   where actor_id = v_actor_id
     and idempotency_key = trim(p_idempotency_key);

  if found then
    if v_existing.swap_id <> p_swap_id
       or v_existing.expected_status <> p_expected_status
       or v_existing.to_status <> p_to_status then
      raise exception 'Idempotency key was already used for a different transition'
        using errcode = '22023';
    end if;

    return jsonb_set(v_existing.response, '{replayed}', 'true'::jsonb, true);
  end if;

  -- The inner authority locks the swap row. Recheck the request after the lock
  -- so concurrent retries with the same key return the stored response.
  perform 1
    from public.swaps
   where id = p_swap_id
   for update;

  select *
    into v_existing
    from public.swap_transition_requests
   where actor_id = v_actor_id
     and idempotency_key = trim(p_idempotency_key);

  if found then
    if v_existing.swap_id <> p_swap_id
       or v_existing.expected_status <> p_expected_status
       or v_existing.to_status <> p_to_status then
      raise exception 'Idempotency key was already used for a different transition'
        using errcode = '22023';
    end if;

    return jsonb_set(v_existing.response, '{replayed}', 'true'::jsonb, true);
  end if;

  v_response := public.apply_swap_transition_v1(
    p_swap_id,
    p_expected_status,
    p_to_status,
    v_actor_id,
    'authenticated_rpc',
    trim(p_idempotency_key)
  );

  insert into public.swap_transition_requests (
    swap_id,
    actor_id,
    idempotency_key,
    expected_status,
    to_status,
    response
  ) values (
    p_swap_id,
    v_actor_id,
    trim(p_idempotency_key),
    p_expected_status,
    p_to_status,
    v_response
  );

  return v_response;
exception
  when unique_violation then
    select *
      into v_existing
      from public.swap_transition_requests
     where actor_id = v_actor_id
       and idempotency_key = trim(p_idempotency_key);

    if not found
       or v_existing.swap_id <> p_swap_id
       or v_existing.expected_status <> p_expected_status
       or v_existing.to_status <> p_to_status then
      raise exception 'Idempotency key conflict'
        using errcode = '22023';
    end if;

    return jsonb_set(v_existing.response, '{replayed}', 'true'::jsonb, true);
end;
$function$;

revoke execute on function public.transition_swap_v1(uuid, text, text, text)
  from public, anon;
grant execute on function public.transition_swap_v1(uuid, text, text, text)
  to authenticated;

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

  if coalesce(current_setting('swaply.transition_authority', true), '')
     <> 'apply_swap_transition_v1' then
    raise exception 'Direct swap status updates are forbidden; use transition_swap_v1'
      using errcode = '42501';
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

create or replace function public.expire_old_swaps()
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_swap record;
  v_count integer := 0;
begin
  for v_swap in
    select id
      from public.swaps
     where status = 'pending'
       and (
         (expires_at is not null and expires_at < now())
         or
         (expires_at is null and created_at < now() - interval '7 days')
       )
     for update skip locked
  loop
    perform public.apply_swap_transition_v1(
      v_swap.id,
      'pending',
      'expired',
      null,
      'system_expiry',
      null
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

comment on function public.transition_swap_v1(uuid, text, text, text) is
  'Batch 61.2 authenticated atomic Swap/Exchange transition authority with CAS and idempotency.';
comment on function public.apply_swap_transition_v1(uuid, text, text, uuid, text, text) is
  'Batch 61.2 internal transition primitive. Execute privilege is intentionally revoked.';
comment on table public.swap_transition_requests is
  'Batch 61.2 private idempotency registry for authenticated Swap/Exchange transitions.';

commit;
