begin;

create schema if not exists private;

create table if not exists public.match_agreement_mutation_receipts (
  actor_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  action text not null check (action in ('save', 'confirm', 'withdraw')),
  idempotency_key text not null,
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, conversation_id, action, idempotency_key),
  check (char_length(idempotency_key) between 8 and 120),
  check (idempotency_key ~ '^[A-Za-z0-9._:-]+$'),
  check (request_hash ~ '^[a-f0-9]{64}$'),
  check (jsonb_typeof(response) = 'object')
);

alter table public.match_agreement_mutation_receipts enable row level security;
revoke all on table public.match_agreement_mutation_receipts
  from public, anon, authenticated;

create index if not exists match_agreement_receipts_conversation_created_idx
  on public.match_agreement_mutation_receipts (conversation_id, created_at desc);

create or replace function public.get_match_agreement_context_v1(
  p_conversation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_items jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select c.*
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id;

  if not found or v_conversation.match_id is null then
    raise exception using errcode = 'P0002', message = 'Match conversation not found.';
  end if;

  if cardinality(v_conversation.participant_ids) <> 2
    or not (v_actor = any(v_conversation.participant_ids))
  then
    raise exception using errcode = '42501', message = 'Conversation access denied.';
  end if;

  if cardinality(v_conversation.item_ids) <> 2
    or not exists (
      select 1
      from public.matches m
      where m.id = v_conversation.match_id
        and m.status = 'accepted'
        and m.initiator_id = any(v_conversation.participant_ids)
        and m.target_user_id = any(v_conversation.participant_ids)
    )
  then
    raise exception using errcode = '42501', message = 'Accepted bilateral match required.';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'item_id', i.id,
      'owner_id', i.owner_id,
      'domain', i.item_type,
      'title', i.title,
      'defaults', case i.item_type
        when 'property' then jsonb_strip_nulls(jsonb_build_object(
          'period_start', p.available_from,
          'period_end', p.available_until,
          'timezone', p.timezone,
          'exchange_mode', case
            when p.exchange_type = 'non_simultaneous' then 'non_simultaneous'
            else 'simultaneous'
          end,
          'guests', greatest(1, coalesce(p.sleeps_max, p.max_guests, 1)),
          'rules', coalesce(nullif(btrim(p.additional_rules), ''), 'No additional rules'),
          'security_deposit_eur', greatest(0, coalesce(p.security_deposit_eur, 0)),
          'insurance_confirmed', coalesce(p.home_insurance_active, false),
          'check_in_time', to_char(coalesce(p.check_in_time, time '15:00'), 'HH24:MI'),
          'check_out_time', to_char(coalesce(p.check_out_time, time '11:00'), 'HH24:MI'),
          'handover_notes', ''
        ))
        when 'service' then jsonb_strip_nulls(jsonb_build_object(
          'delivery_mode', case
            when s.delivery_mode = 'remote' then 'remote'
            when s.delivery_mode in ('onsite', 'on-site', 'in_person') then 'physical'
            else 'hybrid'
          end,
          'timezone', s.timezone,
          'deliverables', coalesce(to_jsonb(s.deliverables), '[]'::jsonb),
          'duration_hours', greatest(0, coalesce(s.estimated_hours, 0)),
          'duration_days', greatest(0, coalesce(s.estimated_days, 0)),
          'deadline_at', case
            when s.available_date_until is not null
              then to_char(s.available_date_until, 'YYYY-MM-DD') || 'T23:59:00Z'
            else null
          end,
          'milestones', case
            when coalesce(cardinality(s.deliverables), 0) > 0
              then to_jsonb(s.deliverables)
            else jsonb_build_array('Delivery')
          end,
          'acceptance_criteria', coalesce(nullif(btrim(s.scope_description), ''), ''),
          'no_show_terms', '',
          'cancellation_terms', '',
          'dispute_terms', ''
        ))
        when 'event' then jsonb_strip_nulls(jsonb_build_object(
          'quantity', 1,
          'transferable', coalesce(e.is_transferable, false),
          'issuer_rule_confirmed', coalesce(e.transfer_rule_confirmed, false),
          'issuer_rule_source', e.transfer_rule_source,
          'transfer_deadline_at', e.transfer_deadline_at,
          'bundle', jsonb_build_object(
            'ticket', true,
            'accommodation', coalesce(e.includes_accommodation, false),
            'transport', coalesce(e.includes_transport, false)
          ),
          'proof_required', true,
          'transfer_notes', ''
        ))
        else '{}'::jsonb
      end
    )
    order by source.position
  )
  into v_items
  from unnest(v_conversation.item_ids) with ordinality as source(item_id, position)
  join public.items i on i.id = source.item_id
  left join public.properties p
    on i.item_type = 'property' and p.item_id = i.id
  left join public.services_listings s
    on i.item_type = 'service' and s.item_id = i.id
  left join public.events_listings e
    on i.item_type = 'event' and e.item_id = i.id;

  if coalesce(jsonb_array_length(v_items), 0) <> 2 then
    raise exception using errcode = '23503', message = 'Conversation item context is incomplete.';
  end if;

  return jsonb_build_object(
    'schema_version', '1.0',
    'conversation_id', v_conversation.id,
    'items', v_items
  );
