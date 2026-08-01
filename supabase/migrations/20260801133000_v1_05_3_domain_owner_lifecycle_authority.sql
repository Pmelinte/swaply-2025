begin;

alter table public.items
  add column if not exists owner_revision bigint not null default 1;

alter table public.items
  drop constraint if exists items_owner_revision_positive;

alter table public.items
  add constraint items_owner_revision_positive
  check (owner_revision >= 1);

create table if not exists public.domain_listing_mutation_receipts (
  actor_id uuid not null,
  item_id uuid not null references public.items(id) on delete cascade,
  domain text not null check (domain in ('property', 'service', 'event')),
  operation text not null check (operation in ('edit', 'status')),
  idempotency_key text not null,
  request_hash text not null,
  expected_revision bigint not null,
  resulting_revision bigint not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, item_id, operation, idempotency_key),
  check (char_length(idempotency_key) between 8 and 120),
  check (expected_revision >= 1),
  check (resulting_revision >= expected_revision)
);

alter table public.domain_listing_mutation_receipts enable row level security;

revoke all on table public.domain_listing_mutation_receipts
  from public, anon, authenticated;

create index if not exists domain_listing_mutation_receipts_item_created_idx
  on public.domain_listing_mutation_receipts (item_id, created_at desc);

create or replace function public.update_domain_listing_v1(
  p_domain text,
  p_item_id uuid,
  p_payload jsonb,
  p_expected_revision bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $function$
declare
  v_actor uuid := auth.uid();
  v_domain text := lower(btrim(coalesce(p_domain, '')));
  v_item jsonb;
  v_listing jsonb;
  v_private jsonb;
  v_table_name text;
  v_unknown_key text;
  v_request_hash text;
  v_existing public.domain_listing_mutation_receipts%rowtype;
  v_owner_id uuid;
  v_item_type text;
  v_current_revision bigint;
  v_resulting_revision bigint;
  v_status text;
  v_listing_id uuid;
  v_set_list text;
  v_sql text;
  v_start_date date;
  v_end_date date;
  v_transfer_deadline timestamptz;
  v_is_ticket boolean;
  v_response jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if v_domain not in ('property', 'service', 'event') then
    raise exception using errcode = '22023', message = 'Unsupported listing domain.';
  end if;

  if p_item_id is null then
    raise exception using errcode = '22023', message = 'Item id is required.';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception using errcode = '22023', message = 'Expected revision is required.';
  end if;

  if p_idempotency_key is null
    or char_length(btrim(p_idempotency_key)) not between 8 and 120
  then
    raise exception using errcode = '22023', message = 'A valid idempotency key is required.';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception using errcode = '22023', message = 'Payload must be an object.';
  end if;

  if coalesce(p_payload ->> 'schema_version', '') <> '1.0'
    or lower(coalesce(p_payload ->> 'domain', '')) <> v_domain
  then
    raise exception using errcode = '22023', message = 'Unsupported payload schema or domain.';
  end if;

  v_item := p_payload -> 'item';
  v_listing := p_payload -> 'listing';
  v_private := p_payload -> 'private';

  if jsonb_typeof(v_item) <> 'object'
    or jsonb_typeof(v_listing) <> 'object'
    or jsonb_typeof(v_private) <> 'object'
  then
    raise exception using errcode = '22023', message = 'Item, listing and private payloads must be objects.';
  end if;

  if nullif(btrim(v_item ->> 'title'), '') is null then
    raise exception using errcode = '22023', message = 'Listing title is required.';
  end if;

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(v_item) as keys(key)
  where keys.key not in (
    'title', 'description', 'category_l1', 'category_l2', 'category_l3',
    'category_path', 'perceived_value_tier', 'swap_geo_preference',
    'swap_open_to', 'chain_swap_allowed', 'cross_category_swap',
    'swap_partial_allowed', 'swap_partial_topup_eur', 'escrow_accepted',
    'escrow_required', 'swap_wants_description', 'swap_wants_type',
    'swap_wants_value_tier', 'location', 'location_city', 'location_country',
    'images', 'image_url'
  )
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported item field: %s', v_unknown_key);
  end if;

  if (v_item ? 'swap_open_to' and jsonb_typeof(v_item -> 'swap_open_to') <> 'array')
    or (v_item ? 'swap_wants_type' and jsonb_typeof(v_item -> 'swap_wants_type') <> 'array')
    or (v_item ? 'images' and jsonb_typeof(v_item -> 'images') <> 'array')
  then
    raise exception using errcode = '22023', message = 'Item arrays are invalid.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(coalesce(v_item -> 'swap_open_to', '[]'::jsonb)) as domains(value)
    where domains.value not in ('object', 'property', 'service', 'event')
  ) or exists (
    select 1
    from jsonb_array_elements_text(coalesce(v_item -> 'swap_wants_type', '[]'::jsonb)) as domains(value)
    where domains.value not in ('object', 'property', 'service', 'event')
  ) then
    raise exception using errcode = '22023', message = 'Unsupported swap domain.';
  end if;

  if v_private ? 'editor_payload'
    and jsonb_typeof(v_private -> 'editor_payload') <> 'object'
  then
    raise exception using errcode = '22023', message = 'editor_payload must be an object.';
  end if;
  if v_private ? 'exact_location'
    and jsonb_typeof(v_private -> 'exact_location') <> 'object'
  then
    raise exception using errcode = '22023', message = 'exact_location must be an object.';
  end if;
  if v_private ? 'transfer_data'
    and jsonb_typeof(v_private -> 'transfer_data') <> 'object'
  then
    raise exception using errcode = '22023', message = 'transfer_data must be an object.';
  end if;

  if position('"wifi_password"' in lower(v_private::text)) > 0 then
    raise exception using errcode = '22023', message = 'Wi-Fi credentials cannot be stored.';
  end if;

  v_table_name := case v_domain
    when 'property' then 'properties'
    when 'service' then 'services_listings'
    else 'events_listings'
  end;

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(v_listing) as keys(key)
  where keys.key in ('id', 'item_id', 'owner_id', 'created_at', 'updated_at', 'status')
     or not exists (
       select 1
       from information_schema.columns c
       where c.table_schema = 'public'
         and c.table_name = v_table_name
         and c.column_name = keys.key
     )
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported %s listing field: %s', v_domain, v_unknown_key);
  end if;

  if v_domain = 'property' then
    if nullif(btrim(v_listing ->> 'property_type'), '') is null
      or nullif(btrim(v_listing ->> 'listing_purpose'), '') is null
      or nullif(btrim(v_listing ->> 'exchange_type'), '') is null
    then
      raise exception using errcode = '22023', message = 'Property type, purpose and exchange type are required.';
    end if;

    if (v_listing ? 'available_from') and (v_listing ? 'available_until')
      and nullif(v_listing ->> 'available_from', '') is not null
      and nullif(v_listing ->> 'available_until', '') is not null
      and (v_listing ->> 'available_from')::date > (v_listing ->> 'available_until')::date
    then
      raise exception using errcode = '22023', message = 'Property availability range is invalid.';
    end if;

    if coalesce(nullif(v_listing ->> 'min_stay_days', '')::integer, 1) < 1
      or coalesce(nullif(v_listing ->> 'max_stay_days', '')::integer, 1)
        < coalesce(nullif(v_listing ->> 'min_stay_days', '')::integer, 1)
    then
      raise exception using errcode = '22023', message = 'Property stay limits are invalid.';
    end if;

    if nullif(v_listing ->> 'timezone', '') is not null
      and not exists (
        select 1
        from pg_catalog.pg_timezone_names
        where name = v_listing ->> 'timezone'
      )
    then
      raise exception using errcode = '22023', message = 'Unsupported property timezone.';
    end if;

    if exists (
      select 1
      from jsonb_object_keys(v_listing) as keys(key)
      where keys.key in (
        'property_manager_contact', 'insurance_provider', 'internal_notes',
        'verified_by', 'verification_method'
      )
    ) then
      raise exception using errcode = '22023', message = 'Private property fields cannot be public.';
    end if;
  elsif v_domain = 'service' then
    if nullif(btrim(v_listing ->> 'category_l1'), '') is null
      or nullif(btrim(v_listing ->> 'service_name'), '') is null
      or nullif(btrim(v_listing ->> 'delivery_mode'), '') is null
    then
      raise exception using errcode = '22023', message = 'Service category, name and delivery mode are required.';
    end if;

    if (v_listing ? 'available_date_from') and (v_listing ? 'available_date_until')
      and nullif(v_listing ->> 'available_date_from', '') is not null
      and nullif(v_listing ->> 'available_date_until', '') is not null
      and (v_listing ->> 'available_date_from')::date > (v_listing ->> 'available_date_until')::date
    then
      raise exception using errcode = '22023', message = 'Service availability range is invalid.';
    end if;

    if nullif(v_listing ->> 'timezone', '') is not null
      and not exists (
        select 1
        from pg_catalog.pg_timezone_names
        where name = v_listing ->> 'timezone'
      )
    then
      raise exception using errcode = '22023', message = 'Unsupported service timezone.';
    end if;

    if exists (
      select 1
      from jsonb_object_keys(v_listing) as keys(key)
      where keys.key in ('license_number', 'license_issuer', 'insurance_provider')
    ) then
      raise exception using errcode = '22023', message = 'Private service verification fields cannot be public.';
    end if;
  else
    if nullif(btrim(v_listing ->> 'event_group'), '') is null
      or nullif(btrim(v_listing ->> 'event_category'), '') is null
      or nullif(btrim(v_listing ->> 'location_type'), '') is null
      or nullif(btrim(v_listing ->> 'start_date'), '') is null
      or nullif(btrim(v_listing ->> 'timezone'), '') is null
    then
      raise exception using errcode = '22023', message = 'Event type, date, location type and timezone are required.';
    end if;

    v_start_date := (v_listing ->> 'start_date')::date;
    v_end_date := coalesce(nullif(v_listing ->> 'end_date', '')::date, v_start_date);

    if v_start_date < current_date or v_end_date < v_start_date then
      raise exception using errcode = '22023', message = 'Event date range is invalid.';
    end if;

    if not exists (
      select 1
      from pg_catalog.pg_timezone_names
      where name = v_listing ->> 'timezone'
    ) then
      raise exception using errcode = '22023', message = 'Unsupported event timezone.';
    end if;

    if coalesce(nullif(v_listing ->> 'capacity_total', '')::integer, 0) < 1
      or coalesce(nullif(v_listing ->> 'capacity_available', '')::integer, 0) < 0
      or coalesce(nullif(v_listing ->> 'capacity_available', '')::integer, 0)
        > coalesce(nullif(v_listing ->> 'capacity_total', '')::integer, 0)
    then
      raise exception using errcode = '22023', message = 'Event capacity is invalid.';
    end if;

    v_is_ticket := lower(coalesce(v_listing ->> 'event_group', '')) like '%ticket%'
      or lower(coalesce(v_listing ->> 'event_category', '')) like '%ticket%';

    if v_is_ticket then
      if coalesce(nullif(v_listing ->> 'is_transferable', '')::boolean, false) is not true
        or coalesce(nullif(v_listing ->> 'transfer_rule_confirmed', '')::boolean, false) is not true
        or nullif(btrim(v_listing ->> 'transfer_rule_source'), '') is null
        or nullif(btrim(v_listing ->> 'transfer_deadline_at'), '') is null
      then
        raise exception using errcode = '22023', message = 'Ticket transferability must be confirmed before publication.';
      end if;

      v_transfer_deadline := (v_listing ->> 'transfer_deadline_at')::timestamptz;
      if v_transfer_deadline <= now() or v_transfer_deadline::date >= v_start_date then
        raise exception using errcode = '22023', message = 'Ticket transfer deadline is invalid.';
      end if;
    end if;

    if exists (
      select 1
      from jsonb_object_keys(v_listing) as keys(key)
      where keys.key in (
        'booking_reference', 'online_url', 'address', 'seat_info',
        'venue_row', 'venue_seat'
      )
    ) then
      raise exception using errcode = '22023', message = 'Private event transfer fields cannot be public.';
    end if;
  end if;

  if (v_listing ? 'lat'
      and nullif(v_listing ->> 'lat', '') is not null
      and scale((v_listing ->> 'lat')::numeric) > 2)
    or (v_listing ? 'lon'
      and nullif(v_listing ->> 'lon', '') is not null
      and scale((v_listing ->> 'lon')::numeric) > 2)
  then
    raise exception using errcode = '22023', message = 'Public coordinates must be approximate.';
  end if;

  v_request_hash := encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'domain', v_domain,
          'item_id', p_item_id,
          'expected_revision', p_expected_revision,
          'payload', p_payload
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_actor::text || ':' || p_item_id::text || ':edit:' || btrim(p_idempotency_key),
      0
    )
  );

  select *
  into v_existing
  from public.domain_listing_mutation_receipts
  where actor_id = v_actor
    and item_id = p_item_id
    and operation = 'edit'
    and idempotency_key = btrim(p_idempotency_key);

  if found then
    if v_existing.request_hash <> v_request_hash then
      raise exception using
        errcode = '23505',
        message = 'Idempotency key was already used with a different request.';
    end if;

    return v_existing.response || jsonb_build_object('replayed', true);
  end if;

  select i.owner_id, i.item_type, i.owner_revision, i.status
  into v_owner_id, v_item_type, v_current_revision, v_status
  from public.items i
  where i.id = p_item_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Listing not found.';
  end if;

  if v_owner_id <> v_actor or v_item_type <> v_domain then
    raise exception using errcode = '42501', message = 'Listing is not owned by the authenticated actor.';
  end if;

  if v_current_revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Listing revision is stale.';
  end if;

  update public.items i
  set title = case
        when v_item ? 'title' then btrim(v_item ->> 'title')
        else i.title
      end,
      description = case
        when v_item ? 'description' then nullif(btrim(v_item ->> 'description'), '')
        else i.description
      end,
      category_l1 = case
        when v_item ? 'category_l1' then nullif(btrim(v_item ->> 'category_l1'), '')
        else i.category_l1
      end,
      category_l2 = case
        when v_item ? 'category_l2' then nullif(btrim(v_item ->> 'category_l2'), '')
        else i.category_l2
      end,
      category_l3 = case
        when v_item ? 'category_l3' then nullif(btrim(v_item ->> 'category_l3'), '')
        else i.category_l3
      end,
      category_path = case
        when v_item ? 'category_path' then nullif(btrim(v_item ->> 'category_path'), '')
        else i.category_path
      end,
      perceived_value_tier = case
        when v_item ? 'perceived_value_tier' then nullif(btrim(v_item ->> 'perceived_value_tier'), '')
        else i.perceived_value_tier
      end,
      swap_geo_preference = case
        when v_item ? 'swap_geo_preference' then coalesce(nullif(btrim(v_item ->> 'swap_geo_preference'), ''), 'regional')
        else i.swap_geo_preference
      end,
      swap_open_to = case
        when v_item ? 'swap_open_to' then array(
          select value from jsonb_array_elements_text(v_item -> 'swap_open_to') as entries(value)
        )
        else i.swap_open_to
      end,
      chain_swap_allowed = case
        when v_item ? 'chain_swap_allowed' then coalesce(nullif(v_item ->> 'chain_swap_allowed', '')::boolean, false)
        else i.chain_swap_allowed
      end,
      cross_category_swap = case
        when v_item ? 'cross_category_swap' then coalesce(nullif(v_item ->> 'cross_category_swap', '')::boolean, false)
        else i.cross_category_swap
      end,
      swap_partial_allowed = case
        when v_item ? 'swap_partial_allowed' then coalesce(nullif(v_item ->> 'swap_partial_allowed', '')::boolean, false)
        else i.swap_partial_allowed
      end,
      swap_partial_topup_eur = case
        when v_item ? 'swap_partial_topup_eur' then nullif(v_item ->> 'swap_partial_topup_eur', '')::numeric
        else i.swap_partial_topup_eur
      end,
      escrow_accepted = case
        when v_item ? 'escrow_accepted' then coalesce(nullif(v_item ->> 'escrow_accepted', '')::boolean, false)
        else i.escrow_accepted
      end,
      escrow_required = case
        when v_item ? 'escrow_required' then coalesce(nullif(v_item ->> 'escrow_required', '')::boolean, false)
        else i.escrow_required
      end,
      swap_wants_description = case
        when v_item ? 'swap_wants_description' then nullif(btrim(v_item ->> 'swap_wants_description'), '')
        else i.swap_wants_description
      end,
      swap_wants_type = case
        when v_item ? 'swap_wants_type' then array(
          select value from jsonb_array_elements_text(v_item -> 'swap_wants_type') as entries(value)
        )
        else i.swap_wants_type
      end,
      swap_wants_value_tier = case
        when v_item ? 'swap_wants_value_tier' then nullif(btrim(v_item ->> 'swap_wants_value_tier'), '')
        else i.swap_wants_value_tier
      end,
      location = case
        when v_item ? 'location' then nullif(btrim(v_item ->> 'location'), '')
        else i.location
      end,
      location_city = case
        when v_item ? 'location_city' then nullif(btrim(v_item ->> 'location_city'), '')
        else i.location_city
      end,
      location_country = case
        when v_item ? 'location_country' then nullif(upper(btrim(v_item ->> 'location_country')), '')
        else i.location_country
      end,
      images = case
        when v_item ? 'images' then coalesce(v_item -> 'images', '[]'::jsonb)
        else i.images
      end,
      image_url = case
        when v_item ? 'image_url' then nullif(btrim(v_item ->> 'image_url'), '')
        else i.image_url
      end,
      owner_revision = i.owner_revision + 1,
      updated_at = now()
  where i.id = p_item_id
  returning i.owner_revision, i.status
  into v_resulting_revision, v_status;

  select string_agg(
    format('%I = r.%I', c.column_name, c.column_name),
    ', '
    order by c.ordinal_position
  )
  into v_set_list
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = v_table_name
    and c.column_name not in (
      'id', 'item_id', 'owner_id', 'created_at', 'updated_at', 'status'
    )
    and v_listing ? c.column_name;

  if v_set_list is null then
    raise exception using errcode = '22023', message = 'Listing payload has no mutable fields.';
  end if;

  v_sql := format(
    'update public.%I t set %s, updated_at = now() '
    || 'from jsonb_populate_record(null::public.%I, $1) as r '
    || 'where t.item_id = $2 and t.owner_id = $3 returning t.id',
    v_table_name,
    v_set_list,
    v_table_name
  );

  execute v_sql using v_listing, p_item_id, v_actor into v_listing_id;

  if v_listing_id is null then
    raise exception using errcode = 'P0002', message = 'Canonical domain row not found.';
  end if;

  insert into public.domain_listing_private_data (
    item_id,
    owner_id,
    domain,
    editor_payload,
    exact_location,
    transfer_data,
    updated_at
  ) values (
    p_item_id,
    v_actor,
    v_domain,
    coalesce(v_private -> 'editor_payload', '{}'::jsonb),
    coalesce(v_private -> 'exact_location', '{}'::jsonb),
    coalesce(v_private -> 'transfer_data', '{}'::jsonb),
    now()
  )
  on conflict (item_id) do update
  set owner_id = excluded.owner_id,
      domain = excluded.domain,
      editor_payload = excluded.editor_payload,
      exact_location = excluded.exact_location,
      transfer_data = excluded.transfer_data,
      updated_at = now()
  where public.domain_listing_private_data.owner_id = v_actor;

  v_response := jsonb_build_object(
    'schema_version', '1.0',
    'domain', v_domain,
    'operation', 'edit',
    'item_id', p_item_id,
    'listing_id', v_listing_id,
    'status', v_status,
    'revision', v_resulting_revision,
    'replayed', false
  );

  insert into public.domain_listing_mutation_receipts (
    actor_id,
    item_id,
    domain,
    operation,
    idempotency_key,
    request_hash,
    expected_revision,
    resulting_revision,
    response
  ) values (
    v_actor,
    p_item_id,
    v_domain,
    'edit',
    btrim(p_idempotency_key),
    v_request_hash,
    p_expected_revision,
    v_resulting_revision,
    v_response
  );

  return v_response;
