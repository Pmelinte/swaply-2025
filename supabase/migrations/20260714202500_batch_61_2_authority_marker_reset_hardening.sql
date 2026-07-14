begin;

-- Hardening found by the authenticated rollback probe: the transaction-local
-- authority marker must be cleared immediately after the protected UPDATE.
-- Otherwise a later direct write in the same transaction could inherit it.

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

  -- Clear before any subsequent SQL in the same transaction. The trigger only
  -- needs the marker during the protected UPDATE itself.
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

revoke execute on function public.apply_swap_transition_v1(uuid, text, text, uuid, text, text)
  from public, anon, authenticated, service_role;

comment on function public.apply_swap_transition_v1(uuid, text, text, uuid, text, text) is
  'Batch 61.2 internal transition primitive with immediate transaction-local marker reset.';

commit;
