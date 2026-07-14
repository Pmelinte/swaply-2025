begin;

-- A closed duplicate branch reintroduced a second transition authority after
-- the reviewed reconciliation at 20260714202934. Restore the canonical PR #462
-- contract without changing Swap rows.

drop trigger if exists aaa_require_swap_transition_authority on public.swaps;
drop function if exists public.require_swap_transition_authority();
drop function if exists public.transition_swap_status_authoritative(
  uuid,
  uuid,
  text,
  text,
  text
);
drop table if exists public.swap_transition_authority_config;

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
    raise exception 'Stale swap status: expected %, current %',
      p_expected_status,
      v_swap.status
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
    if p_actor_id <> v_swap.requester_id
       and p_actor_id <> v_swap.responder_id then
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
    when 'pending' then p_to_status in (
      'accepted',
      'rejected',
      'cancelled',
      'expired'
    )
    when 'accepted' then p_to_status in (
      'in_progress',
      'completed',
      'cancelled',
      'disputed'
    )
    when 'in_progress' then p_to_status in (
      'completed',
      'cancelled',
      'disputed'
    )
    else false
  end;

  if not v_allowed then
    raise exception 'Invalid swap transition: % -> %',
      p_expected_status,
      p_to_status
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

  -- The marker is needed only during the protected UPDATE. Clear it before any
  -- later SQL in the transaction so a direct write cannot inherit authority.
  perform pg_catalog.set_config('swaply.transition_authority', '', true);

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

revoke execute on function public.apply_swap_transition_v1(
  uuid,
  text,
  text,
  uuid,
  text,
  text
) from public, anon, authenticated, service_role;

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

revoke execute on function public.transition_swap_v1(
  uuid,
  text,
  text,
  text
) from public, anon;
grant execute on function public.transition_swap_v1(
  uuid,
  text,
  text,
  text
) to authenticated;

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
    raise exception 'Terminal swap status cannot transition: % -> %',
      old.status,
      new.status
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

create or replace function public.require_swap_identity_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if old.requester_id is distinct from new.requester_id
     or old.responder_id is distinct from new.responder_id
     or old.offered_item_id is distinct from new.offered_item_id
     or old.requested_item_id is distinct from new.requested_item_id then
    raise exception 'Swap participant and item identity is immutable'
      using
        errcode = '42501',
        detail = 'SWAP_IDENTITY_IMMUTABLE';
  end if;

  return new;
end;
$function$;

revoke execute on function public.require_swap_identity_immutable()
  from public, anon, authenticated;

drop trigger if exists aab_require_swap_identity_immutable on public.swaps;
create trigger aab_require_swap_identity_immutable
  before update of requester_id, responder_id, offered_item_id, requested_item_id
  on public.swaps
  for each row
  execute function public.require_swap_identity_immutable();

drop policy if exists insert_own_swaps on public.swaps;
create policy insert_own_swaps on public.swaps
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
  );

comment on function public.transition_swap_v1(
  uuid,
  text,
  text,
  text
) is
  'Batch 61.2 authenticated atomic Swap/Exchange transition authority with CAS and idempotency.';
comment on function public.apply_swap_transition_v1(
  uuid,
  text,
  text,
  uuid,
  text,
  text
) is
  'Batch 61.2 internal transition primitive with immediate transaction-local marker reset.';
comment on table public.swap_transition_requests is
  'Batch 61.2 private idempotency registry for transition_swap_v1.';
comment on function public.require_swap_identity_immutable() is
  'Batch 61.2 guard freezing requester, responder and item identity after Swap creation.';

commit;
