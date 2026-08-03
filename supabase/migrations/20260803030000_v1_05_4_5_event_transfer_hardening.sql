begin;

create or replace function private.ensure_event_transfers_for_swap_v1(
  p_swap_id uuid,
  p_actor_id uuid
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_swap public.swaps%rowtype;
  v_event_count integer;
  v_event_term_count integer;
  v_existing_count integer;
  v_source record;
  v_event public.events_listings%rowtype;
  v_entry jsonb;
  v_terms jsonb;
  v_provider uuid;
  v_recipient uuid;
  v_transfer_id uuid;
  v_quantity integer;
  v_available integer;
  v_deadline timestamptz;
  v_bundle jsonb;
  v_unknown_key text;
begin
  if p_swap_id is null then
    raise exception using errcode = '22023', message = 'Exchange id is required for Event transfer creation.';
  end if;

  select swap_row.*
  into v_swap
  from public.swaps swap_row
  where swap_row.id = p_swap_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Exchange not found for Event transfer creation.';
  end if;

  if v_swap.exchange_kind <> 'bilateral' then
    return 0;
  end if;

  select count(*)
  into v_event_count
  from public.items item_row
  where item_row.id in (v_swap.offered_item_id, v_swap.requested_item_id)
    and item_row.item_type = 'event';

  if v_event_count = 0 then
    return 0;
  end if;

  select count(*)
  into v_existing_count
  from public.event_transfers transfer_row
  where transfer_row.swap_id = v_swap.id;

  if v_existing_count > 0 then
    if v_existing_count = v_event_count
      and not exists (
        select 1
        from public.event_transfers transfer_row
        where transfer_row.swap_id = v_swap.id
          and transfer_row.event_item_id not in (
            v_swap.offered_item_id,
            v_swap.requested_item_id
          )
      )
      and not exists (
        select 1
        from public.items item_row
        where item_row.id in (v_swap.offered_item_id, v_swap.requested_item_id)
          and item_row.item_type = 'event'
          and not exists (
            select 1
            from public.event_transfers transfer_row
            where transfer_row.swap_id = v_swap.id
              and transfer_row.event_item_id = item_row.id
          )
      )
    then
      return v_existing_count;
    end if;

    raise exception using
      errcode = '23514',
      message = 'Event transfer creation is partially present or mismatched.';
  end if;

  if p_actor_id is null
    or p_actor_id not in (v_swap.requester_id, v_swap.responder_id)
  then
    raise exception using errcode = '42501', message = 'Event transfer creation requires an Exchange participant.';
  end if;

  if v_swap.conversation_id is null
    or v_swap.swap_metadata ->> 'source' is distinct from 'domain_aware_match_agreement'
    or coalesce(v_swap.swap_metadata ->> 'agreement_hash', '') !~ '^[a-f0-9]{64}$'
    or v_swap.agreement_revision < 1
    or jsonb_typeof(v_swap.exchange_data -> 'domain_terms') is distinct from 'array'
  then
    raise exception using errcode = '22023', message = 'Complete Event Agreement terms are required before transfer creation.';
  end if;

  select count(*)
  into v_event_term_count
  from jsonb_array_elements(v_swap.exchange_data -> 'domain_terms') term(value)
  where term.value ->> 'domain' = 'event';

  if v_event_term_count <> v_event_count then
    raise exception using errcode = '22023', message = 'Every Event in the Exchange requires one transfer contract.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_swap.exchange_data -> 'domain_terms') term(value)
    where term.value ->> 'domain' = 'event'
    group by term.value ->> 'item_id'
    having count(*) <> 1
  ) then
    raise exception using errcode = '22023', message = 'Duplicate Event transfer terms are not allowed.';
  end if;

  for v_source in
    select item_row.id as event_item_id, item_row.owner_id
    from public.items item_row
    where item_row.id in (v_swap.offered_item_id, v_swap.requested_item_id)
      and item_row.item_type = 'event'
    order by item_row.id
  loop
    v_provider := v_source.owner_id;

    if v_provider not in (v_swap.requester_id, v_swap.responder_id) then
      raise exception using errcode = '42501', message = 'Event provider is outside this Exchange.';
    end if;

    v_recipient := case
      when v_provider = v_swap.requester_id then v_swap.responder_id
      else v_swap.requester_id
    end;

    select term.value
    into v_entry
    from jsonb_array_elements(v_swap.exchange_data -> 'domain_terms') term(value)
    where term.value ->> 'domain' = 'event'
      and term.value ->> 'item_id' = v_source.event_item_id::text
    limit 1;

    if v_entry is null
      or jsonb_typeof(v_entry -> 'terms') is distinct from 'object'
    then
      raise exception using errcode = '22023', message = 'Event transfer contract item mismatch.';
    end if;

    v_terms := v_entry -> 'terms';

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
      raise exception using errcode = '22023', message = format(
        'Unsupported Event transfer field: %s',
        v_unknown_key
      );
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
      raise exception using errcode = '22023', message = 'Invalid Event transfer field types.';
    end if;

    v_quantity := (v_terms ->> 'quantity')::integer;
    v_deadline := (v_terms ->> 'transfer_deadline_at')::timestamptz;
    v_bundle := v_terms -> 'bundle';

    if v_quantity < 1
      or (v_terms ->> 'transferable')::boolean is not true
      or (v_terms ->> 'issuer_rule_confirmed')::boolean is not true
      or nullif(btrim(v_terms ->> 'issuer_rule_source'), '') is null
      or char_length(v_terms ->> 'issuer_rule_source') > 2000
      or (v_terms ->> 'proof_required')::boolean is not true
      or nullif(btrim(v_terms ->> 'transfer_notes'), '') is null
      or char_length(v_terms ->> 'transfer_notes') > 2000
      or v_deadline <= clock_timestamp()
      or jsonb_typeof(v_bundle -> 'ticket') is distinct from 'boolean'
      or jsonb_typeof(v_bundle -> 'accommodation') is distinct from 'boolean'
      or jsonb_typeof(v_bundle -> 'transport') is distinct from 'boolean'
      or not (
        (v_bundle ->> 'ticket')::boolean
        or (v_bundle ->> 'accommodation')::boolean
        or (v_bundle ->> 'transport')::boolean
      )
    then
      raise exception using errcode = '22023', message = 'Event transfer terms are incomplete.';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'event-transfer-capacity:' || v_source.event_item_id::text,
        0
      )
    );

    select event_row.*
    into v_event
    from public.events_listings event_row
    where event_row.item_id = v_source.event_item_id
      and event_row.status = 'active'
    for update;

    if not found
      or coalesce(v_event.is_transferable, false) is not true
      or coalesce(v_event.transfer_rule_confirmed, false) is not true
      or nullif(btrim(coalesce(v_event.transfer_rule_source, '')), '') is null
      or btrim(v_terms ->> 'issuer_rule_source') <> btrim(v_event.transfer_rule_source)
      or (
        v_event.transfer_deadline_at is not null
        and v_deadline > v_event.transfer_deadline_at
      )
      or (
        v_event.start_date is not null
        and v_deadline > ((
          v_event.start_date::timestamp
          + interval '23 hours 59 minutes 59 seconds'
        ) at time zone coalesce(v_event.timezone, 'UTC'))
      )
      or (
        coalesce((v_bundle ->> 'accommodation')::boolean, false)
        and coalesce(v_event.includes_accommodation, false) is not true
      )
      or (
        coalesce((v_bundle ->> 'transport')::boolean, false)
        and coalesce(v_event.includes_transport, false) is not true
      )
    then
      raise exception using errcode = '23514', message = 'Event listing is unavailable or its issuer transfer contract changed.';
    end if;

    v_available := greatest(
      0,
      coalesce(v_event.capacity_available, v_event.capacity_total, 0)
    );

    if v_quantity > v_available then
      raise exception using errcode = '23P01', message = 'Event transfer capacity is unavailable.';
    end if;

    update public.events_listings
    set capacity_available = v_available - v_quantity,
        updated_at = clock_timestamp()
    where item_id = v_source.event_item_id;

    insert into public.event_transfers (
      event_item_id,
      swap_id,
      conversation_id,
      provider_id,
      recipient_id,
      agreement_revision,
      agreement_hash,
      quantity,
      issuer_rule_source,
      transfer_deadline_at,
      bundle,
      proof_required,
      transfer_notes
    ) values (
      v_source.event_item_id,
      v_swap.id,
      v_swap.conversation_id,
      v_provider,
      v_recipient,
      v_swap.agreement_revision,
      v_swap.swap_metadata ->> 'agreement_hash',
      v_quantity,
      btrim(v_terms ->> 'issuer_rule_source'),
      v_deadline,
      v_bundle,
      true,
      btrim(v_terms ->> 'transfer_notes')
    )
    returning id into v_transfer_id;

    insert into public.event_transfer_events (
      transfer_id,
      swap_id,
      actor_id,
      event_type,
      transfer_revision,
      metadata
    ) values (
      v_transfer_id,
      v_swap.id,
      p_actor_id,
      'created',
      0,
      jsonb_build_object(
        'agreement_revision', v_swap.agreement_revision,
        'agreement_hash', v_swap.swap_metadata ->> 'agreement_hash',
        'quantity', v_quantity,
        'transfer_deadline_at', v_deadline,
        'bundle', v_bundle
      )
    );
  end loop;

  select count(*)
  into v_existing_count
  from public.event_transfers transfer_row
  where transfer_row.swap_id = v_swap.id;

  if v_existing_count <> v_event_count then
    raise exception using errcode = '23514', message = 'Event transfer creation is incomplete.';
  end if;

  return v_existing_count;
