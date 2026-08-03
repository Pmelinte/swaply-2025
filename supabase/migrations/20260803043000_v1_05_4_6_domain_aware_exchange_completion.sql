begin;

create schema if not exists private;

create or replace function private.domain_completion_readiness_v1(
  p_swap_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_swap public.swaps%rowtype;
  v_property_expected integer := 0;
  v_service_expected integer := 0;
  v_event_expected integer := 0;
  v_property_terms integer := 0;
  v_service_terms integer := 0;
  v_event_terms integer := 0;
  v_property_actual integer := 0;
  v_service_actual integer := 0;
  v_event_actual integer := 0;
  v_property_ready integer := 0;
  v_service_ready integer := 0;
  v_event_ready integer := 0;
  v_blocked_by jsonb := '[]'::jsonb;
  v_terms jsonb := '[]'::jsonb;
  v_agreement_hash text;
  v_domain_contract_valid boolean := false;
begin
  if p_swap_id is null then
    raise exception using errcode = '22023', message = 'Exchange id is required.';
  end if;

  select swap_row.*
  into v_swap
  from public.swaps swap_row
  where swap_row.id = p_swap_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Exchange not found.';
  end if;

  select
    count(*) filter (where item_row.item_type = 'property'),
    count(*) filter (where item_row.item_type = 'service'),
    count(*) filter (where item_row.item_type = 'event')
  into
    v_property_expected,
    v_service_expected,
    v_event_expected
  from public.items item_row
  where item_row.id in (v_swap.offered_item_id, v_swap.requested_item_id);

  if v_property_expected + v_service_expected + v_event_expected = 0 then
    return jsonb_build_object(
      'swap_id', v_swap.id,
      'ready', true,
      'domain_aware', false,
      'blocked_by', v_blocked_by,
      'expected', jsonb_build_object(
        'property', 0,
        'service', 0,
        'event', 0
      ),
      'actual', jsonb_build_object(
        'property', 0,
        'service', 0,
        'event', 0
      ),
      'ready_ledgers', jsonb_build_object(
        'property', 0,
        'service', 0,
        'event', 0
      )
    );
  end if;

  v_agreement_hash := v_swap.swap_metadata ->> 'agreement_hash';

  if v_swap.exchange_kind <> 'bilateral'
    or v_swap.swap_metadata ->> 'source'
      is distinct from 'domain_aware_match_agreement'
    or v_swap.agreement_revision < 1
    or coalesce(v_agreement_hash, '') !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(v_swap.exchange_data -> 'domain_terms')
      is distinct from 'array'
  then
    v_blocked_by := v_blocked_by
      || jsonb_build_array('domain_agreement_required');
  else
    v_domain_contract_valid := true;
    v_terms := v_swap.exchange_data -> 'domain_terms';

    select
      count(*) filter (where term.value ->> 'domain' = 'property'),
      count(*) filter (where term.value ->> 'domain' = 'service'),
      count(*) filter (where term.value ->> 'domain' = 'event')
    into
      v_property_terms,
      v_service_terms,
      v_event_terms
    from jsonb_array_elements(v_terms) term(value);

    if v_property_terms <> v_property_expected
      or v_service_terms <> v_service_expected
      or v_event_terms <> v_event_expected
      or exists (
        select 1
        from jsonb_array_elements(v_terms) term(value)
        where term.value ->> 'domain' not in ('property', 'service', 'event')
          or coalesce(term.value ->> 'item_id', '') not in (
            v_swap.offered_item_id::text,
            v_swap.requested_item_id::text
          )
      )
      or exists (
        select 1
        from jsonb_array_elements(v_terms) term(value)
        group by term.value ->> 'item_id'
        having count(*) <> 1
      )
    then
      v_domain_contract_valid := false;
      v_blocked_by := v_blocked_by
        || jsonb_build_array('domain_terms_mismatch');
    end if;
  end if;

  if v_property_expected > 0 then
    select
      count(*),
      count(*) filter (
        where reservation_row.status = case
            when v_swap.status = 'completed' then 'completed'
            else 'reserved'
          end
          and reservation_row.agreement_revision = v_swap.agreement_revision
          and reservation_row.agreement_hash = v_agreement_hash
          and reservation_row.property_item_id
            in (v_swap.offered_item_id, v_swap.requested_item_id)
      )
    into v_property_actual, v_property_ready
    from public.property_reservations reservation_row
    where reservation_row.swap_id = v_swap.id;

    if v_property_actual <> v_property_expected
      or v_property_ready <> v_property_expected
    then
      v_blocked_by := v_blocked_by
        || jsonb_build_array('property_reservations_not_ready');
    end if;
  end if;

  if v_service_expected > 0 then
    select
      count(*),
      count(*) filter (
        where delivery_row.status = 'completed'
          and delivery_row.agreement_revision = v_swap.agreement_revision
          and delivery_row.agreement_hash = v_agreement_hash
          and delivery_row.service_item_id
            in (v_swap.offered_item_id, v_swap.requested_item_id)
      )
    into v_service_actual, v_service_ready
    from public.service_deliveries delivery_row
    where delivery_row.swap_id = v_swap.id;

    if v_service_actual <> v_service_expected
      or v_service_ready <> v_service_expected
    then
      v_blocked_by := v_blocked_by
        || jsonb_build_array('service_deliveries_not_ready');
    end if;
  end if;

  if v_event_expected > 0 then
    select
      count(*),
      count(*) filter (
        where transfer_row.status = 'confirmed'
          and transfer_row.agreement_revision = v_swap.agreement_revision
          and transfer_row.agreement_hash = v_agreement_hash
          and transfer_row.event_item_id
            in (v_swap.offered_item_id, v_swap.requested_item_id)
      )
    into v_event_actual, v_event_ready
    from public.event_transfers transfer_row
    where transfer_row.swap_id = v_swap.id;

    if v_event_actual <> v_event_expected
      or v_event_ready <> v_event_expected
    then
      v_blocked_by := v_blocked_by
        || jsonb_build_array('event_transfers_not_ready');
    end if;
  end if;

  return jsonb_build_object(
    'swap_id', v_swap.id,
    'ready', jsonb_array_length(v_blocked_by) = 0,
    'domain_aware', v_domain_contract_valid,
    'blocked_by', v_blocked_by,
    'expected', jsonb_build_object(
      'property', v_property_expected,
      'service', v_service_expected,
      'event', v_event_expected
    ),
    'actual', jsonb_build_object(
      'property', v_property_actual,
      'service', v_service_actual,
      'event', v_event_actual
    ),
    'ready_ledgers', jsonb_build_object(
      'property', v_property_ready,
      'service', v_service_ready,
      'event', v_event_ready
    )
  );
end;
$function$;

revoke all on function private.domain_completion_readiness_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function private.require_domain_completion_ready_v1(
  p_swap_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_readiness jsonb;
begin
  v_readiness := private.domain_completion_readiness_v1(p_swap_id);

  if coalesce((v_readiness ->> 'ready')::boolean, false) is not true then
    raise exception using
      errcode = '23514',
      message = 'Domain completion prerequisites are not satisfied.',
      detail = coalesce(v_readiness -> 'blocked_by', '[]'::jsonb)::text;
  end if;

  return v_readiness;
end;
$function$;

revoke all on function private.require_domain_completion_ready_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.get_domain_completion_readiness_v1(
  p_swap_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_swap public.swaps%rowtype;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select swap_row.*
  into v_swap
  from public.swaps swap_row
  where swap_row.id = p_swap_id;

  if not found
    or v_actor not in (v_swap.requester_id, v_swap.responder_id)
  then
    raise exception using errcode = '42501', message = 'Exchange completion access denied.';
  end if;

  return private.domain_completion_readiness_v1(p_swap_id);
end;
$function$;

revoke all on function public.get_domain_completion_readiness_v1(uuid)
  from public, anon;
grant execute on function public.get_domain_completion_readiness_v1(uuid)
  to authenticated;

create or replace function private.guard_domain_completion_confirmation_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  perform private.require_domain_completion_ready_v1(new.swap_id);
  return new;
end;
$function$;

revoke all on function private.guard_domain_completion_confirmation_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists aaa_domain_completion_confirmation_guard_v1
  on public.swap_completion_confirmations;
create trigger aaa_domain_completion_confirmation_guard_v1
before insert on public.swap_completion_confirmations
for each row
execute function private.guard_domain_completion_confirmation_v1();

create or replace function private.guard_domain_aware_swap_completion_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  if old.status is distinct from new.status
    and new.status = 'completed'
  then
    perform private.require_domain_completion_ready_v1(new.id);
  end if;

  return new;
end;
$function$;

revoke all on function private.guard_domain_aware_swap_completion_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists aaa_domain_aware_swap_completion_guard_v1
  on public.swaps;
create trigger aaa_domain_aware_swap_completion_guard_v1
before update of status on public.swaps
for each row
execute function private.guard_domain_aware_swap_completion_v1();

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
  v_object_count integer := 0;
  v_reusable_domain_count integer := 0;
  v_conversation_count integer := 0;
  v_applied boolean := false;
  v_post_applied boolean := false;
  v_readiness jsonb;
begin
  select *
  into v_swap
  from public.swaps
  where id = p_swap_id
  for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if v_swap.status <> 'completed' then
    raise exception 'Completion effects require completed status'
      using errcode = '23514';
  end if;

  if p_actor_id is null
    or p_actor_id not in (v_swap.requester_id, v_swap.responder_id)
  then
    raise exception 'Actor is not a swap participant'
      using errcode = '42501';
  end if;

  v_readiness := private.require_domain_completion_ready_v1(p_swap_id);

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

  select
    count(*) filter (where item_row.item_type = 'object'),
    count(*) filter (
      where item_row.item_type in ('property', 'service', 'event')
    )
  into v_object_count, v_reusable_domain_count
  from public.items item_row
  where item_row.id in (v_swap.offered_item_id, v_swap.requested_item_id);

  update public.items
  set status = case
        when item_type = 'object' then 'traded'
        else status
      end,
      is_active = case
        when item_type = 'object' then false
        else is_active
      end,
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

  v_post_applied := public.apply_swap_post_completion_effects_v1(
    p_swap_id,
    p_actor_id,
    p_idempotency_key
  );

  if not v_post_applied then
    raise exception 'Post-completion effects were not applied'
      using errcode = '23505';
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
      'scope', 'domain_aware_structural_effects',
      'object_items_consumed', v_object_count,
      'reusable_domain_items_preserved', v_reusable_domain_count,
      'domain_readiness', v_readiness,
      'post_completion_effects_applied', v_post_applied
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

comment on function private.domain_completion_readiness_v1(uuid) is
  'V1-05.4.6 privacy-safe readiness projection across Property reservations, Service deliveries and Event transfers.';
comment on function private.require_domain_completion_ready_v1(uuid) is
  'V1-05.4.6 fail-closed shared completion assertion for every non-Object domain ledger.';
comment on function public.get_domain_completion_readiness_v1(uuid) is
  'V1-05.4.6 participant-only Exchange completion readiness without private proof payloads.';
comment on function public.apply_swap_completion_effects_v1(uuid, uuid, text) is
  'V1-05.4.6 domain-aware completion effects: Objects are consumed; reusable Property, Service and Event listings remain active and are governed by their dedicated ledgers.';

commit;
