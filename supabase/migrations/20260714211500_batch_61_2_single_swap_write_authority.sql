begin;

-- Batch 61.2: one atomic server-side write authority for Swap lifecycle.
-- The function owns authorization, transition validation, CAS, idempotency,
-- bundle locking and event persistence in one database transaction.

alter table public.swaps
  add column if not exists lifecycle_version bigint not null default 0;

create table if not exists public.swap_transition_requests (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  expected_version bigint not null,
  from_status text not null,
  to_status text not null,
  resulting_version bigint not null,
  created_at timestamptz not null default now(),
  unique (actor_id, idempotency_key)
);

alter table public.swap_transition_requests enable row level security;

revoke all on table public.swap_transition_requests from anon, authenticated;

create index if not exists swap_transition_requests_swap_created_idx
  on public.swap_transition_requests (swap_id, created_at desc);

create or replace function public.validate_swap_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if old.status = new.status then
    return new;
  end if;

  if coalesce(current_setting('swaply.lifecycle_write_authorized', true), '') <> 'on' then
    raise exception 'Swap status writes must use transition_swap_lifecycle()'
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

create or replace function public.transition_swap_lifecycle(
  p_swap_id uuid,
  p_to_status text,
  p_expected_version bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_existing public.swap_transition_requests%rowtype;
  v_result public.swaps%rowtype;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_idempotency_key is null or length(btrim(p_idempotency_key)) < 8 then
    raise exception 'A stable idempotency key of at least 8 characters is required'
      using errcode = '22023';
  end if;

  select * into v_existing
  from public.swap_transition_requests
  where actor_id = v_actor_id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.swap_id <> p_swap_id
       or v_existing.to_status <> p_to_status
       or v_existing.expected_version <> p_expected_version then
      raise exception 'Idempotency key reused with different transition input'
        using errcode = '22023';
    end if;

    select * into v_result from public.swaps where id = v_existing.swap_id;
    return jsonb_build_object(
      'swap', to_jsonb(v_result),
      'idempotent_replay', true,
      'from_status', v_existing.from_status,
      'to_status', v_existing.to_status,
      'resulting_version', v_existing.resulting_version
    );
  end if;

  select * into v_swap
  from public.swaps
  where id = p_swap_id
  for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if v_actor_id <> v_swap.requester_id and v_actor_id <> v_swap.responder_id then
    raise exception 'Actor is not a swap participant' using errcode = '42501';
  end if;

  if v_swap.lifecycle_version <> p_expected_version then
    raise exception 'Stale swap lifecycle version: expected %, current %',
      p_expected_version, v_swap.lifecycle_version
      using errcode = '40001';
  end if;

  perform set_config('swaply.lifecycle_write_authorized', 'on', true);

  update public.swaps
  set status = p_to_status,
      lifecycle_version = lifecycle_version + 1,
      updated_at = now(),
      accepted_at = case when p_to_status = 'accepted' then coalesce(accepted_at, now()) else accepted_at end,
      rejected_at = case when p_to_status = 'rejected' then coalesce(rejected_at, now()) else rejected_at end
  where id = p_swap_id
    and lifecycle_version = p_expected_version
  returning * into v_result;

  if not found then
    raise exception 'Concurrent swap lifecycle update detected' using errcode = '40001';
  end if;

  if p_to_status = 'accepted' then
    update public.swap_bundles
    set locked = true,
        locked_at = coalesce(locked_at, now())
    where swap_id = p_swap_id
      and locked = false;
  end if;

  insert into public.swap_events (
    swap_id, actor_id, action, from_status, to_status, metadata
  ) values (
    p_swap_id,
    v_actor_id,
    'status_transition',
    v_swap.status,
    p_to_status,
    jsonb_build_object(
      'expected_version', p_expected_version,
      'resulting_version', v_result.lifecycle_version,
      'idempotency_key', p_idempotency_key
    )
  );

  insert into public.swap_transition_requests (
    swap_id,
    actor_id,
    idempotency_key,
    expected_version,
    from_status,
    to_status,
    resulting_version
  ) values (
    p_swap_id,
    v_actor_id,
    p_idempotency_key,
    p_expected_version,
    v_swap.status,
    p_to_status,
    v_result.lifecycle_version
  );

  return jsonb_build_object(
    'swap', to_jsonb(v_result),
    'idempotent_replay', false,
    'from_status', v_swap.status,
    'to_status', p_to_status,
    'resulting_version', v_result.lifecycle_version
  );
exception
  when unique_violation then
    select * into v_existing
    from public.swap_transition_requests
    where actor_id = v_actor_id
      and idempotency_key = p_idempotency_key;

    if found
       and v_existing.swap_id = p_swap_id
       and v_existing.to_status = p_to_status
       and v_existing.expected_version = p_expected_version then
      select * into v_result from public.swaps where id = v_existing.swap_id;
      return jsonb_build_object(
        'swap', to_jsonb(v_result),
        'idempotent_replay', true,
        'from_status', v_existing.from_status,
        'to_status', v_existing.to_status,
        'resulting_version', v_existing.resulting_version
      );
    end if;
    raise;
end;
$function$;

revoke all on function public.transition_swap_lifecycle(uuid, text, bigint, text) from public, anon;
grant execute on function public.transition_swap_lifecycle(uuid, text, bigint, text) to authenticated;

comment on column public.swaps.lifecycle_version is
  'Batch 61.2 monotonic CAS version for canonical lifecycle writes.';
comment on table public.swap_transition_requests is
  'Batch 61.2 private idempotency ledger for canonical lifecycle transitions.';
comment on function public.transition_swap_lifecycle(uuid, text, bigint, text) is
  'Batch 61.2 single atomic server-side Swap lifecycle write authority.';

commit;