end;
$function$;

revoke all on function private.ensure_event_transfers_for_swap_v1(uuid, uuid)
  from public, anon, authenticated, service_role;

create or replace function private.create_event_transfers_on_exchange_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  perform private.ensure_event_transfers_for_swap_v1(new.id, auth.uid());
  return new;
end;
$function$;

revoke all on function private.create_event_transfers_on_exchange_v1()
  from public, anon, authenticated, service_role;

create or replace function private.event_transfer_completion_guard_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_expected_count integer;
  v_actual_count integer;
begin
  if old.status is not distinct from new.status
    or new.status <> 'completed'
  then
    return new;
  end if;

  select count(*)
  into v_expected_count
  from public.items item_row
  where item_row.id in (new.offered_item_id, new.requested_item_id)
    and item_row.item_type = 'event';

  if v_expected_count = 0 then
    return new;
  end if;

  select count(*)
  into v_actual_count
  from public.event_transfers transfer_row
  where transfer_row.swap_id = new.id;

  if v_actual_count <> v_expected_count
    or exists (
      select 1
      from public.event_transfers transfer_row
      where transfer_row.swap_id = new.id
        and transfer_row.status <> 'confirmed'
    )
  then
    raise exception using
      errcode = '23514',
      message = 'Every Event Exchange must have one confirmed transfer per Event before completion.';
  end if;

  return new;
