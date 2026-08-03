begin;

-- V1-05.4.6 isolated completion fixture.
--
-- Apply after v1_05_4_4_current_contract_fixture.sql and before the exact
-- V1-05.4.3–V1-05.4.6 migrations. This file models only the pre-existing
-- completion contracts and the Property listing columns required by those
-- exact migrations. It is test-only and is never applied to Production.

alter table public.items
  add column if not exists locked_by uuid,
  add column if not exists locked_until timestamptz,
  add column if not exists lock_reason text;

alter table public.swaps
  add column if not exists confirmed_by uuid[] not null default '{}'::uuid[];

create table if not exists public.properties (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null unique references public.items(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'archived')),
  available_from date,
  available_until date,
  min_stay_days integer not null default 1,
  max_stay_days integer not null default 365,
  advance_notice_days integer not null default 0,
  available_months integer[] not null default '{}'::integer[],
  blocked_dates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.swap_completion_confirmations (
  id uuid primary key default extensions.gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (swap_id, actor_id),
  unique (actor_id, idempotency_key)
);

create table if not exists public.swap_completion_effects (
  swap_id uuid primary key references public.swaps(id) on delete cascade,
  completed_by uuid not null references auth.users(id) on delete restrict,
  transition_idempotency_key text,
  applied_at timestamptz not null default now()
);

create table if not exists public.swap_post_completion_effects (
  swap_id uuid primary key references public.swaps(id) on delete cascade,
  applied_by uuid not null references auth.users(id) on delete restrict,
  transition_idempotency_key text,
  applied_at timestamptz not null default now()
);

