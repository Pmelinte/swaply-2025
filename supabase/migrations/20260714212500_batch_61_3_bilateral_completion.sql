begin;

-- Batch 61.3: bilateral completion and exactly-once structural effects.
-- Historical completed rows are intentionally not backfilled.
-- Feedback, notifications, reputation and token ledger effects belong to C3.

create table if not exists public.swap_completion_confirmations (
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  confirmed_at timestamptz not null default now(),
  primary key (swap_id, actor_id)
);

create unique index if not exists swap_completion_confirmations_actor_key_unique
  on public.swap_completion_confirmations(actor_id, idempotency_key);

create index if not exists swap_completion_confirmations_swap_idx
  on public.swap_completion_confirmations(swap_id, confirmed_at);

alter table public.swap_completion_confirmations enable row level security;
revoke all on table public.swap_completion_confirmations
  from public, anon, authenticated;

create table if not exists public.swap_completion_effects (
  swap_id uuid primary key references public.swaps(id) on delete cascade,
  completed_by uuid not null references auth.users(id) on delete restrict,
  transition_idempotency_key text not null,
  applied_at timestamptz not null default now()
);

alter table public.swap_completion_effects enable row level security;
revoke all on table public.swap_completion_effects
  from public, anon, authenticated;

create or replace function public.apply_swap_completion_effects_v1(
  p_swap_id uuid,
  p_actor_id uuid,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_swap public.swaps%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_item_count integer := 0;
  v_conversation_count integer := 0;
  v_applied boolean := false;
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

  if v_swap.status <> 'completed' then
    raise exception 'Completion effects require completed status'
      using errcode = '23514';
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
    v_now
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
         updated_at = v_now
   where id in (v_swap.offered_item_id, v_swap.requested_item_id);

  get diagnostics v_item_count = row_count;
  if v_item_count <> 2 then
    raise exception 'Both swap items are required for completion'
      using errcode = 'P0002';
  end if;

  if v_swap.conversation_id is not null then
    update public.conversations
       set status = 'completed',
           updated_at = v_now
     where id = v_swap.conversation_id;

    get diagnostics v_conversation_count = row_count;
    if v_conversation_count <> 1 then
      raise exception 'Linked conversation is required for completion'
        using errcode = 'P0002';
    end if;
  end if;

  insert into public.swap_events (
    swap_id,
    actor_id,
    action,
    from_status,
    to_status,
    metadata
  ) values (
    v_swap.id,
    p_actor_id,
    'completion_effects_applied',
    'completed',
    'completed',
    pg_catalog.jsonb_build_object(
      'authority', 'apply_swap_completion_effects_v1',
      'idempotency_key', p_idempotency_key,
      'scope', 'structural_only'
    )
  );

  return true;
end;
$function$;

revoke execute on function public.apply_swap_completion_effects_v1(
  uuid,
  uuid,
  text
) from public, anon, authenticated, service_role;

-- Replace the Batch 61.2 internal writer so completed can only be entered by
-- the bilateral completion authority and structural effects run atomically.
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
  v_effects_applied boolean := false;
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

  if p_to_status = 'completed' then
    if p_source <> 'bilateral_completion' then
      raise exception 'Completion requires bilateral confirmation'
        using errcode = '42501';
    end if;

    if not coalesce(v_swap.requester_confirmed, false)
       or not coalesce(v_swap.responder_confirmed, false) then
      raise exception 'Both participants must confirm before completion'
        using errcode = '23514';
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
    pg_catalog.jsonb_build_object(
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

  return pg_catalog.jsonb_build_object(
    'swap', pg_catalog.to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', p_idempotency_key,
    'effects_applied', v_effects_applied
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

create or replace function public.confirm_swap_completion_v1(
  p_swap_id uuid,
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
  v_key_row public.swap_completion_confirmations%rowtype;
  v_actor_row public.swap_completion_confirmations%rowtype;
  v_requester_confirmed boolean := false;
  v_responder_confirmed boolean := false;
  v_confirmed_by uuid[] := '{}'::uuid[];
  v_transition jsonb;
begin
  if v_actor_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if p_swap_id is null
     or p_idempotency_key is null
     or char_length(trim(p_idempotency_key)) not between 8 and 200 then
    raise exception 'Invalid completion input'
      using errcode = '22023';
  end if;

  select *
    into v_key_row
    from public.swap_completion_confirmations
   where actor_id = v_actor_id
     and idempotency_key = trim(p_idempotency_key);

  if found and v_key_row.swap_id <> p_swap_id then
    raise exception 'Idempotency key was already used for another swap'
      using errcode = '22023';
  end if;

  select *
    into v_swap
    from public.swaps
   where id = p_swap_id
   for update;

  if not found then
    raise exception 'Swap not found'
      using errcode = 'P0002';
  end if;

  if v_actor_id <> v_swap.requester_id
     and v_actor_id <> v_swap.responder_id then
    raise exception 'Actor is not a swap participant'
      using errcode = '42501';
  end if;

  if v_swap.status = 'completed' then
    return pg_catalog.jsonb_build_object(
      'swap', pg_catalog.to_jsonb(v_swap),
      'replayed', true,
      'idempotency_key', trim(p_idempotency_key),
      'both_confirmed',
        coalesce(v_swap.requester_confirmed, false)
        and coalesce(v_swap.responder_confirmed, false),
      'confirmed_by', coalesce(v_swap.confirmed_by, '{}'::uuid[]),
      'effects_applied', exists (
        select 1
          from public.swap_completion_effects
         where swap_id = p_swap_id
      )
    );
  end if;

  if v_swap.status not in ('accepted', 'in_progress') then
    raise exception 'Swap is not ready for completion confirmation'
      using errcode = '23514';
  end if;

  select *
    into v_actor_row
    from public.swap_completion_confirmations
   where swap_id = p_swap_id
     and actor_id = v_actor_id;

  if found then
    return pg_catalog.jsonb_build_object(
      'swap', pg_catalog.to_jsonb(v_swap),
      'replayed', true,
      'idempotency_key', v_actor_row.idempotency_key,
      'both_confirmed',
        coalesce(v_swap.requester_confirmed, false)
        and coalesce(v_swap.responder_confirmed, false),
      'confirmed_by', coalesce(v_swap.confirmed_by, '{}'::uuid[]),
      'effects_applied', false
    );
  end if;

  insert into public.swap_completion_confirmations (
    swap_id,
    actor_id,
    idempotency_key
  ) values (
    p_swap_id,
    v_actor_id,
    trim(p_idempotency_key)
  )
  on conflict do nothing;

  if not found then
    select *
      into v_actor_row
      from public.swap_completion_confirmations
     where swap_id = p_swap_id
       and actor_id = v_actor_id;

    if found then
      return pg_catalog.jsonb_build_object(
        'swap', pg_catalog.to_jsonb(v_swap),
        'replayed', true,
        'idempotency_key', v_actor_row.idempotency_key,
        'both_confirmed',
          coalesce(v_swap.requester_confirmed, false)
          and coalesce(v_swap.responder_confirmed, false),
        'confirmed_by', coalesce(v_swap.confirmed_by, '{}'::uuid[]),
        'effects_applied', false
      );
    end if;

    raise exception 'Completion confirmation conflict'
      using errcode = '23505';
  end if;

  v_requester_confirmed :=
    coalesce(v_swap.requester_confirmed, false)
    or v_actor_id = v_swap.requester_id;
  v_responder_confirmed :=
    coalesce(v_swap.responder_confirmed, false)
    or v_actor_id = v_swap.responder_id;

  if v_requester_confirmed then
    v_confirmed_by := pg_catalog.array_append(
      v_confirmed_by,
      v_swap.requester_id
    );
  end if;
  if v_responder_confirmed then
    v_confirmed_by := pg_catalog.array_append(
      v_confirmed_by,
      v_swap.responder_id
    );
  end if;

  perform pg_catalog.set_config(
    'swaply.completion_authority',
    'confirm_swap_completion_v1',
    true
  );

  update public.swaps
     set requester_confirmed = v_requester_confirmed,
         responder_confirmed = v_responder_confirmed,
         confirmed_by = v_confirmed_by,
         updated_at = pg_catalog.clock_timestamp()
   where id = p_swap_id
   returning * into v_swap;

  perform pg_catalog.set_config('swaply.completion_authority', '', true);

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
    'completion_confirmed',
    v_swap.status,
    v_swap.status,
    pg_catalog.jsonb_build_object(
      'authority', 'confirm_swap_completion_v1',
      'idempotency_key', trim(p_idempotency_key),
      'both_confirmed', v_requester_confirmed and v_responder_confirmed
    )
  );

  if v_requester_confirmed and v_responder_confirmed then
    v_transition := public.apply_swap_transition_v1(
      p_swap_id,
      v_swap.status,
      'completed',
      v_actor_id,
      'bilateral_completion',
      trim(p_idempotency_key)
    );

    return v_transition || pg_catalog.jsonb_build_object(
      'both_confirmed', true,
      'confirmed_by', v_confirmed_by
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'swap', pg_catalog.to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', trim(p_idempotency_key),
    'both_confirmed', false,
    'confirmed_by', v_confirmed_by,
    'effects_applied', false
  );
end;
$function$;

revoke execute on function public.confirm_swap_completion_v1(uuid, text)
  from public, anon;
grant execute on function public.confirm_swap_completion_v1(uuid, text)
  to authenticated;

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
     <> 'confirm_swap_completion_v1' then
    raise exception 'Direct completion confirmation updates are forbidden'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

revoke execute on function public.require_swap_completion_authority()
  from public, anon, authenticated;

drop trigger if exists aaa_require_swap_completion_authority on public.swaps;
create trigger aaa_require_swap_completion_authority
  before update of requester_confirmed, responder_confirmed, confirmed_by
  on public.swaps
  for each row
  execute function public.require_swap_completion_authority();

-- Remove legacy completion side effects. C3 will reintroduce notification,
-- reputation and ledger effects through a reviewed exactly-once contract.
drop trigger if exists swaps_trust_score_trigger on public.swaps;
drop trigger if exists on_swap_complete_advance_onboarding on public.swaps;

comment on function public.confirm_swap_completion_v1(uuid, text) is
  'Batch 61.3 participant-only bilateral completion confirmation with row locking and idempotency.';
comment on function public.apply_swap_completion_effects_v1(uuid, uuid, text) is
  'Batch 61.3 exactly-once structural item and conversation effects. C3 owns rewards and feedback effects.';
comment on table public.swap_completion_confirmations is
  'Batch 61.3 private one-confirmation-per-participant registry.';
comment on table public.swap_completion_effects is
  'Batch 61.3 private exactly-once structural completion effect registry.';

commit;