end;
$function$;

revoke all on function private.event_transfer_completion_guard_v1()
  from public, anon, authenticated, service_role;

create or replace function private.enforce_event_capacity_holds_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_held_quantity integer;
  v_lock_acquired boolean;
  v_max_available integer;
begin
  if new.item_id is distinct from old.item_id then
    raise exception using errcode = '23514', message = 'Event listing item identity is immutable.';
  end if;

  v_lock_acquired := pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'event-transfer-capacity:' || new.item_id::text,
      0
    )
  );

  if not v_lock_acquired then
    raise exception using
      errcode = '40001',
      message = 'Event capacity changed concurrently; retry the listing update.';
  end if;

  select coalesce(sum(transfer_row.quantity), 0)::integer
  into v_held_quantity
  from public.event_transfers transfer_row
  where transfer_row.event_item_id = new.item_id
    and transfer_row.capacity_released_at is null;

  if v_held_quantity = 0 then
    return new;
  end if;

  if new.capacity_total is null
    or new.capacity_total < v_held_quantity
  then
    raise exception using
      errcode = '23514',
      message = 'Event capacity total cannot be lower than held or consumed transfer quantity.';
  end if;

  v_max_available := greatest(new.capacity_total - v_held_quantity, 0);

  if new.capacity_available is null
    or new.capacity_available > v_max_available
  then
    raise exception using
      errcode = '23514',
      message = 'Event capacity update would overwrite reserved Event transfer capacity.';
  end if;

  return new;
end;
$function$;

revoke all on function private.enforce_event_capacity_holds_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists aaa_enforce_event_capacity_holds_v1
  on public.events_listings;
create trigger aaa_enforce_event_capacity_holds_v1
before update of capacity_total, capacity_available on public.events_listings
for each row
execute function private.enforce_event_capacity_holds_v1();