end;
$function$;

create or replace function public.set_domain_listing_status_v1(
  p_domain text,
  p_item_id uuid,
  p_status text,
  p_expected_revision bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $function$
declare
  v_actor uuid := auth.uid();
  v_domain text := lower(btrim(coalesce(p_domain, '')));
  v_target_status text := lower(btrim(coalesce(p_status, '')));
  v_table_name text;
  v_request_hash text;
  v_existing public.domain_listing_mutation_receipts%rowtype;
  v_owner_id uuid;
  v_item_type text;
  v_current_revision bigint;
  v_resulting_revision bigint;
  v_listing_id uuid;
  v_event_end_date date;
  v_sql text;
  v_response jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if v_domain not in ('property', 'service', 'event') then
    raise exception using errcode = '22023', message = 'Unsupported listing domain.';
  end if;

  if v_target_status not in ('active', 'paused', 'archived') then
    raise exception using errcode = '22023', message = 'Unsupported lifecycle status.';
  end if;

  if p_item_id is null then
    raise exception using errcode = '22023', message = 'Item id is required.';
  end if;

  if p_expected_revision is null or p_expected_revision < 1 then
    raise exception using errcode = '22023', message = 'Expected revision is required.';
  end if;

  if p_idempotency_key is null
    or char_length(btrim(p_idempotency_key)) not between 8 and 120
  then
    raise exception using errcode = '22023', message = 'A valid idempotency key is required.';
  end if;

  v_table_name := case v_domain
    when 'property' then 'properties'
    when 'service' then 'services_listings'
    else 'events_listings'
  end;

  v_request_hash := encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'domain', v_domain,
          'item_id', p_item_id,
          'status', v_target_status,
          'expected_revision', p_expected_revision
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_actor::text || ':' || p_item_id::text || ':status:' || btrim(p_idempotency_key),
      0
    )
  );

  select *
  into v_existing
  from public.domain_listing_mutation_receipts
  where actor_id = v_actor
    and item_id = p_item_id
    and operation = 'status'
    and idempotency_key = btrim(p_idempotency_key);

  if found then
    if v_existing.request_hash <> v_request_hash then
      raise exception using
        errcode = '23505',
        message = 'Idempotency key was already used with a different request.';
    end if;

    return v_existing.response || jsonb_build_object('replayed', true);
  end if;

  select i.owner_id, i.item_type, i.owner_revision
  into v_owner_id, v_item_type, v_current_revision
  from public.items i
  where i.id = p_item_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Listing not found.';
  end if;

  if v_owner_id <> v_actor or v_item_type <> v_domain then
    raise exception using errcode = '42501', message = 'Listing is not owned by the authenticated actor.';
  end if;

  if v_current_revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'Listing revision is stale.';
  end if;

  if v_domain = 'event' and v_target_status = 'active' then
    select coalesce(e.end_date, e.start_date)
    into v_event_end_date
    from public.events_listings e
    where e.item_id = p_item_id
      and e.owner_id = v_actor;

    if v_event_end_date is null or v_event_end_date < current_date then
      raise exception using errcode = '22023', message = 'Expired events cannot be resumed.';
    end if;
  end if;

  update public.items i
  set status = v_target_status,
      is_active = (v_target_status = 'active'),
      owner_revision = i.owner_revision + 1,
      updated_at = now()
  where i.id = p_item_id
  returning i.owner_revision into v_resulting_revision;

  v_sql := format(
    'update public.%I set status = $1, updated_at = now() '
    || 'where item_id = $2 and owner_id = $3 returning id',
    v_table_name
  );

  execute v_sql
    using v_target_status, p_item_id, v_actor
    into v_listing_id;

  if v_listing_id is null then
    raise exception using errcode = 'P0002', message = 'Canonical domain row not found.';
  end if;

  v_response := jsonb_build_object(
    'schema_version', '1.0',
    'domain', v_domain,
    'operation', 'status',
    'item_id', p_item_id,
    'listing_id', v_listing_id,
    'status', v_target_status,
    'revision', v_resulting_revision,
    'replayed', false
  );

  insert into public.domain_listing_mutation_receipts (
    actor_id,
    item_id,
    domain,
    operation,
    idempotency_key,
    request_hash,
    expected_revision,
    resulting_revision,
    response
  ) values (
    v_actor,
    p_item_id,
    v_domain,
    'status',
    btrim(p_idempotency_key),
    v_request_hash,
    p_expected_revision,
    v_resulting_revision,
    v_response
  );

  return v_response;
