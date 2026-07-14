begin;

-- Batch 61.2 consolidation.
--
-- `apply_swap_transition_v1` is the only function that writes public.swaps.status.
-- The service API wrapper, authenticated RPC, direct-update compatibility bridge
-- and system expiry path all delegate to this one writer.

create table if not exists public.swap_transition_requests (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  expected_status text not null,
  to_status text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  constraint swap_transition_requests_actor_key_unique
    unique (actor_id, idempotency_key),
  constraint swap_transition_requests_key_length
    check (char_length(idempotency_key) between 8 and 200)
);

create index if not exists swap_transition_requests_swap_created_idx
  on public.swap_transition_requests (swap_id, created_at desc);

alter table public.swap_transition_requests enable row level security;
revoke all on table public.swap_transition_requests
  from public, anon, authenticated;
grant all on table public.swap_transition_requests to service_role;

create table if not exists public.swap_transition_authority_config (
  singleton boolean primary key default true check (singleton),
  enforced boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.swap_transition_authority_config (singleton, enforced)
values (true, false)
on conflict (singleton) do nothing;

alter table public.swap_transition_authority_config enable row level security;
revoke all on table public.swap_transition_authority_config
  from public, anon, authenticated;
grant all on table public.swap_transition_authority_config to service_role;

create or replace function public.require_swap_transition_authority()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_enforced boolean := false;
begin
  if old.status is distinct from new.status
     and coalesce(
       current_setting('swaply.swap_transition_authority', true),
       ''
     ) <> 'on' then
    select config.enforced
      into v_enforced
    from public.swap_transition_authority_config as config
    where config.singleton = true;

    if coalesce(v_enforced, false) then
      raise exception 'Direct swap status updates are forbidden'
        using
          errcode = '42501',
          detail = 'SWAP_STATUS_WRITE_AUTHORITY_REQUIRED';
    end if;
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

drop trigger if exists aab_require_swap_identity_immutable
  on public.swaps;
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
  v_actor_role text;
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
    v_actor_role := 'system';
    if p_source <> 'system_expiry'
       or p_expected_status <> 'pending'
       or p_to_status <> 'expired' then
      raise exception 'System transition is not permitted'
        using errcode = '42501';
    end if;
  else
    if p_actor_id = v_swap.requester_id then
      v_actor_role := 'requester';
    elsif p_actor_id = v_swap.responder_id then
      v_actor_role := 'responder';
    else
      raise exception 'Actor is not a swap participant'
        using errcode = '42501';
    end if;

    if p_expected_status = 'pending'
       and p_to_status in ('accepted', 'rejected')
       and v_actor_role <> 'responder' then
      raise exception 'Only the responder may accept or reject a pending swap'
        using errcode = '42501';
    end if;

    if p_expected_status = 'pending'
       and p_to_status = 'cancelled'
       and v_actor_role <> 'requester' then
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
      'accepted', 'rejected', 'cancelled', 'expired'
    )
    when 'accepted' then p_to_status in (
      'in_progress', 'completed', 'cancelled', 'disputed'
    )
    when 'in_progress' then p_to_status in (
      'completed', 'cancelled', 'disputed'
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
  perform pg_catalog.set_config(
    'swaply.swap_transition_authority',
    'on',
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
    and status = p_expected_status
  returning * into v_swap;

  if not found then
    raise exception 'Stale swap status: expected %', p_expected_status
      using errcode = '40001';
  end if;

  perform pg_catalog.set_config('swaply.transition_authority', '', true);
  perform pg_catalog.set_config('swaply.swap_transition_authority', '', true);

  if p_to_status = 'accepted' then
    update public.swap_bundles
    set locked = true,
        locked_at = coalesce(locked_at, v_now)
    where swap_id = p_swap_id
      and locked = false;
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
      'authority', 'apply_swap_transition_v1',
      'authorityVersion', 'batch-61.2',
      'actorRole', v_actor_role,
      'source', p_source,
      'idempotencyKey', p_idempotency_key
    )
  );

  return jsonb_build_object(
    'outcome', 'applied',
    'replayed', false,
    'actorRole', v_actor_role,
    'fromStatus', p_expected_status,
    'toStatus', p_to_status,
    'swap', to_jsonb(v_swap)
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
) from public, anon, authenticated;
grant execute on function public.apply_swap_transition_v1(
  uuid,
  text,
  text,
  uuid,
  text,
  text
) to service_role;

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
  v_existing public.swap_transition_requests%rowtype;
  v_response jsonb;
  v_current_status text;
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_actor_id::text || ':' || btrim(p_idempotency_key),
      0
    )
  );

  select *
    into v_existing
  from public.swap_transition_requests
  where actor_id = p_actor_id
    and idempotency_key = btrim(p_idempotency_key);

  if found then
    if v_existing.swap_id <> p_swap_id
       or v_existing.expected_status <> p_expected_status
       or v_existing.to_status <> p_to_status then
      return jsonb_build_object(
        'outcome', 'idempotency_conflict',
        'replayed', false
      );
    end if;

    return v_existing.response || jsonb_build_object(
      'outcome', 'replayed',
      'replayed', true
    );
  end if;

  select status
    into v_current_status
  from public.swaps
  where id = p_swap_id
  for update;

  if not found then
    return jsonb_build_object(
      'outcome', 'not_found',
      'replayed', false
    );
  end if;

  if v_current_status <> p_expected_status then
    return jsonb_build_object(
      'outcome', 'stale_state',
      'replayed', false,
      'expectedStatus', p_expected_status,
      'currentStatus', v_current_status
    );
  end if;

  begin
    v_response := public.apply_swap_transition_v1(
      p_swap_id,
      p_expected_status,
      p_to_status,
      p_actor_id,
      'server_api',
      btrim(p_idempotency_key)
    );
  exception
    when sqlstate 'P0002' then
      return jsonb_build_object(
        'outcome', 'not_found',
        'replayed', false
      );
    when sqlstate '40001' then
      select status into v_current_status
      from public.swaps
      where id = p_swap_id;
      return jsonb_build_object(
        'outcome', 'stale_state',
        'replayed', false,
        'expectedStatus', p_expected_status,
        'currentStatus', v_current_status
      );
    when sqlstate '42501' then
      return jsonb_build_object(
        'outcome', 'not_authorized',
        'replayed', false,
        'reason', sqlerrm
      );
    when sqlstate '23514' then
      return jsonb_build_object(
        'outcome', 'invalid_transition',
        'replayed', false,
        'fromStatus', p_expected_status,
        'toStatus', p_to_status
      );
  end;

  insert into public.swap_transition_requests (
    swap_id,
    actor_id,
    idempotency_key,
    expected_status,
    to_status,
    response
  ) values (
    p_swap_id,
    p_actor_id,
    btrim(p_idempotency_key),
    p_expected_status,
    p_to_status,
    v_response
  );

  return v_response;
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
begin
  if v_actor_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  return public.transition_swap_status_authoritative(
    p_swap_id,
    v_actor_id,
    p_expected_status,
    p_to_status,
    p_idempotency_key
  );
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
) to authenticated, service_role;

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
      'swap-status:v1:' || v_swap.id::text || ':pending:expired:system'
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;