create or replace function public.apply_swap_post_completion_effects_v1(
  p_swap_id uuid,
  p_actor_id uuid,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_applied boolean := false;
begin
  insert into public.swap_post_completion_effects (
    swap_id,
    applied_by,
    transition_idempotency_key,
    applied_at
  ) values (
    p_swap_id,
    p_actor_id,
    p_idempotency_key,
    clock_timestamp()
  )
  on conflict (swap_id) do nothing
  returning true into v_applied;

  return coalesce(v_applied, false);
end;
$function$;

create or replace function public.apply_swap_completion_effects_v1(
  p_swap_id uuid,
  p_actor_id uuid,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_swap public.swaps%rowtype;
  v_applied boolean := false;
begin
  select swap_row.*
  into v_swap
  from public.swaps swap_row
  where swap_row.id = p_swap_id
  for update;

  if not found or v_swap.status <> 'completed' then
    raise exception using errcode = '23514', message = 'Completion effects require completed status';
  end if;

  insert into public.swap_completion_effects (
    swap_id,
    completed_by,
    transition_idempotency_key,
    applied_at
  ) values (
    p_swap_id,
    p_actor_id,
    p_idempotency_key,
    clock_timestamp()
  )
  on conflict (swap_id) do nothing
  returning true into v_applied;

  if not found then
    return false;
  end if;

  update public.items
  set status = 'traded',
      is_active = false,
      locked_by = null,
      locked_until = null,
      lock_reason = null,
      updated_at = clock_timestamp()
  where id in (v_swap.offered_item_id, v_swap.requested_item_id);

  update public.conversations
  set status = 'completed',
      updated_at = clock_timestamp()
  where id = v_swap.conversation_id;

  if not public.apply_swap_post_completion_effects_v1(
    p_swap_id,
    p_actor_id,
    p_idempotency_key
  ) then
    raise exception using errcode = '23505', message = 'Post-completion effects were not applied';
  end if;

  return true;
end;
$function$;

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
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_swap public.swaps%rowtype;
  v_allowed boolean;
  v_effects_applied boolean := false;
begin
  select swap_row.*
  into v_swap
  from public.swaps swap_row
  where swap_row.id = p_swap_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Swap not found';
  end if;

  if v_swap.status is distinct from p_expected_status then
    raise exception using errcode = '40001', message = 'Stale swap status';
  end if;

  if p_actor_id is null
    or p_actor_id not in (v_swap.requester_id, v_swap.responder_id)
  then
    raise exception using errcode = '42501', message = 'Actor is not a swap participant';
  end if;

  if p_to_status = 'completed' then
    if p_source <> 'bilateral_completion'
      or not v_swap.requester_confirmed
      or not v_swap.responder_confirmed
    then
      raise exception using errcode = '23514', message = 'Both participants must confirm before completion';
    end if;
  end if;

  v_allowed := case p_expected_status
    when 'pending' then p_to_status in ('accepted', 'rejected', 'cancelled', 'expired')
    when 'accepted' then p_to_status in ('in_progress', 'completed', 'cancelled', 'disputed')
    when 'in_progress' then p_to_status in ('completed', 'cancelled', 'disputed')
    when 'completed' then p_to_status = 'disputed'
    else false
  end;

  if not v_allowed then
    raise exception using errcode = '23514', message = 'Invalid swap transition';
  end if;

  update public.swaps
  set status = p_to_status,
      completed_at = case
        when p_to_status = 'completed' then coalesce(completed_at, clock_timestamp())
        else completed_at
      end,
      updated_at = clock_timestamp()
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

  if p_to_status = 'completed' then
    v_effects_applied := public.apply_swap_completion_effects_v1(
      p_swap_id,
      p_actor_id,
      p_idempotency_key
    );
  end if;

  return jsonb_build_object(
    'swap', to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', p_idempotency_key,
    'effects_applied', v_effects_applied
  );
end;
$function$;

create or replace function public.confirm_swap_completion_v1(
  p_swap_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_existing public.swap_completion_confirmations%rowtype;
  v_requester_confirmed boolean;
  v_responder_confirmed boolean;
  v_confirmed_by uuid[] := '{}'::uuid[];
  v_transition jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_swap_id is null
    or p_idempotency_key is null
    or char_length(btrim(p_idempotency_key)) not between 8 and 200
  then
    raise exception using errcode = '22023', message = 'Invalid completion input';
  end if;

  select swap_row.*
  into v_swap
  from public.swaps swap_row
  where swap_row.id = p_swap_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Swap not found';
  end if;

  if v_actor not in (v_swap.requester_id, v_swap.responder_id) then
    raise exception using errcode = '42501', message = 'Actor is not a swap participant';
  end if;

  if v_swap.status = 'completed' then
    return jsonb_build_object(
      'swap', to_jsonb(v_swap),
      'replayed', true,
      'idempotency_key', btrim(p_idempotency_key),
      'both_confirmed', true,
      'confirmed_by', v_swap.confirmed_by,
      'effects_applied', exists (
        select 1 from public.swap_completion_effects effect_row
        where effect_row.swap_id = p_swap_id
      )
    );
  end if;

  if v_swap.status not in ('accepted', 'in_progress') then
    raise exception using errcode = '23514', message = 'Swap is not ready for completion confirmation';
  end if;

  select confirmation_row.*
  into v_existing
  from public.swap_completion_confirmations confirmation_row
  where confirmation_row.swap_id = p_swap_id
    and confirmation_row.actor_id = v_actor;

  if found then
    return jsonb_build_object(
      'swap', to_jsonb(v_swap),
      'replayed', true,
      'idempotency_key', v_existing.idempotency_key,
      'both_confirmed', v_swap.requester_confirmed and v_swap.responder_confirmed,
      'confirmed_by', v_swap.confirmed_by,
      'effects_applied', false
    );
  end if;

  insert into public.swap_completion_confirmations (
    swap_id,
    actor_id,
    idempotency_key
  ) values (
    p_swap_id,
    v_actor,
    btrim(p_idempotency_key)
  );

  v_requester_confirmed := v_swap.requester_confirmed
    or v_actor = v_swap.requester_id;
  v_responder_confirmed := v_swap.responder_confirmed
    or v_actor = v_swap.responder_id;

  if v_requester_confirmed then
    v_confirmed_by := array_append(v_confirmed_by, v_swap.requester_id);
  end if;
  if v_responder_confirmed then
    v_confirmed_by := array_append(v_confirmed_by, v_swap.responder_id);
  end if;

  update public.swaps
  set requester_confirmed = v_requester_confirmed,
      responder_confirmed = v_responder_confirmed,
      confirmed_by = v_confirmed_by,
      updated_at = clock_timestamp()
  where id = p_swap_id
  returning * into v_swap;

  if v_requester_confirmed and v_responder_confirmed then
    v_transition := public.apply_swap_transition_v1(
      p_swap_id,
      v_swap.status,
      'completed',
      v_actor,
      'bilateral_completion',
      btrim(p_idempotency_key)
    );

    return v_transition || jsonb_build_object(
      'both_confirmed', true,
      'confirmed_by', v_confirmed_by
    );
  end if;

  return jsonb_build_object(
    'swap', to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', btrim(p_idempotency_key),
    'both_confirmed', false,
    'confirmed_by', v_confirmed_by,
    'effects_applied', false
  );
end;
$function$;

revoke all on function public.apply_swap_transition_v1(uuid, text, text, uuid, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.apply_swap_completion_effects_v1(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.apply_swap_post_completion_effects_v1(uuid, uuid, text)
  from public, anon, authenticated, service_role;
revoke all on function public.confirm_swap_completion_v1(uuid, text)
  from public, anon;
grant execute on function public.confirm_swap_completion_v1(uuid, text)
  to authenticated;

commit;