end;
$function$;

revoke all on function public.update_domain_listing_v1(
  text, uuid, jsonb, bigint, text
) from public, anon;
grant execute on function public.update_domain_listing_v1(
  text, uuid, jsonb, bigint, text
) to authenticated;

revoke all on function public.set_domain_listing_status_v1(
  text, uuid, text, bigint, text
) from public, anon;
grant execute on function public.set_domain_listing_status_v1(
  text, uuid, text, bigint, text
) to authenticated;

revoke insert, update, delete on table public.properties from authenticated;
revoke insert, update, delete on table public.services_listings from authenticated;
revoke insert, update, delete on table public.events_listings from authenticated;

drop policy if exists properties_insert_own on public.properties;
drop policy if exists properties_update_own on public.properties;
drop policy if exists properties_delete_own on public.properties;
drop policy if exists services_insert_own on public.services_listings;
drop policy if exists services_update_own on public.services_listings;
drop policy if exists services_delete_own on public.services_listings;
drop policy if exists events_insert_own on public.events_listings;
drop policy if exists events_update_own on public.events_listings;
drop policy if exists events_delete_own on public.events_listings;

drop policy if exists properties_select_own on public.properties;
create policy properties_select_own
  on public.properties
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists services_select_own on public.services_listings;
create policy services_select_own
  on public.services_listings
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists events_select_own on public.events_listings;
create policy events_select_own
  on public.events_listings
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists items_update_own on public.items;
create policy items_update_own
  on public.items
  for update
  to authenticated
  using (
    owner_id = (select auth.uid())
    and item_type = 'object'
  )
  with check (
    owner_id = (select auth.uid())
    and item_type = 'object'
  );

drop policy if exists items_delete_own on public.items;
create policy items_delete_own
  on public.items
  for delete
  to authenticated
  using (
    owner_id = (select auth.uid())
    and item_type = 'object'
  );

revoke all on table public.domain_listing_private_data from authenticated;
grant select on table public.domain_listing_private_data to authenticated;

comment on column public.items.owner_revision is
  'Optimistic owner-mutation revision for canonical listing edits and lifecycle changes.';
comment on function public.update_domain_listing_v1(
  text, uuid, jsonb, bigint, text
) is
  'V1-05.3 atomic, owner-bound, idempotent edit authority for property/service/event listings.';
comment on function public.set_domain_listing_status_v1(
  text, uuid, text, bigint, text
) is
  'V1-05.3 atomic, owner-bound, idempotent active/paused/archived authority for domain listings.';
comment on table public.domain_listing_mutation_receipts is
  'Server-only exact-once receipts for domain listing owner mutations.';

commit;
