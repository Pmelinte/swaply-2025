-- V1-05.2 — fail-closed hardening for direct RPC domain listing creation.
--
-- The initial V1-05.2 authority remains the atomic persistence core. This
-- forward-only migration moves that core out of the exposed schema and adds a
-- strict public wrapper. The wrapper accepts only the fields emitted by the
-- canonical Property, Service and Event wizards and rejects server-owned,
-- verification, promotion, rating, counter and private projection fields.

begin;

create schema if not exists private;

alter function public.create_domain_listing_v1(text, jsonb, text)
  set schema private;

alter function private.create_domain_listing_v1(text, jsonb, text)
  rename to create_domain_listing_v1_core;

revoke all on function private.create_domain_listing_v1_core(text, jsonb, text)
  from public, anon, authenticated;

create or replace function public.create_domain_listing_v1(
  p_domain text,
  p_payload jsonb,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions, private
as $function$
declare
  v_actor uuid := auth.uid();
  v_domain text := lower(btrim(coalesce(p_domain, '')));
  v_item jsonb;
  v_listing jsonb;
  v_private jsonb;
  v_exact_location jsonb;
  v_transfer_data jsonb;
  v_unknown_key text;
  v_key text;
  v_value jsonb;
  v_data_type text;
  v_udt_name text;
  v_table_name text;
  v_allowed_listing_keys text[];
  v_allowed_exact_keys text[];
  v_allowed_transfer_keys text[];
  v_is_ticket boolean := false;

  v_allowed_payload_keys constant text[] := array[
    'schema_version', 'domain', 'item', 'listing', 'private'
  ];
  v_required_payload_keys constant text[] := array[
    'schema_version', 'domain', 'item', 'listing', 'private'
  ];
  v_allowed_private_keys constant text[] := array[
    'editor_payload', 'exact_location', 'transfer_data'
  ];
  v_required_private_keys constant text[] := array[
    'editor_payload', 'exact_location', 'transfer_data'
  ];
  v_allowed_item_keys constant text[] := array[
    'title', 'description', 'category_l1', 'category_l2', 'category_l3',
    'category_path', 'perceived_value_tier', 'swap_geo_preference',
    'swap_open_to', 'chain_swap_allowed', 'cross_category_swap',
    'swap_partial_allowed', 'swap_partial_topup_eur', 'escrow_accepted',
    'escrow_required', 'swap_wants_description', 'swap_wants_type',
    'swap_wants_value_tier', 'location', 'location_city', 'location_country',
    'images', 'image_url'
  ];
  v_item_text_keys constant text[] := array[
    'title', 'description', 'category_l1', 'category_l2', 'category_l3',
    'category_path', 'perceived_value_tier', 'swap_geo_preference',
    'swap_wants_description', 'swap_wants_value_tier', 'location',
    'location_city', 'location_country', 'image_url'
  ];
  v_item_boolean_keys constant text[] := array[
    'chain_swap_allowed', 'cross_category_swap', 'swap_partial_allowed',
    'escrow_accepted', 'escrow_required'
  ];
  v_item_number_keys constant text[] := array[
    'swap_partial_topup_eur'
  ];
  v_item_array_keys constant text[] := array[
    'swap_open_to', 'swap_wants_type', 'images'
  ];

  v_allowed_property_listing_keys constant text[] := array[
    'property_type', 'property_subtype', 'listing_purpose', 'country_code',
    'region', 'city', 'address_approximate', 'lat', 'lon', 'location_type',
    'proximity_sea_km', 'proximity_mountain_km', 'proximity_forest_km',
    'proximity_city_center_km', 'year_built', 'year_renovated',
    'floors_total', 'floor_unit', 'building_condition',
    'construction_material', 'bedrooms', 'bathrooms', 'toilets',
    'living_rooms', 'kitchens', 'offices', 'storage_rooms', 'total_rooms',
    'sleeps_max', 'surface_total_sqm', 'surface_living_sqm',
    'surface_garden_sqm', 'surface_terrace_sqm', 'has_pool', 'pool_type',
    'has_hot_tub', 'has_sauna', 'has_gym', 'has_tennis_court', 'has_bbq',
    'has_fireplace', 'parking_spots', 'parking_type', 'has_ev_charger',
    'heating_type', 'cooling_type', 'water_source', 'hot_water_type',
    'electricity_source', 'has_solar_panels', 'solar_kwp', 'internet_type',
    'internet_speed_mbps', 'has_smart_home', 'smart_home_features',
    'kitchen_appliances', 'bed_types', 'linens_provided',
    'towels_provided', 'baby_cot_available', 'furnished_level',
    'wheelchair_accessible', 'elevator', 'accessible_bathroom',
    'step_free_entrance', 'wide_doorways', 'pets_allowed',
    'pets_allowed_types', 'exchange_type', 'min_stay_days', 'max_stay_days',
    'preferred_seasons', 'advance_notice_days', 'check_in_time',
    'check_out_time', 'flexible_dates', 'available_from', 'available_until',
    'smoking_allowed', 'parties_allowed', 'quiet_hours_start',
    'quiet_hours_end', 'max_guests', 'children_allowed', 'min_guest_age',
    'additional_rules', 'is_eco_certified', 'eco_certifications',
    'unique_features', 'security_deposit_eur', 'escrow_required', 'timezone'
  ];

  v_allowed_service_listing_keys constant text[] := array[
    'category_l1', 'category_l2', 'category_l3', 'service_name',
    'service_name_local', 'delivery_mode', 'service_area_type',
    'service_area_radius_km', 'travel_included', 'experience_years',
    'skill_level', 'is_licensed', 'is_insured', 'is_certified',
    'certifications', 'portfolio_url', 'portfolio_items', 'available_days',
    'available_from_time', 'available_until_time', 'available_date_from',
    'available_date_until', 'lead_time_days', 'max_concurrent_jobs',
    'estimated_hours', 'estimated_days', 'scope_description', 'deliverables',
    'swap_open_to', 'swap_wants_description', 'swap_wants_type',
    'swap_wants_value_tier', 'partial_swap_allowed', 'partial_topup_eur',
    'escrow_accepted', 'service_languages', 'gallery', 'timezone'
  ];

  v_allowed_event_listing_keys constant text[] := array[
    'event_group', 'event_category', 'event_subcategory', 'start_date',
    'end_date', 'start_time', 'end_time', 'timezone', 'duration_days',
    'is_recurring', 'recurrence_pattern', 'recurrence_details', 'season',
    'location_type', 'country_code', 'region', 'city', 'venue_name', 'lat',
    'lon', 'is_route_based', 'route_type', 'route_origin_city',
    'route_destination_city', 'route_waypoints', 'route_gpx_url',
    'route_total_km', 'capacity_total', 'capacity_available',
    'min_participants', 'max_participants', 'age_min', 'suitable_for',
    'transport_mode', 'transport_class', 'baggage_included',
    'is_transferable', 'miles_points_type', 'pass_days_remaining',
    'sport_type', 'sport_competition', 'venue_section', 'face_value_eur',
    'has_hospitality', 'includes_transport', 'includes_accommodation',
    'includes_meals', 'includes_equipment', 'extras', 'swap_open_to',
    'swap_wants_description', 'swap_wants_type', 'swap_wants_value_tier',
    'partial_swap_allowed', 'partial_topup_eur', 'escrow_accepted',
    'exchange_points', 'expires_at', 'transfer_deadline_at',
    'transfer_rule_source', 'transfer_rule_confirmed'
  ];
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if v_domain not in ('property', 'service', 'event') then
    raise exception using errcode = '22023', message = 'Unsupported listing domain.';
  end if;

  if p_idempotency_key is null
    or char_length(p_idempotency_key) not between 8 and 120
    or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$'
  then
    raise exception using errcode = '22023', message = 'Invalid idempotency key.';
  end if;

  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception using errcode = '22023', message = 'Payload must be an object.';
  end if;

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(p_payload) as keys(key)
  where not (keys.key = any(v_allowed_payload_keys))
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported payload field: %s', v_unknown_key);
  end if;

  if not (p_payload ?& v_required_payload_keys)
    or jsonb_typeof(p_payload -> 'schema_version') is distinct from 'string'
    or p_payload ->> 'schema_version' is distinct from '1.0'
    or jsonb_typeof(p_payload -> 'domain') is distinct from 'string'
    or p_payload ->> 'domain' is distinct from v_domain
    or jsonb_typeof(p_payload -> 'item') is distinct from 'object'
    or jsonb_typeof(p_payload -> 'listing') is distinct from 'object'
    or jsonb_typeof(p_payload -> 'private') is distinct from 'object'
  then
    raise exception using errcode = '22023', message = 'Invalid domain listing payload.';
  end if;

  v_item := p_payload -> 'item';
  v_listing := p_payload -> 'listing';
  v_private := p_payload -> 'private';

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(v_item) as keys(key)
  where not (keys.key = any(v_allowed_item_keys))
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported item field: %s', v_unknown_key);
  end if;

  if not (v_item ? 'title')
    or jsonb_typeof(v_item -> 'title') is distinct from 'string'
    or nullif(btrim(v_item ->> 'title'), '') is null
  then
    raise exception using errcode = '22023', message = 'Listing title is required.';
  end if;

  if exists (
    select 1
    from jsonb_each(v_item) as fields(key, value)
    where fields.key = any(v_item_text_keys)
      and jsonb_typeof(fields.value) is distinct from 'string'
  ) then
    raise exception using errcode = '22023', message = 'Item text fields must be strings.';
  end if;

  if exists (
    select 1
    from jsonb_each(v_item) as fields(key, value)
    where fields.key = any(v_item_boolean_keys)
      and jsonb_typeof(fields.value) is distinct from 'boolean'
  ) then
    raise exception using errcode = '22023', message = 'Item boolean fields must be booleans.';
  end if;

  if exists (
    select 1
    from jsonb_each(v_item) as fields(key, value)
    where fields.key = any(v_item_number_keys)
      and jsonb_typeof(fields.value) is distinct from 'number'
  ) then
    raise exception using errcode = '22023', message = 'Item numeric fields must be numbers.';
  end if;

  if exists (
    select 1
    from jsonb_each(v_item) as fields(key, value)
    where fields.key = any(v_item_array_keys)
      and jsonb_typeof(fields.value) is distinct from 'array'
  ) then
    raise exception using errcode = '22023', message = 'Item array fields must be arrays.';
  end if;

  if exists (
    select 1
    from (
      select fields.key, fields.value
      from jsonb_each(v_item) as fields(key, value)
      where fields.key = any(v_item_array_keys)
        and jsonb_typeof(fields.value) = 'array'
    ) as array_fields
    cross join lateral jsonb_array_elements(array_fields.value) as elements(value)
    where jsonb_typeof(elements.value) is distinct from 'string'
  ) then
    raise exception using errcode = '22023', message = 'Item arrays must contain strings only.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(coalesce(v_item -> 'images', '[]'::jsonb)) as images(value)
    where images.value !~* '^https?://'
  ) then
    raise exception using errcode = '22023', message = 'Item images must use HTTP URLs.';
  end if;

  if v_item ? 'image_url'
    and (v_item ->> 'image_url') !~* '^https?://'
  then
    raise exception using errcode = '22023', message = 'Item image_url must use HTTP.';
  end if;

  if v_item ? 'location_country'
    and (v_item ->> 'location_country') !~ '^[A-Z]{2}$'
  then
    raise exception using errcode = '22023', message = 'Item country must be an uppercase ISO code.';
  end if;

  if v_item ? 'perceived_value_tier'
    and (v_item ->> 'perceived_value_tier') not in ('small', 'medium', 'large', 'special')
  then
    raise exception using errcode = '22023', message = 'Unsupported perceived value tier.';
  end if;

  if v_item ? 'swap_wants_value_tier'
    and (v_item ->> 'swap_wants_value_tier') not in ('small', 'medium', 'large', 'special')
  then
    raise exception using errcode = '22023', message = 'Unsupported wanted value tier.';
  end if;

  if v_item ? 'swap_geo_preference'
    and (v_item ->> 'swap_geo_preference') not in ('local', 'regional', 'international', 'vacation')
  then
    raise exception using errcode = '22023', message = 'Unsupported geographic preference.';
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

  if v_item ? 'swap_partial_topup_eur'
    and (v_item ->> 'swap_partial_topup_eur')::numeric < 0
  then
    raise exception using errcode = '22023', message = 'Partial top-up cannot be negative.';
  end if;

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(v_private) as keys(key)
  where not (keys.key = any(v_allowed_private_keys))
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported private payload field: %s', v_unknown_key);
  end if;

  if not (v_private ?& v_required_private_keys)
    or jsonb_typeof(v_private -> 'editor_payload') is distinct from 'object'
    or jsonb_typeof(v_private -> 'exact_location') is distinct from 'object'
    or jsonb_typeof(v_private -> 'transfer_data') is distinct from 'object'
  then
    raise exception using errcode = '22023', message = 'Invalid private listing payload.';
  end if;

  if position('"wifi_password"' in lower(v_private::text)) > 0 then
    raise exception using errcode = '22023', message = 'Wi-Fi credentials cannot be stored.';
  end if;

  v_exact_location := v_private -> 'exact_location';
  v_transfer_data := v_private -> 'transfer_data';

  if v_domain = 'property' then
    v_table_name := 'properties';
    v_allowed_listing_keys := v_allowed_property_listing_keys;
    v_allowed_exact_keys := array['address', 'lat', 'lon'];
    v_allowed_transfer_keys := array[]::text[];
  elsif v_domain = 'service' then
    v_table_name := 'services_listings';
    v_allowed_listing_keys := v_allowed_service_listing_keys;
    v_allowed_exact_keys := array[]::text[];
    v_allowed_transfer_keys := array['certification_claims', 'provider_type'];
  else
    v_table_name := 'events_listings';
    v_allowed_listing_keys := v_allowed_event_listing_keys;
    v_allowed_exact_keys := array['lat', 'lon'];
    v_allowed_transfer_keys := array[
      'booking_reference', 'venue_row', 'seat_number', 'id_required',
      'rule_source', 'authorized_attestation'
    ];
  end if;

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(v_exact_location) as keys(key)
  where not (keys.key = any(v_allowed_exact_keys))
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported exact location field: %s', v_unknown_key);
  end if;

  if v_exact_location ? 'address'
    and jsonb_typeof(v_exact_location -> 'address') is distinct from 'string'
  then
    raise exception using errcode = '22023', message = 'Exact address must be a string.';
  end if;

  if (v_exact_location ? 'lat'
      and jsonb_typeof(v_exact_location -> 'lat') is distinct from 'number')
    or (v_exact_location ? 'lon'
      and jsonb_typeof(v_exact_location -> 'lon') is distinct from 'number')
  then
    raise exception using errcode = '22023', message = 'Exact coordinates must be numbers.';
  end if;

  if (v_exact_location ? 'lat'
      and (v_exact_location ->> 'lat')::numeric not between -90 and 90)
    or (v_exact_location ? 'lon'
      and (v_exact_location ->> 'lon')::numeric not between -180 and 180)
  then
    raise exception using errcode = '22023', message = 'Exact coordinates are outside the valid range.';
  end if;

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(v_transfer_data) as keys(key)
  where not (keys.key = any(v_allowed_transfer_keys))
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported private transfer field: %s', v_unknown_key);
  end if;

  if v_domain = 'service' then
    if v_transfer_data ? 'certification_claims'
      and jsonb_typeof(v_transfer_data -> 'certification_claims') is distinct from 'array'
    then
      raise exception using errcode = '22023', message = 'Certification claims must be an array.';
    end if;

    if v_transfer_data ? 'certification_claims'
      and exists (
        select 1
        from jsonb_array_elements(v_transfer_data -> 'certification_claims') as claims(value)
        where jsonb_typeof(claims.value) is distinct from 'string'
      )
    then
      raise exception using errcode = '22023', message = 'Certification claims must contain strings only.';
    end if;

    if v_transfer_data ? 'provider_type'
      and jsonb_typeof(v_transfer_data -> 'provider_type') is distinct from 'string'
    then
      raise exception using errcode = '22023', message = 'Provider type must be a string.';
    end if;
  elsif v_domain = 'event' then
    if exists (
      select 1
      from jsonb_each(v_transfer_data) as fields(key, value)
      where fields.key in ('booking_reference', 'venue_row', 'seat_number', 'rule_source')
        and jsonb_typeof(fields.value) is distinct from 'string'
    ) then
      raise exception using errcode = '22023', message = 'Event transfer text fields must be strings.';
    end if;

    if exists (
      select 1
      from jsonb_each(v_transfer_data) as fields(key, value)
      where fields.key in ('id_required', 'authorized_attestation')
        and jsonb_typeof(fields.value) is distinct from 'boolean'
    ) then
      raise exception using errcode = '22023', message = 'Event transfer flags must be booleans.';
    end if;

    if v_transfer_data ? 'rule_source'
      and v_transfer_data ->> 'rule_source' <> 'user_attestation'
    then
      raise exception using errcode = '22023', message = 'Unsupported event transfer rule source.';
    end if;
  end if;

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(v_listing) as keys(key)
  where not (keys.key = any(v_allowed_listing_keys))
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported %s listing field: %s', v_domain, v_unknown_key);
  end if;

  for v_key, v_value in
    select fields.key, fields.value
    from jsonb_each(v_listing) as fields(key, value)
  loop
    if jsonb_typeof(v_value) = 'null' then
      raise exception using
        errcode = '22023',
        message = format('%s listing field %s cannot be null.', v_domain, v_key);
    end if;

    select columns.data_type, columns.udt_name
    into v_data_type, v_udt_name
    from information_schema.columns
    where columns.table_schema = 'public'
      and columns.table_name = v_table_name
      and columns.column_name = v_key;

    if not found then
      raise exception using
        errcode = '22023',
        message = format('Unknown %s listing column: %s', v_domain, v_key);
    end if;

    if v_data_type = 'boolean'
      and jsonb_typeof(v_value) is distinct from 'boolean'
    then
      raise exception using errcode = '22023', message = format('%s must be a boolean.', v_key);
    elsif v_data_type in ('smallint', 'integer', 'bigint')
      and (
        jsonb_typeof(v_value) is distinct from 'number'
        or (v_value #>> '{}') !~ '^-?[0-9]+$'
      )
    then
      raise exception using errcode = '22023', message = format('%s must be an integer.', v_key);
    elsif v_data_type in ('numeric', 'real', 'double precision')
      and jsonb_typeof(v_value) is distinct from 'number'
    then
      raise exception using errcode = '22023', message = format('%s must be a number.', v_key);
    elsif v_data_type = 'ARRAY'
      and jsonb_typeof(v_value) is distinct from 'array'
    then
      raise exception using errcode = '22023', message = format('%s must be an array.', v_key);
    elsif v_data_type = 'ARRAY'
      and exists (
        select 1
        from jsonb_array_elements(v_value) as elements(value)
        where jsonb_typeof(elements.value) is distinct from 'string'
      )
    then
      raise exception using errcode = '22023', message = format('%s must contain strings only.', v_key);
    elsif v_data_type = 'jsonb'
      and jsonb_typeof(v_value) not in ('array', 'object')
    then
      raise exception using errcode = '22023', message = format('%s must be structured JSON.', v_key);
    elsif v_data_type in (
      'text', 'character', 'character varying', 'date',
      'time without time zone', 'time with time zone',
      'timestamp without time zone', 'timestamp with time zone'
    )
      and jsonb_typeof(v_value) is distinct from 'string'
    then
      raise exception using errcode = '22023', message = format('%s must be a string.', v_key);
    end if;
  end loop;

  if v_listing ? 'country_code'
    and (v_listing ->> 'country_code') !~ '^[A-Z]{2}$'
  then
    raise exception using errcode = '22023', message = 'Listing country must be an uppercase ISO code.';
  end if;

  if (v_listing ? 'lat'
      and (
        (v_listing ->> 'lat')::numeric not between -90 and 90
        or scale((v_listing ->> 'lat')::numeric) > 2
      ))
    or (v_listing ? 'lon'
      and (
        (v_listing ->> 'lon')::numeric not between -180 and 180
        or scale((v_listing ->> 'lon')::numeric) > 2
      ))
  then
    raise exception using errcode = '22023', message = 'Public coordinates must be approximate and in range.';
  end if;

  if not (v_listing ? 'timezone')
    or jsonb_typeof(v_listing -> 'timezone') is distinct from 'string'
    or nullif(btrim(v_listing ->> 'timezone'), '') is null
    or not exists (
      select 1
      from pg_catalog.pg_timezone_names
      where name = v_listing ->> 'timezone'
    )
  then
    raise exception using errcode = '22023', message = 'A supported explicit timezone is required.';
  end if;

  if v_domain = 'property' then
    if v_listing ->> 'listing_purpose' is distinct from 'vacation_swap' then
      raise exception using errcode = '22023', message = 'Properties may be created only for temporary vacation exchange.';
    end if;

    if v_listing ? 'kitchen_appliances'
      and jsonb_typeof(v_listing -> 'kitchen_appliances') is distinct from 'array'
    then
      raise exception using errcode = '22023', message = 'Kitchen appliances must be an array.';
    end if;

    if v_listing ? 'kitchen_appliances'
      and exists (
        select 1
        from jsonb_array_elements(v_listing -> 'kitchen_appliances') as entries(value)
        where jsonb_typeof(entries.value) is distinct from 'string'
      )
    then
      raise exception using errcode = '22023', message = 'Kitchen appliances must contain strings only.';
    end if;

    if v_listing ? 'bed_types'
      and jsonb_typeof(v_listing -> 'bed_types') is distinct from 'array'
    then
      raise exception using errcode = '22023', message = 'Bed types must be an array.';
    end if;

    if v_listing ? 'bed_types'
      and exists (
        select 1
        from jsonb_array_elements(v_listing -> 'bed_types') as entries(value)
        where jsonb_typeof(entries.value) is distinct from 'string'
      )
    then
      raise exception using errcode = '22023', message = 'Bed types must contain strings only.';
    end if;
  elsif v_domain = 'service' then
    if v_listing -> 'travel_included' is distinct from 'false'::jsonb
      or v_listing -> 'is_licensed' is distinct from 'false'::jsonb
      or v_listing -> 'is_insured' is distinct from 'false'::jsonb
      or v_listing -> 'is_certified' is distinct from 'false'::jsonb
      or v_listing -> 'certifications' is distinct from '[]'::jsonb
      or v_listing -> 'max_concurrent_jobs' is distinct from '1'::jsonb
    then
      raise exception using errcode = '22023', message = 'Service verification and concurrency fields are server-controlled.';
    end if;

    if v_listing ? 'portfolio_url'
      and (v_listing ->> 'portfolio_url') !~* '^https?://'
    then
      raise exception using errcode = '22023', message = 'Portfolio URL must use HTTP.';
    end if;

    if v_listing ? 'gallery'
      and jsonb_typeof(v_listing -> 'gallery') is distinct from 'array'
    then
      raise exception using errcode = '22023', message = 'Service gallery must be an array.';
    end if;

    if v_listing ? 'gallery'
      and exists (
        select 1
        from jsonb_array_elements(v_listing -> 'gallery') as images(value)
        where jsonb_typeof(images.value) is distinct from 'string'
          or (images.value #>> '{}') !~* '^https?://'
      )
    then
      raise exception using errcode = '22023', message = 'Service gallery must contain HTTP URLs.';
    end if;

    if v_listing ? 'portfolio_items'
      and jsonb_typeof(v_listing -> 'portfolio_items') is distinct from 'array'
    then
      raise exception using errcode = '22023', message = 'Service portfolio items must be an array.';
    end if;

    if v_listing ? 'portfolio_items'
      and exists (
        select 1
        from jsonb_array_elements(v_listing -> 'portfolio_items') as entries(value)
        where jsonb_typeof(entries.value) is distinct from 'object'
      )
    then
      raise exception using errcode = '22023', message = 'Service portfolio items must be objects.';
    end if;

    if v_listing ? 'portfolio_items'
      and exists (
        select 1
        from (
          select entries.value
          from jsonb_array_elements(v_listing -> 'portfolio_items') as entries(value)
          where jsonb_typeof(entries.value) = 'object'
        ) as object_entries
        where not (object_entries.value ?& array['type', 'url'])
          or exists (
            select 1
            from jsonb_object_keys(object_entries.value) as keys(key)
            where keys.key not in ('type', 'url')
          )
          or object_entries.value ->> 'type' not in ('url', 'image')
          or object_entries.value ->> 'url' !~* '^https?://'
      )
    then
      raise exception using errcode = '22023', message = 'Service portfolio items are invalid.';
    end if;
  else
    if v_listing ? 'recurrence_details'
      and jsonb_typeof(v_listing -> 'recurrence_details') is distinct from 'object'
    then
      raise exception using errcode = '22023', message = 'Recurrence details must be an object.';
    end if;

    if v_listing ? 'recurrence_details'
      and (
        not (v_listing -> 'recurrence_details' ? 'frequency')
        or jsonb_typeof(v_listing -> 'recurrence_details' -> 'frequency') is distinct from 'string'
        or exists (
          select 1
          from jsonb_object_keys(v_listing -> 'recurrence_details') as keys(key)
          where keys.key <> 'frequency'
        )
      )
    then
      raise exception using errcode = '22023', message = 'Recurrence details are invalid.';
    end if;

    if v_listing ? 'route_waypoints'
      and jsonb_typeof(v_listing -> 'route_waypoints') is distinct from 'array'
    then
      raise exception using errcode = '22023', message = 'Route waypoints must be an array.';
    end if;

    if v_listing ? 'route_waypoints'
      and exists (
        select 1
        from jsonb_array_elements(v_listing -> 'route_waypoints') as waypoints(value)
        where jsonb_typeof(waypoints.value) is distinct from 'string'
      )
    then
      raise exception using errcode = '22023', message = 'Route waypoints must contain strings only.';
    end if;

    if v_listing ? 'baggage_included'
      and jsonb_typeof(v_listing -> 'baggage_included') is distinct from 'object'
    then
      raise exception using errcode = '22023', message = 'Baggage details must be an object.';
    end if;

    if v_listing ? 'baggage_included'
      and (
        not (v_listing -> 'baggage_included' ? 'included')
        or jsonb_typeof(v_listing -> 'baggage_included' -> 'included') is distinct from 'boolean'
        or exists (
          select 1
          from jsonb_object_keys(v_listing -> 'baggage_included') as keys(key)
          where keys.key <> 'included'
        )
      )
    then
      raise exception using errcode = '22023', message = 'Baggage details are invalid.';
    end if;

    if v_listing ? 'route_gpx_url'
      and (v_listing ->> 'route_gpx_url') !~* '^https?://'
    then
      raise exception using errcode = '22023', message = 'Route GPX URL must use HTTP.';
    end if;

    v_is_ticket := lower(coalesce(v_listing ->> 'event_group', '')) like '%ticket%'
      or lower(coalesce(v_listing ->> 'event_category', '')) like '%ticket%';

    if v_is_ticket then
      if v_listing ->> 'transfer_rule_source' is distinct from 'user_attestation'
        or v_listing -> 'transfer_rule_confirmed' is distinct from 'true'::jsonb
      then
        raise exception using errcode = '22023', message = 'Ticket transfer authority must be an explicit user attestation.';
      end if;
    elsif (v_listing ? 'transfer_rule_source')
      or coalesce((v_listing ->> 'transfer_rule_confirmed')::boolean, false)
    then
      raise exception using errcode = '22023', message = 'Transfer authority fields are only valid for ticket events.';
    end if;
  end if;

  return private.create_domain_listing_v1_core(
    p_domain,
    p_payload,
    p_idempotency_key
  );
end;
$function$;

revoke all on function public.create_domain_listing_v1(text, jsonb, text)
  from public, anon;
grant execute on function public.create_domain_listing_v1(text, jsonb, text)
  to authenticated;

comment on function private.create_domain_listing_v1_core(text, jsonb, text) is
  'V1-05.2 private atomic persistence core; direct client execution is revoked.';
comment on function public.create_domain_listing_v1(text, jsonb, text) is
  'V1-05.2 fail-closed authenticated wrapper with explicit per-domain create allowlists.';

commit;
