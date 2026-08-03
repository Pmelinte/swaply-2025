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

  if v_swap.exchange_kind is distinct from 'bilateral'
    or v_swap.swap_metadata ->> 'source'
      is distinct from 'domain_aware_match_agreement'
    or coalesce(v_swap.agreement_revision, 0) < 1
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
        left join public.items term_item
          on term_item.id in (
              v_swap.offered_item_id,
              v_swap.requested_item_id
            )
          and term_item.id::text = term.value ->> 'item_id'
        where jsonb_typeof(term.value) is distinct from 'object'
          or coalesce(term.value ->> 'domain', '')
            not in ('property', 'service', 'event')
          or coalesce(term.value ->> 'item_id', '') not in (
            v_swap.offered_item_id::text,
            v_swap.requested_item_id::text
          )
          or term_item.id is null
          or term_item.item_type::text
            is distinct from term.value ->> 'domain'
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

comment on function private.domain_completion_readiness_v1(uuid) is
  'V1-05.4.6.1 fail-closed readiness: NULL Agreement revisions and domain/item-type mismatches block Exchange completion.';

commit;