end;
$function$;

revoke all on function public.get_match_agreement_context_v1(uuid)
  from public, anon;
grant execute on function public.get_match_agreement_context_v1(uuid)
  to authenticated;

create or replace function private.validate_match_agreement_domain_terms_v1(
  p_conversation_id uuid,
  p_domain_terms jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_conversation public.conversations%rowtype;
  v_source record;
  v_entry jsonb;
  v_terms jsonb;
  v_entry_count integer;
  v_expected_count integer;
  v_unknown_key text;
  v_normalized jsonb := '[]'::jsonb;
  v_property public.properties%rowtype;
  v_service public.services_listings%rowtype;
  v_event public.events_listings%rowtype;
  v_period_start date;
  v_period_end date;
  v_duration_days integer;
  v_timezone text;
  v_deadline timestamptz;
  v_quantity integer;
  v_capacity integer;
  v_deposit numeric;
  v_guests integer;
  v_hours integer;
  v_days integer;
  v_bundle jsonb;
begin
  if jsonb_typeof(p_domain_terms) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Domain terms must be an array.';
  end if;

  select c.*
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id;

  if not found or cardinality(v_conversation.item_ids) <> 2 then
    raise exception using errcode = 'P0002', message = 'Conversation item context is unavailable.';
  end if;

  select count(*)
  into v_expected_count
  from unnest(v_conversation.item_ids) source(item_id)
  join public.items i on i.id = source.item_id
  where i.item_type in ('property', 'service', 'event');

  if jsonb_array_length(p_domain_terms) <> v_expected_count then
    raise exception using errcode = '22023', message = 'One domain contract is required for every non-object listing.';
  end if;

  for v_source in
    select source.position, i.*
    from unnest(v_conversation.item_ids) with ordinality as source(item_id, position)
    join public.items i on i.id = source.item_id
    order by source.position
  loop
    select count(*)
    into v_entry_count
    from jsonb_array_elements(p_domain_terms) entry(value)
    where entry.value ->> 'item_id' = v_source.id::text;

    if v_source.item_type = 'object' then
      if v_entry_count <> 0 then
        raise exception using errcode = '22023', message = 'Object listings cannot receive domain-specific terms.';
      end if;
      continue;
    end if;

    if v_source.item_type not in ('property', 'service', 'event')
      or v_entry_count <> 1
    then
      raise exception using errcode = '22023', message = 'Domain contract item mismatch.';
    end if;

    select entry.value
    into v_entry
    from jsonb_array_elements(p_domain_terms) entry(value)
    where entry.value ->> 'item_id' = v_source.id::text
    limit 1;

    if jsonb_typeof(v_entry) is distinct from 'object'
      or v_entry ->> 'domain' is distinct from v_source.item_type
      or jsonb_typeof(v_entry -> 'terms') is distinct from 'object'
    then
      raise exception using errcode = '22023', message = 'Invalid domain contract envelope.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_entry) keys(key)
    where key not in ('item_id', 'domain', 'terms')
    limit 1;

    if v_unknown_key is not null then
      raise exception using errcode = '22023', message = format('Unsupported domain contract field: %s', v_unknown_key);
    end if;

    v_terms := v_entry -> 'terms';

    if v_source.item_type = 'property' then
      select p.*
      into v_property
      from public.properties p
      where p.item_id = v_source.id
        and p.status = 'active';

      if not found then
        raise exception using errcode = '23514', message = 'Property listing is unavailable.';
      end if;

      select key
      into v_unknown_key
      from jsonb_object_keys(v_terms) keys(key)
      where key not in (
        'period_start', 'period_end', 'timezone', 'exchange_mode', 'guests',
        'rules', 'security_deposit_eur', 'insurance_confirmed',
        'check_in_time', 'check_out_time', 'handover_notes'
      )
      limit 1;

      if v_unknown_key is not null then
        raise exception using errcode = '22023', message = format('Unsupported property agreement field: %s', v_unknown_key);
      end if;

      if jsonb_typeof(v_terms -> 'period_start') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'period_end') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'timezone') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'exchange_mode') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'guests') is distinct from 'number'
        or jsonb_typeof(v_terms -> 'rules') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'security_deposit_eur') is distinct from 'number'
        or jsonb_typeof(v_terms -> 'insurance_confirmed') is distinct from 'boolean'
        or jsonb_typeof(v_terms -> 'check_in_time') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'check_out_time') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'handover_notes') is distinct from 'string'
      then
        raise exception using errcode = '22023', message = 'Property agreement field types are invalid.';
      end if;

      v_period_start := (v_terms ->> 'period_start')::date;
      v_period_end := (v_terms ->> 'period_end')::date;
      v_duration_days := v_period_end - v_period_start + 1;
      v_timezone := btrim(v_terms ->> 'timezone');
      v_guests := (v_terms ->> 'guests')::integer;
      v_deposit := (v_terms ->> 'security_deposit_eur')::numeric;

      if v_period_start < current_date
        or v_period_end < v_period_start
        or (v_property.available_from is not null and v_period_start < v_property.available_from)
        or (v_property.available_until is not null and v_period_end > v_property.available_until)
        or v_duration_days < greatest(1, coalesce(v_property.min_stay_days, 1))
        or v_duration_days > greatest(1, coalesce(v_property.max_stay_days, 365))
      then
        raise exception using errcode = '22023', message = 'Property agreement period is outside the available contract.';
      end if;

      if not exists (
        select 1 from pg_catalog.pg_timezone_names where name = v_timezone
      ) then
        raise exception using errcode = '22023', message = 'Property agreement timezone is invalid.';
      end if;

      if v_terms ->> 'exchange_mode' not in ('simultaneous', 'non_simultaneous', 'vacation_handoff')
        or v_guests < 1
        or v_guests > greatest(1, coalesce(v_property.sleeps_max, v_property.max_guests, 1))
        or v_deposit < 0
        or nullif(btrim(v_terms ->> 'rules'), '') is null
        or length(v_terms ->> 'rules') > 2000
        or nullif(btrim(v_terms ->> 'handover_notes'), '') is null
        or length(v_terms ->> 'handover_notes') > 2000
      then
        raise exception using errcode = '22023', message = 'Property agreement terms are incomplete.';
      end if;

      perform (v_terms ->> 'check_in_time')::time;
      perform (v_terms ->> 'check_out_time')::time;

      v_normalized := v_normalized || jsonb_build_array(jsonb_build_object(
        'item_id', v_source.id,
        'domain', 'property',
        'terms', jsonb_build_object(
          'period_start', v_period_start,
          'period_end', v_period_end,
          'timezone', v_timezone,
          'exchange_mode', v_terms ->> 'exchange_mode',
          'guests', v_guests,
          'rules', btrim(v_terms ->> 'rules'),
          'security_deposit_eur', v_deposit,
          'insurance_confirmed', (v_terms ->> 'insurance_confirmed')::boolean,
          'check_in_time', to_char((v_terms ->> 'check_in_time')::time, 'HH24:MI'),
          'check_out_time', to_char((v_terms ->> 'check_out_time')::time, 'HH24:MI'),
          'handover_notes', btrim(v_terms ->> 'handover_notes')
        )
      ));

    elsif v_source.item_type = 'service' then
      select s.*
      into v_service
      from public.services_listings s
      where s.item_id = v_source.id
        and s.status = 'active';

      if not found then
        raise exception using errcode = '23514', message = 'Service listing is unavailable.';
      end if;

      select key
      into v_unknown_key
      from jsonb_object_keys(v_terms) keys(key)
      where key not in (
        'delivery_mode', 'timezone', 'deliverables', 'duration_hours',
        'duration_days', 'deadline_at', 'milestones', 'acceptance_criteria',
        'no_show_terms', 'cancellation_terms', 'dispute_terms'
      )
      limit 1;

      if v_unknown_key is not null then
        raise exception using errcode = '22023', message = format('Unsupported service agreement field: %s', v_unknown_key);
      end if;

      if jsonb_typeof(v_terms -> 'delivery_mode') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'timezone') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'deliverables') is distinct from 'array'
        or jsonb_typeof(v_terms -> 'duration_hours') is distinct from 'number'
        or jsonb_typeof(v_terms -> 'duration_days') is distinct from 'number'
        or jsonb_typeof(v_terms -> 'deadline_at') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'milestones') is distinct from 'array'
        or jsonb_typeof(v_terms -> 'acceptance_criteria') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'no_show_terms') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'cancellation_terms') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'dispute_terms') is distinct from 'string'
      then
        raise exception using errcode = '22023', message = 'Service agreement field types are invalid.';
      end if;

      if jsonb_array_length(v_terms -> 'deliverables') < 1
        or jsonb_array_length(v_terms -> 'deliverables') > 50
        or exists (
          select 1
          from jsonb_array_elements(v_terms -> 'deliverables') entries(value)
          where jsonb_typeof(entries.value) <> 'string'
            or nullif(btrim(entries.value #>> '{}'), '') is null
        )
        or jsonb_array_length(v_terms -> 'milestones') < 1
        or jsonb_array_length(v_terms -> 'milestones') > 50
        or exists (
          select 1
          from jsonb_array_elements(v_terms -> 'milestones') entries(value)
          where jsonb_typeof(entries.value) <> 'string'
            or nullif(btrim(entries.value #>> '{}'), '') is null
        )
      then
        raise exception using errcode = '22023', message = 'Service deliverables or milestones are invalid.';
      end if;

      v_timezone := btrim(v_terms ->> 'timezone');
      v_deadline := (v_terms ->> 'deadline_at')::timestamptz;
      v_hours := (v_terms ->> 'duration_hours')::integer;
      v_days := (v_terms ->> 'duration_days')::integer;

      if v_terms ->> 'delivery_mode' not in ('remote', 'physical', 'hybrid')
        or not exists (
          select 1 from pg_catalog.pg_timezone_names where name = v_timezone
        )
        or (v_hours < 1 and v_days < 1)
        or v_hours < 0
        or v_days < 0
        or v_deadline <= now()
        or (v_service.available_date_until is not null and v_deadline::date > v_service.available_date_until)
        or nullif(btrim(v_terms ->> 'acceptance_criteria'), '') is null
        or nullif(btrim(v_terms ->> 'no_show_terms'), '') is null
        or nullif(btrim(v_terms ->> 'cancellation_terms'), '') is null
        or nullif(btrim(v_terms ->> 'dispute_terms'), '') is null
        or length(v_terms ->> 'acceptance_criteria') > 2000
        or length(v_terms ->> 'no_show_terms') > 1500
        or length(v_terms ->> 'cancellation_terms') > 1500
        or length(v_terms ->> 'dispute_terms') > 1500
      then
        raise exception using errcode = '22023', message = 'Service agreement terms are incomplete.';
      end if;

      v_normalized := v_normalized || jsonb_build_array(jsonb_build_object(
        'item_id', v_source.id,
        'domain', 'service',
        'terms', jsonb_build_object(
          'delivery_mode', v_terms ->> 'delivery_mode',
          'timezone', v_timezone,
          'deliverables', v_terms -> 'deliverables',
          'duration_hours', v_hours,
          'duration_days', v_days,
          'deadline_at', v_deadline,
          'milestones', v_terms -> 'milestones',
          'acceptance_criteria', btrim(v_terms ->> 'acceptance_criteria'),
          'no_show_terms', btrim(v_terms ->> 'no_show_terms'),
          'cancellation_terms', btrim(v_terms ->> 'cancellation_terms'),
          'dispute_terms', btrim(v_terms ->> 'dispute_terms')
        )
      ));

    else
      select e.*
      into v_event
      from public.events_listings e
      where e.item_id = v_source.id
        and e.status = 'active';

      if not found then
        raise exception using errcode = '23514', message = 'Event listing is unavailable.';
      end if;

      select key
      into v_unknown_key
      from jsonb_object_keys(v_terms) keys(key)
      where key not in (
        'quantity', 'transferable', 'issuer_rule_confirmed',
        'issuer_rule_source', 'transfer_deadline_at', 'bundle',
        'proof_required', 'transfer_notes'
      )
      limit 1;

      if v_unknown_key is not null then
        raise exception using errcode = '22023', message = format('Unsupported event agreement field: %s', v_unknown_key);
      end if;

      if jsonb_typeof(v_terms -> 'quantity') is distinct from 'number'
        or jsonb_typeof(v_terms -> 'transferable') is distinct from 'boolean'
        or jsonb_typeof(v_terms -> 'issuer_rule_confirmed') is distinct from 'boolean'
        or jsonb_typeof(v_terms -> 'issuer_rule_source') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'transfer_deadline_at') is distinct from 'string'
        or jsonb_typeof(v_terms -> 'bundle') is distinct from 'object'
        or jsonb_typeof(v_terms -> 'proof_required') is distinct from 'boolean'
        or jsonb_typeof(v_terms -> 'transfer_notes') is distinct from 'string'
      then
        raise exception using errcode = '22023', message = 'Event agreement field types are invalid.';
      end if;

      v_bundle := v_terms -> 'bundle';
      select key
      into v_unknown_key
      from jsonb_object_keys(v_bundle) keys(key)
      where key not in ('ticket', 'accommodation', 'transport')
      limit 1;

      if v_unknown_key is not null
        or jsonb_typeof(v_bundle -> 'ticket') is distinct from 'boolean'
        or jsonb_typeof(v_bundle -> 'accommodation') is distinct from 'boolean'
        or jsonb_typeof(v_bundle -> 'transport') is distinct from 'boolean'
      then
        raise exception using errcode = '22023', message = 'Event bundle is invalid.';
      end if;

      v_quantity := (v_terms ->> 'quantity')::integer;
      v_capacity := greatest(0, coalesce(v_event.capacity_available, v_event.capacity_total, 0));
      v_deadline := (v_terms ->> 'transfer_deadline_at')::timestamptz;

      if v_quantity < 1
        or v_quantity > v_capacity
        or coalesce(v_event.is_transferable, false) is not true
        or coalesce(v_event.transfer_rule_confirmed, false) is not true
        or (v_terms ->> 'transferable')::boolean is not true
        or (v_terms ->> 'issuer_rule_confirmed')::boolean is not true
        or nullif(btrim(v_terms ->> 'issuer_rule_source'), '') is null
        or btrim(v_terms ->> 'issuer_rule_source') is distinct from btrim(coalesce(v_event.transfer_rule_source, ''))
        or v_deadline <= now()
        or (v_event.transfer_deadline_at is not null and v_deadline > v_event.transfer_deadline_at)
        or (v_event.start_date is not null and v_deadline::date >= v_event.start_date)
        or not (
          coalesce((v_bundle ->> 'ticket')::boolean, false)
          or coalesce((v_bundle ->> 'accommodation')::boolean, false)
          or coalesce((v_bundle ->> 'transport')::boolean, false)
        )
        or (coalesce((v_bundle ->> 'accommodation')::boolean, false) and coalesce(v_event.includes_accommodation, false) is not true)
        or (coalesce((v_bundle ->> 'transport')::boolean, false) and coalesce(v_event.includes_transport, false) is not true)
        or (v_terms ->> 'proof_required')::boolean is not true
        or nullif(btrim(v_terms ->> 'transfer_notes'), '') is null
        or length(v_terms ->> 'transfer_notes') > 2000
      then
        raise exception using errcode = '22023', message = 'Event agreement terms are incomplete or incompatible with issuer rules.';
      end if;

      v_normalized := v_normalized || jsonb_build_array(jsonb_build_object(
        'item_id', v_source.id,
        'domain', 'event',
        'terms', jsonb_build_object(
          'quantity', v_quantity,
          'transferable', true,
          'issuer_rule_confirmed', true,
          'issuer_rule_source', btrim(v_terms ->> 'issuer_rule_source'),
          'transfer_deadline_at', v_deadline,
          'bundle', jsonb_build_object(
            'ticket', (v_bundle ->> 'ticket')::boolean,
            'accommodation', (v_bundle ->> 'accommodation')::boolean,
            'transport', (v_bundle ->> 'transport')::boolean
          ),
          'proof_required', true,
          'transfer_notes', btrim(v_terms ->> 'transfer_notes')
        )
      ));
    end if;
  end loop;

  return v_normalized;
end;
$function$;

revoke all on function private.validate_match_agreement_domain_terms_v1(uuid, jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.update_match_conversation_agreement_v2(
  p_conversation_id uuid,
  p_action text,
  p_expected_revision integer,
  p_idempotency_key text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_existing_receipt public.match_agreement_mutation_receipts%rowtype;
  v_allowed_actions constant text[] := array['save', 'confirm', 'withdraw'];
  v_allowed_logistics constant text[] := array[
    'local_handover', 'national_courier', 'international_courier', 'other'
  ];
  v_allowed_stages constant text[] := array[
    'interest', 'condition', 'offer', 'logistics', 'agreement'
  ];
  v_unknown_key text;
  v_request_hash text;
  v_agreement jsonb := '{}'::jsonb;
  v_content jsonb := '{}'::jsonb;
  v_domain_terms jsonb := '[]'::jsonb;
  v_confirmed jsonb := '[]'::jsonb;
  v_confirmations jsonb := '{}'::jsonb;
  v_completed jsonb := '[]'::jsonb;
  v_revision integer := 0;
  v_content_hash text := '';
  v_condition text := '';
  v_offer text := '';
  v_logistics_method text := null;
  v_logistics_notes text := '';
  v_additional text := '';
  v_active_stage text := 'agreement';
  v_now timestamptz := clock_timestamp();
  v_next jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_action is null or not (p_action = any(v_allowed_actions)) then
    raise exception using errcode = '22023', message = 'Invalid agreement action.';
  end if;

  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Invalid expected agreement revision.';
  end if;

  if p_idempotency_key is null
    or char_length(p_idempotency_key) not between 8 and 120
    or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$'
  then
    raise exception using errcode = '22023', message = 'Invalid agreement idempotency key.';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception using errcode = '22023', message = 'Agreement payload must be an object.';
  end if;

  v_request_hash := encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'action', p_action,
          'expected_revision', p_expected_revision,
          'payload', coalesce(p_payload, '{}'::jsonb)
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_actor::text || ':' || p_conversation_id::text || ':' || p_action || ':' || p_idempotency_key,
      0
    )
  );

  select *
  into v_existing_receipt
  from public.match_agreement_mutation_receipts r
  where r.actor_id = v_actor
    and r.conversation_id = p_conversation_id
    and r.action = p_action
    and r.idempotency_key = p_idempotency_key;

  if found then
    if v_existing_receipt.request_hash <> v_request_hash then
      raise exception using errcode = '23505', message = 'Agreement idempotency key was reused with a different request.';
    end if;
    return v_existing_receipt.response;
  end if;

  select c.*
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id
  for update;

  if not found or v_conversation.match_id is null then
    raise exception using errcode = 'P0002', message = 'Match conversation not found.';
  end if;

  if cardinality(v_conversation.participant_ids) <> 2
    or not (v_actor = any(v_conversation.participant_ids))
  then
    raise exception using errcode = '42501', message = 'Conversation access denied.';
  end if;

  if not exists (
    select 1
    from public.matches m
    where m.id = v_conversation.match_id
      and m.status = 'accepted'
      and m.initiator_id = any(v_conversation.participant_ids)
      and m.target_user_id = any(v_conversation.participant_ids)
  ) then
    raise exception using errcode = '42501', message = 'Accepted match required.';
  end if;

  if v_conversation.swap_id is not null then
    raise exception using errcode = '23514', message = 'Agreement is frozen inside the Exchange.';
  end if;

  if jsonb_typeof(v_conversation.agenda_state -> 'agreement') = 'object' then
    v_agreement := v_conversation.agenda_state -> 'agreement';
  end if;

  if coalesce(v_agreement ->> 'revision', '') ~ '^[0-9]+$' then
    v_revision := (v_agreement ->> 'revision')::integer;
  end if;

  if p_expected_revision <> v_revision then
    raise exception using errcode = '40001', message = 'Agreement revision conflict.';
  end if;

  v_condition := left(coalesce(v_agreement ->> 'condition_notes', ''), 1000);
  v_offer := left(coalesce(v_agreement ->> 'offer_notes', ''), 1000);
  v_logistics_method := nullif(v_agreement ->> 'logistics_method', '');
  v_logistics_notes := left(coalesce(v_agreement ->> 'logistics_notes', ''), 1000);
  v_additional := left(coalesce(v_agreement ->> 'additional_terms', ''), 1500);
  v_content_hash := coalesce(v_agreement ->> 'content_hash', '');

  if jsonb_typeof(v_agreement -> 'domain_terms') = 'array' then
    v_domain_terms := v_agreement -> 'domain_terms';
  end if;
  if jsonb_typeof(v_agreement -> 'confirmed_by') = 'array' then
    v_confirmed := v_agreement -> 'confirmed_by';
  end if;
  if jsonb_typeof(v_agreement -> 'confirmations') = 'object' then
    v_confirmations := v_agreement -> 'confirmations';
  end if;

  select coalesce(jsonb_agg(x.stage order by x.first_position), '[]'::jsonb)
  into v_completed
  from (
    select stage_value as stage, min(stage_position) as first_position
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(v_conversation.agenda_state -> 'completed_stages') = 'array'
          then v_conversation.agenda_state -> 'completed_stages'
        else '[]'::jsonb
      end
    ) with ordinality as stages(stage_value, stage_position)
    where stage_value = any(v_allowed_stages)
    group by stage_value
  ) x;

  if coalesce(v_conversation.agenda_state ->> 'active_stage', '') = any(v_allowed_stages) then
    v_active_stage := v_conversation.agenda_state ->> 'active_stage';
  end if;

  if p_action = 'save' then
    select key
    into v_unknown_key
    from jsonb_object_keys(p_payload) keys(key)
    where key not in (
      'condition_notes', 'offer_notes', 'logistics_method',
      'logistics_notes', 'additional_terms', 'domain_terms'
    )
    limit 1;

    if v_unknown_key is not null then
      raise exception using errcode = '22023', message = format('Unsupported agreement field: %s', v_unknown_key);
    end if;

    v_condition := btrim(coalesce(p_payload ->> 'condition_notes', ''));
    v_offer := btrim(coalesce(p_payload ->> 'offer_notes', ''));
    v_logistics_method := nullif(btrim(coalesce(p_payload ->> 'logistics_method', '')), '');
    v_logistics_notes := btrim(coalesce(p_payload ->> 'logistics_notes', ''));
    v_additional := btrim(coalesce(p_payload ->> 'additional_terms', ''));

    if length(v_condition) > 1000
      or length(v_offer) > 1000
      or length(v_logistics_notes) > 1000
      or length(v_additional) > 1500
    then
      raise exception using errcode = '22001', message = 'Agreement text is too long.';
    end if;

    if v_logistics_method is not null
      and not (v_logistics_method = any(v_allowed_logistics))
    then
      raise exception using errcode = '22023', message = 'Invalid logistics method.';
    end if;

    v_domain_terms := private.validate_match_agreement_domain_terms_v1(
      p_conversation_id,
      coalesce(p_payload -> 'domain_terms', '[]'::jsonb)
    );

    if jsonb_array_length(v_domain_terms) = 0
      and not (
        length(v_condition) > 0
        or length(v_offer) > 0
        or v_logistics_method is not null
        or length(v_logistics_notes) > 0
        or length(v_additional) > 0
      )
    then
      raise exception using errcode = '22023', message = 'Agreement cannot be empty.';
    end if;

    v_content := jsonb_build_object(
      'condition_notes', v_condition,
      'offer_notes', v_offer,
      'logistics_method', v_logistics_method,
      'logistics_notes', v_logistics_notes,
      'additional_terms', v_additional,
      'domain_terms', v_domain_terms
    );
    v_content_hash := encode(
      extensions.digest(convert_to(v_content::text, 'UTF8'), 'sha256'),
      'hex'
    );
    v_revision := v_revision + 1;
    v_confirmed := '[]'::jsonb;
    v_confirmations := '{}'::jsonb;
    v_active_stage := 'agreement';

  elsif p_action = 'confirm' then
    if v_revision < 1
      or v_agreement ->> 'schema_version' is distinct from '3.0'
      or v_content_hash !~ '^[a-f0-9]{64}$'
    then
      raise exception using errcode = '22023', message = 'Save the domain agreement before confirming it.';
    end if;

    v_domain_terms := private.validate_match_agreement_domain_terms_v1(
      p_conversation_id,
      v_domain_terms
    );

    v_content := jsonb_build_object(
      'condition_notes', v_condition,
      'offer_notes', v_offer,
      'logistics_method', v_logistics_method,
      'logistics_notes', v_logistics_notes,
      'additional_terms', v_additional,
      'domain_terms', v_domain_terms
    );

    if encode(
      extensions.digest(convert_to(v_content::text, 'UTF8'), 'sha256'),
      'hex'
    ) <> v_content_hash then
      raise exception using errcode = '40001', message = 'Agreement content hash conflict.';
    end if;

    if not (v_confirmed ? v_actor::text) then
      v_confirmed := v_confirmed || jsonb_build_array(v_actor::text);
    end if;
    v_confirmations := jsonb_set(
      v_confirmations,
      array[v_actor::text],
      jsonb_build_object(
        'revision', v_revision,
        'content_hash', v_content_hash,
        'confirmed_at', v_now
      ),
      true
    );

  else
    select coalesce(jsonb_agg(value order by position), '[]'::jsonb)
    into v_confirmed
    from jsonb_array_elements_text(v_confirmed)
      with ordinality as entries(value, position)
    where value <> v_actor::text;
    v_confirmations := v_confirmations - v_actor::text;
  end if;

  select coalesce(jsonb_agg(value order by position), '[]'::jsonb)
  into v_completed
  from jsonb_array_elements_text(v_completed)
    with ordinality as entries(value, position)
  where value <> 'agreement';

  if jsonb_array_length(v_confirmed) = 2
    and (v_confirmations -> v_conversation.participant_ids[1]::text ->> 'revision')::integer = v_revision
    and (v_confirmations -> v_conversation.participant_ids[2]::text ->> 'revision')::integer = v_revision
    and v_confirmations -> v_conversation.participant_ids[1]::text ->> 'content_hash' = v_content_hash
    and v_confirmations -> v_conversation.participant_ids[2]::text ->> 'content_hash' = v_content_hash
  then
    v_completed := v_completed || jsonb_build_array('agreement');
  end if;

  v_agreement := jsonb_build_object(
    'schema_version', '3.0',
    'revision', v_revision,
    'content_hash', v_content_hash,
    'condition_notes', v_condition,
    'offer_notes', v_offer,
    'logistics_method', v_logistics_method,
    'logistics_notes', v_logistics_notes,
    'additional_terms', v_additional,
    'domain_terms', v_domain_terms,
    'confirmed_by', v_confirmed,
    'confirmations', v_confirmations,
    'updated_by', v_actor,
    'updated_at', v_now
  );

  v_next := (
    case
      when jsonb_typeof(v_conversation.agenda_state) = 'object'
        then v_conversation.agenda_state
      else '{}'::jsonb
    end
  ) || jsonb_build_object(
    'version', 3,
    'conversation_id', v_conversation.id,
    'active_stage', v_active_stage,
    'completed_stages', v_completed,
    'agreement', v_agreement,
    'updated_by', v_actor,
    'updated_at', v_now
  );

  update public.conversations c
  set agenda_state = v_next,
      updated_at = v_now
  where c.id = p_conversation_id;

  insert into public.match_agreement_mutation_receipts (
    actor_id,
    conversation_id,
    action,
    idempotency_key,
    request_hash,
    response
  ) values (
    v_actor,
    p_conversation_id,
    p_action,
    p_idempotency_key,
    v_request_hash,
    v_next
  );

  return v_next;
end;
$function$;

revoke all on function public.update_match_conversation_agreement_v2(
  uuid, text, integer, text, jsonb
) from public, anon;
grant execute on function public.update_match_conversation_agreement_v2(
  uuid, text, integer, text, jsonb
) to authenticated;

create or replace function public.update_match_conversation_agreement(
  p_conversation_id uuid,
  p_action text,
  p_expected_revision integer,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_legacy_key text;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  v_legacy_key := 'legacy:' || encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'actor', v_actor,
          'conversation', p_conversation_id,
          'action', p_action,
          'expected_revision', p_expected_revision,
          'payload', coalesce(p_payload, '{}'::jsonb)
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  return public.update_match_conversation_agreement_v2(
    p_conversation_id,
    p_action,
    p_expected_revision,
    v_legacy_key,
    coalesce(p_payload, '{}'::jsonb)
  );
end;
$function$;

revoke all on function public.update_match_conversation_agreement(
  uuid, text, integer, jsonb
) from public, anon;
grant execute on function public.update_match_conversation_agreement(
  uuid, text, integer, jsonb
) to authenticated;

create or replace function public.create_exchange_from_match_agreement(
  p_conversation_id uuid,
  p_expected_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_agreement jsonb := '{}'::jsonb;
  v_confirmations jsonb := '{}'::jsonb;
  v_domain_terms jsonb := '[]'::jsonb;
  v_revision integer := 0;
  v_content_hash text := '';
  v_result jsonb;
  v_swap_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception using errcode = '22023', message = 'A saved agreement revision is required.';
  end if;

  select c.*
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id
  for update;

  if not found or v_conversation.match_id is null then
    raise exception using errcode = 'P0002', message = 'Match conversation not found.';
  end if;

  if cardinality(v_conversation.participant_ids) <> 2
    or not (v_actor = any(v_conversation.participant_ids))
  then
    raise exception using errcode = '42501', message = 'Conversation access denied.';
  end if;

  if jsonb_typeof(v_conversation.agenda_state -> 'agreement') = 'object' then
    v_agreement := v_conversation.agenda_state -> 'agreement';
  end if;

  if coalesce(v_agreement ->> 'revision', '') ~ '^[0-9]+$' then
    v_revision := (v_agreement ->> 'revision')::integer;
  end if;

  if p_expected_revision <> v_revision then
    raise exception using errcode = '40001', message = 'Agreement revision conflict.';
  end if;

  if v_agreement ->> 'schema_version' is distinct from '3.0'
    or coalesce(v_agreement ->> 'content_hash', '') !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(v_agreement -> 'domain_terms') is distinct from 'array'
    or jsonb_typeof(v_agreement -> 'confirmations') is distinct from 'object'
    or jsonb_typeof(v_agreement -> 'confirmed_by') is distinct from 'array'
  then
    raise exception using errcode = '22023', message = 'A complete domain agreement is required.';
  end if;

  v_content_hash := v_agreement ->> 'content_hash';
  v_confirmations := v_agreement -> 'confirmations';
  v_domain_terms := private.validate_match_agreement_domain_terms_v1(
    p_conversation_id,
    v_agreement -> 'domain_terms'
  );

  if v_domain_terms <> v_agreement -> 'domain_terms'
    or not (v_agreement -> 'confirmed_by' ? v_conversation.participant_ids[1]::text)
    or not (v_agreement -> 'confirmed_by' ? v_conversation.participant_ids[2]::text)
    or (v_confirmations -> v_conversation.participant_ids[1]::text ->> 'revision')::integer <> v_revision
    or (v_confirmations -> v_conversation.participant_ids[2]::text ->> 'revision')::integer <> v_revision
    or v_confirmations -> v_conversation.participant_ids[1]::text ->> 'content_hash' <> v_content_hash
    or v_confirmations -> v_conversation.participant_ids[2]::text ->> 'content_hash' <> v_content_hash
    or not coalesce(v_conversation.agenda_state -> 'completed_stages' ? 'agreement', false)
  then
    raise exception using errcode = '42501', message = 'Both participants must confirm the same domain agreement revision and hash.';
  end if;

  v_result := public.create_exchange_from_match_agreement_v1(
    p_conversation_id,
    p_expected_revision
  );
  v_swap_id := (v_result ->> 'swap_id')::uuid;

  update public.swaps s
  set agreement_revision = v_revision,
      swap_metadata = coalesce(s.swap_metadata, '{}'::jsonb) || jsonb_build_object(
        'agreement_revision', v_revision,
        'agreement_hash', v_content_hash,
        'agreement_snapshot', v_agreement
      ),
      exchange_data = coalesce(s.exchange_data, '{}'::jsonb) || jsonb_build_object(
        'agreement_revision', v_revision,
        'agreement_hash', v_content_hash,
        'agreement_snapshot', v_agreement,
        'domain_terms', v_domain_terms
      ),
      updated_at = clock_timestamp()
  where s.id = v_swap_id
    and s.conversation_id = p_conversation_id;

  return v_result || jsonb_build_object('agreement_hash', v_content_hash);
end;
$function$;

revoke all on function public.create_exchange_from_match_agreement(uuid, integer)
  from public, anon;
grant execute on function public.create_exchange_from_match_agreement(uuid, integer)
  to authenticated, service_role;

comment on table public.match_agreement_mutation_receipts is
  'V1-05.4.2 server-only exact-once receipts for bilateral agreement save/confirm/withdraw actions.';
comment on function public.get_match_agreement_context_v1(uuid) is
  'V1-05.4.2 participant-only, privacy-minimized context and defaults for domain-aware agreements.';
comment on function public.update_match_conversation_agreement_v2(
  uuid, text, integer, text, jsonb
) is
  'V1-05.4.2 idempotent participant-only agreement authority with domain contracts, revision and content hash.';
comment on function public.create_exchange_from_match_agreement(uuid, integer) is
  'V1-05.4.2 Exchange gate requiring both participants to confirm the same complete domain agreement revision and hash.';

commit;