revoke execute on function public.expire_old_swaps()
  from public, anon, authenticated;
grant execute on function public.expire_old_swaps()
  to service_role;

create or replace function public.validate_swap_status_transition()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public'
as $function$
declare
  v_enforced boolean := false;
  v_result jsonb;
  v_key text;
begin
  if old.status = new.status then
    return new;
  end if;

  if coalesce(current_setting('swaply.transition_authority', true), '')
       = 'apply_swap_transition_v1'
     or coalesce(
       current_setting('swaply.swap_transition_authority', true),
       ''
     ) = 'on' then
    return new;
  end if;

  select config.enforced
    into v_enforced
  from public.swap_transition_authority_config as config
  where config.singleton = true;

  if auth.uid() is null then
    if coalesce(v_enforced, false) then
      raise exception 'Direct privileged swap status updates are forbidden'
        using errcode = '42501';
    end if;

    if old.status = 'pending'
       and new.status not in ('accepted', 'rejected', 'cancelled', 'expired') then
      raise exception 'Invalid swap transition: % -> %', old.status, new.status
        using errcode = '23514';
    elsif old.status = 'accepted'
       and new.status not in ('in_progress', 'completed', 'cancelled', 'disputed') then
      raise exception 'Invalid swap transition: % -> %', old.status, new.status
        using errcode = '23514';
    elsif old.status = 'in_progress'
       and new.status not in ('completed', 'cancelled', 'disputed') then
      raise exception 'Invalid swap transition: % -> %', old.status, new.status
        using errcode = '23514';
    elsif old.status in ('completed', 'rejected', 'cancelled', 'expired', 'disputed') then
      raise exception 'Terminal swap status cannot transition: % -> %',
        old.status,
        new.status
        using errcode = '23514';
    end if;

    return new;
  end if;

  v_key := 'direct-update:v1:'
    || old.id::text || ':'
    || old.status || ':'
    || new.status || ':'
    || auth.uid()::text;

  v_result := public.transition_swap_status_authoritative(
    old.id,
    auth.uid(),
    old.status,
    new.status,
    v_key
  );

  if v_result->>'outcome' in ('applied', 'replayed') then
    return null;
  elsif v_result->>'outcome' = 'stale_state' then
    raise exception 'Stale swap status'
      using errcode = '40001';
  elsif v_result->>'outcome' in ('not_authorized', 'not_participant') then
    raise exception 'Actor is not authorized for this transition'
      using errcode = '42501';
  elsif v_result->>'outcome' = 'invalid_transition' then
    raise exception 'Invalid swap transition: % -> %', old.status, new.status
      using errcode = '23514';
  else
    raise exception 'Swap transition failed: %', v_result->>'outcome'
      using errcode = '22023';
  end if;
end;
$function$;

revoke execute on function public.validate_swap_status_transition()
  from public, anon, authenticated;

drop trigger if exists validate_swap_transition on public.swaps;
create trigger validate_swap_transition
  before update of status on public.swaps
  for each row
  execute function public.validate_swap_status_transition();

comment on function public.apply_swap_transition_v1(
  uuid,
  text,
  text,
  uuid,
  text,
  text
) is
  'Batch 61.2 sole database writer for global Swap/Exchange status transitions.';

comment on function public.transition_swap_status_authoritative(
  uuid,
  uuid,
  text,
  text,
  text
) is
  'Batch 61.2 service-role entrypoint adding CAS outcomes and idempotent replay around the single writer.';

comment on function public.transition_swap_v1(
  uuid,
  text,
  text,
  text
) is
  'Batch 61.2 authenticated compatibility entrypoint delegating to the single writer.';

comment on table public.swap_transition_requests is
  'Batch 61.2 service-only idempotency ledger for participant transition commands.';

comment on table public.swap_transition_authority_config is
  'Batch 61.2 staged enforcement switch; activate only after the merge deployment is READY.';

commit;