create or replace function private.release_event_transfer_capacity_v1(
  p_transfer_id uuid,
  p_reason text,
  p_actor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_transfer public.event_transfers%rowtype;
  v_event public.events_listings%rowtype;
  v_current_capacity integer;
  v_next_capacity integer;
begin
  select transfer_row.*
  into v_transfer
  from public.event_transfers transfer_row
  where transfer_row.id = p_transfer_id
  for update;

  if not found
    or v_transfer.capacity_released_at is not null
    or v_transfer.confirmed_at is not null
  then
    return false;
  end if;

  if v_transfer.status not in ('cancelled', 'resolved') then
    raise exception using
      errcode = '23514',
      message = 'Event transfer capacity can be released only from a terminal unconfirmed transfer.';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'event-transfer-capacity:' || v_transfer.event_item_id::text,
      0
    )
  );

  select event_row.*
  into v_event
  from public.events_listings event_row
  where event_row.item_id = v_transfer.event_item_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Event listing is unavailable for capacity release.';
  end if;

  update public.event_transfers
  set capacity_released_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_transfer_id
    and capacity_released_at is null
    and confirmed_at is null
  returning * into v_transfer;

  if not found then
    return false;
  end if;

  v_current_capacity := greatest(
    0,
    coalesce(v_event.capacity_available, 0)
  );
  v_next_capacity := v_current_capacity + v_transfer.quantity;

  if v_event.capacity_total is not null then
    v_next_capacity := least(v_next_capacity, greatest(0, v_event.capacity_total));
  end if;

  update public.events_listings
  set capacity_available = v_next_capacity,
      updated_at = clock_timestamp()
  where item_id = v_transfer.event_item_id;

  insert into public.event_transfer_events (
    transfer_id,
    swap_id,
    actor_id,
    event_type,
    transfer_revision,
    proof_revision,
    metadata
  ) values (
    v_transfer.id,
    v_transfer.swap_id,
    p_actor_id,
    'capacity_released',
    v_transfer.revision,
    nullif(v_transfer.proof_revision, 0),
    jsonb_build_object(
      'reason', p_reason,
      'quantity', v_transfer.quantity,
      'capacity_available', v_next_capacity
    )
  );

  return true;
end;
$function$;

revoke all on function private.release_event_transfer_capacity_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;

create or replace function private.backfill_event_transfers_v1()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_swap record;
  v_processed integer := 0;
  v_changed record;
begin
  if exists (
    select 1
    from public.swaps swap_row
    where swap_row.status = 'completed'
      and exists (
        select 1
        from public.items item_row
        where item_row.id in (
          swap_row.offered_item_id,
          swap_row.requested_item_id
        )
          and item_row.item_type = 'event'
      )
      and (
        (
          select count(*)
          from public.event_transfers transfer_row
          where transfer_row.swap_id = swap_row.id
        ) <> (
          select count(*)
          from public.items item_row
          where item_row.id in (
            swap_row.offered_item_id,
            swap_row.requested_item_id
          )
            and item_row.item_type = 'event'
        )
        or exists (
          select 1
          from public.event_transfers transfer_row
          where transfer_row.swap_id = swap_row.id
            and transfer_row.status <> 'confirmed'
        )
      )
  ) then
    raise exception using
      errcode = '23514',
      message = 'A completed Event Exchange lacks confirmed transfer history and requires explicit remediation.';
  end if;

  for v_swap in
    select distinct
      swap_row.id,
      swap_row.requester_id,
      swap_row.status
    from public.swaps swap_row
    join public.items item_row
      on item_row.id in (
        swap_row.offered_item_id,
        swap_row.requested_item_id
      )
      and item_row.item_type = 'event'
    where swap_row.exchange_kind = 'bilateral'
      and swap_row.status in ('pending', 'accepted', 'in_progress', 'disputed')
    order by swap_row.id
  loop
    perform private.ensure_event_transfers_for_swap_v1(
      v_swap.id,
      v_swap.requester_id
    );
    v_processed := v_processed + 1;

    if v_swap.status = 'disputed' then
      for v_changed in
        update public.event_transfers
        set status = 'disputed',
            revision = revision + 1,
            updated_at = clock_timestamp()
        where swap_id = v_swap.id
          and status not in ('disputed', 'cancelled', 'resolved')
        returning id, revision, proof_revision
      loop
        insert into public.event_transfer_events (
          transfer_id,
          swap_id,
          actor_id,
          event_type,
          transfer_revision,
          proof_revision,
          metadata
        ) values (
          v_changed.id,
          v_swap.id,
          v_swap.requester_id,
          'disputed',
          v_changed.revision,
          nullif(v_changed.proof_revision, 0),
          jsonb_build_object('source', 'migration_backfill')
        );
      end loop;
    end if;
  end loop;

  return v_processed;
end;
$function$;

revoke all on function private.backfill_event_transfers_v1()
  from public, anon, authenticated, service_role;

select private.backfill_event_transfers_v1();

comment on function private.ensure_event_transfers_for_swap_v1(uuid, uuid) is
  'V1-05.4.5 idempotently creates one Event transfer and capacity hold per Event in a bilateral Exchange.';
comment on function private.backfill_event_transfers_v1() is
  'V1-05.4.5 backfills active Event Exchanges and fails closed for completed Exchanges without confirmed transfer history.';
comment on function private.enforce_event_capacity_holds_v1() is
  'V1-05.4.5 prevents listing edits or direct updates from overwriting held or consumed Event transfer capacity.';

commit;
