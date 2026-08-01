-- V1-05.2 — canonical, atomic and idempotent creation for Properties, Services and Events.
--
-- The canonical persistence model is:
--   items + exactly one dedicated domain row.
-- Private editor state and exact/transfer-only details are stored separately and
-- are never part of the public listing projection.

begin;

alter table public.properties
  add column if not exists timezone text not null default 'UTC';

alter table public.services_listings
  add column if not exists timezone text not null default 'UTC';

alter table public.events_listings
  add column if not exists transfer_deadline_at timestamptz,
  add column if not exists transfer_rule_source text,
  add column if not exists transfer_rule_confirmed boolean not null default false;

create unique index if not exists uq_properties_item_id
  on public.properties (item_id);
create unique index if not exists uq_services_listings_item_id
  on public.services_listings (item_id);
create unique index if not exists uq_events_listings_item_id
  on public.events_listings (item_id);

create table if not exists public.domain_listing_private_data (
  item_id uuid primary key references public.items(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('property', 'service', 'event')),
  editor_payload jsonb not null default '{}'::jsonb,
  exact_location jsonb not null default '{}'::jsonb,
  transfer_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(editor_payload) = 'object'),
  check (jsonb_typeof(exact_location) = 'object'),
  check (jsonb_typeof(transfer_data) = 'object')
);

alter table public.domain_listing_private_data enable row level security;

drop policy if exists domain_listing_private_select_own
  on public.domain_listing_private_data;
create policy domain_listing_private_select_own
  on public.domain_listing_private_data
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on table public.domain_listing_private_data from public, anon;
revoke insert, update, delete on table public.domain_listing_private_data from authenticated;
grant select on table public.domain_listing_private_data to authenticated;

create table if not exists public.domain_listing_create_receipts (
  actor_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (domain in ('property', 'service', 'event')),
  idempotency_key text not null,
  request_hash text not null,
  item_id uuid not null references public.items(id) on delete cascade,
  listing_id uuid not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, domain, idempotency_key),
  unique (item_id),
  check (char_length(idempotency_key) between 8 and 120),
  check (idempotency_key ~ '^[A-Za-z0-9._:-]+$'),
  check (jsonb_typeof(response) = 'object')
);

alter table public.domain_listing_create_receipts enable row level security;
revoke all on table public.domain_listing_create_receipts from public, anon, authenticated;

create or replace function public.create_domain_listing_v1(
  p_domain text,
  p_payload jsonb,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions
as $function$
declare
  v_actor uuid := auth.uid();
  v_domain text := lower(btrim(coalesce(p_domain, '')));
  v_item jsonb;
  v_listing jsonb;
  v_private jsonb;
  v_existing public.domain_listing_create_receipts%rowtype;
  v_request_hash text;
  v_item_id uuid;
  v_listing_id uuid;
  v_response jsonb;
  v_table_name text;
  v_unknown_key text;
  v_column_list text := '';
  v_select_list text := '';
  v_sql text;
  v_is_ticket boolean := false;
  v_start_date date;
  v_end_date date;
  v_transfer_deadline timestamptz;
  v_allowed_item_keys constant text[] := array[
    'title', 'description', 'category_l1', 'category_l2', 'category_l3',
    'category_path', 'perceived_value_tier', 'swap_geo_preference',
    'swap_open_to', 'chain_swap_allowed', 'cross_category_swap',
    'swap_partial_allowed', 'swap_partial_topup_eur', 'escrow_accepted',
    'escrow_required', 'swap_wants_description', 'swap_wants_type',
    'swap_wants_value_tier', 'location', 'location_city', 'location_country',
    'images', 'image_url'
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

  if jsonb_typeof(p_payload) is distinct from 'object'
    or p_payload ->> 'schema_version' is distinct from '1.0'
    or p_payload ->> 'domain' is distinct from v_domain
    or jsonb_typeof(p_payload -> 'item') is distinct from 'object'
    or jsonb_typeof(p_payload -> 'listing') is distinct from 'object'
    or jsonb_typeof(coalesce(p_payload -> 'private', '{}'::jsonb)) is distinct from 'object'
  then
    raise exception using errcode = '22023', message = 'Invalid domain listing payload.';
  end if;

  v_item := p_payload -> 'item';
  v_listing := p_payload -> 'listing';
  v_private := coalesce(p_payload -> 'private', '{}'::jsonb);

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

  if nullif(btrim(v_item ->> 'title'), '') is null then
    raise exception using errcode = '22023', message = 'Listing title is required.';
  end if;

  if v_item ? 'swap_open_to'
    and jsonb_typeof(v_item -> 'swap_open_to') <> 'array'
  then
    raise exception using errcode = '22023', message = 'swap_open_to must be an array.';
  end if;

  if v_item ? 'swap_wants_type'
    and jsonb_typeof(v_item -> 'swap_wants_type') <> 'array'
  then
    raise exception using errcode = '22023', message = 'swap_wants_type must be an array.';
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
      and (v_listing ->> 'available_from')::date > (v_listing ->> 'available_until')::date
    then
      raise exception using errcode = '22023', message = 'Property availability range is invalid.';
    end if;

    if coalesce((v_listing ->> 'min_stay_days')::integer, 1) < 1
      or coalesce((v_listing ->> 'max_stay_days')::integer, 1) < coalesce((v_listing ->> 'min_stay_days')::integer, 1)
    then
      raise exception using errcode = '22023', message = 'Property stay limits are invalid.';
    end if;

    if v_listing ? 'timezone'
      and not exists (
        select 1 from pg_catalog.pg_timezone_names
        where name = v_listing ->> 'timezone'
      )
    then
      raise exception using errcode = '22023', message = 'Unsupported property timezone.';
    end if;

    if exists (
      select 1 from jsonb_object_keys(v_listing) as keys(key)
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
      and (v_listing ->> 'available_date_from')::date > (v_listing ->> 'available_date_until')::date
    then
      raise exception using errcode = '22023', message = 'Service availability range is invalid.';
    end if;

    if v_listing ? 'timezone'
      and not exists (
        select 1 from pg_catalog.pg_timezone_names
        where name = v_listing ->> 'timezone'
      )
    then
      raise exception using errcode = '22023', message = 'Unsupported service timezone.';
    end if;

    if exists (
      select 1 from jsonb_object_keys(v_listing) as keys(key)
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
      select 1 from pg_catalog.pg_timezone_names
      where name = v_listing ->> 'timezone'
    ) then
      raise exception using errcode = '22023', message = 'Unsupported event timezone.';
    end if;

    if coalesce((v_listing ->> 'capacity_total')::integer, 0) < 1
      or coalesce((v_listing ->> 'capacity_available')::integer, 0) < 0
      or coalesce((v_listing ->> 'capacity_available')::integer, 0) > coalesce((v_listing ->> 'capacity_total')::integer, 0)
    then
      raise exception using errcode = '22023', message = 'Event capacity is invalid.';
    end if;

    v_is_ticket := lower(coalesce(v_listing ->> 'event_group', '')) like '%ticket%'
      or lower(coalesce(v_listing ->> 'event_category', '')) like '%ticket%';

    if v_is_ticket then
      if coalesce((v_listing ->> 'is_transferable')::boolean, false) is not true
        or coalesce((v_listing ->> 'transfer_rule_confirmed')::boolean, false) is not true
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
      select 1 from jsonb_object_keys(v_listing) as keys(key)
      where keys.key in (
        'booking_reference', 'online_url', 'address', 'seat_info',
        'venue_row', 'venue_seat'
      )
    ) then
      raise exception using errcode = '22023', message = 'Private event transfer fields cannot be public.';
    end if;
  end if;

  if (v_listing ? 'lat' and scale((v_listing ->> 'lat')::numeric) > 2)
    or (v_listing ? 'lon' and scale((v_listing ->> 'lon')::numeric) > 2)
  then
    raise exception using errcode = '22023', message = 'Public coordinates must be approximate.';
  end if;

  v_request_hash := encode(
    extensions.digest(convert_to(p_payload::text, 'UTF8'), 'sha256'),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_actor::text || ':' || v_domain || ':' || p_idempotency_key, 0)
  );

  select *
  into v_existing
  from public.domain_listing_create_receipts
  where actor_id = v_actor
    and domain = v_domain
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.request_hash <> v_request_hash then
      raise exception using
        errcode = '23505',
        message = 'Idempotency key was already used with a different request.';
    end if;

    return v_existing.response || jsonb_build_object('replayed', true);
  end if;

  insert into public.items (
    owner_id,
    title,
    description,
    category,
    condition,
    status,
    is_active,
    item_type,
    category_l1,
    category_l2,
    category_l3,
    category_path,
    perceived_value_tier,
    swap_geo_preference,
    swap_open_to,
    chain_swap_allowed,
    cross_category_swap,
    swap_partial_allowed,
    swap_partial_topup_eur,
    escrow_accepted,
    escrow_required,
    swap_wants_description,
    swap_wants_type,
    swap_wants_value_tier,
    location,
    location_city,
    location_country,
    images,
    image_url
  ) values (
    v_actor,
    btrim(v_item ->> 'title'),
    nullif(btrim(v_item ->> 'description'), ''),
    v_domain,
    'used_good',
    'active',
    true,
    v_domain,
    nullif(btrim(v_item ->> 'category_l1'), ''),
    nullif(btrim(v_item ->> 'category_l2'), ''),
    nullif(btrim(v_item ->> 'category_l3'), ''),
    nullif(btrim(v_item ->> 'category_path'), ''),
    nullif(btrim(v_item ->> 'perceived_value_tier'), ''),
    coalesce(nullif(btrim(v_item ->> 'swap_geo_preference'), ''), 'regional'),
    case when v_item ? 'swap_open_to'
      then array(select jsonb_array_elements_text(v_item -> 'swap_open_to'))
      else '{}'::text[] end,
    coalesce((v_item ->> 'chain_swap_allowed')::boolean, false),
    coalesce((v_item ->> 'cross_category_swap')::boolean, false),
    coalesce((v_item ->> 'swap_partial_allowed')::boolean, false),
    nullif(v_item ->> 'swap_partial_topup_eur', '')::numeric,
    coalesce((v_item ->> 'escrow_accepted')::boolean, false),
    coalesce((v_item ->> 'escrow_required')::boolean, false),
    nullif(btrim(v_item ->> 'swap_wants_description'), ''),
    case when v_item ? 'swap_wants_type'
      then array(select jsonb_array_elements_text(v_item -> 'swap_wants_type'))
      else null end,
    nullif(btrim(v_item ->> 'swap_wants_value_tier'), ''),
    nullif(btrim(v_item ->> 'location'), ''),
    nullif(btrim(v_item ->> 'location_city'), ''),
    nullif(upper(btrim(v_item ->> 'location_country')), ''),
    coalesce(v_item -> 'images', '[]'::jsonb),
    nullif(btrim(v_item ->> 'image_url'), '')
  ) returning id into v_item_id;

  select
    coalesce(string_agg(format(', %I', c.column_name), '' order by c.ordinal_position), ''),
    coalesce(string_agg(format(', r.%I', c.column_name), '' order by c.ordinal_position), '')
  into v_column_list, v_select_list
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = v_table_name
    and c.column_name not in ('id', 'item_id', 'owner_id', 'created_at', 'updated_at', 'status')
    and v_listing ? c.column_name;

  v_sql := format(
    'insert into public.%I (item_id, owner_id, status%s) '
    || 'select $2, $3, ''active''%s '
    || 'from jsonb_populate_record(null::public.%I, $1) as r '
    || 'returning id',
    v_table_name,
    v_column_list,
    v_select_list,
    v_table_name
  );

  execute v_sql
    using v_listing, v_item_id, v_actor
    into v_listing_id;

  insert into public.domain_listing_private_data (
    item_id,
    owner_id,
    domain,
    editor_payload,
    exact_location,
    transfer_data
  ) values (
    v_item_id,
    v_actor,
    v_domain,
    coalesce(v_private -> 'editor_payload', '{}'::jsonb),
    coalesce(v_private -> 'exact_location', '{}'::jsonb),
    coalesce(v_private -> 'transfer_data', '{}'::jsonb)
  );

  v_response := jsonb_build_object(
    'schema_version', '1.0',
    'domain', v_domain,
    'item_id', v_item_id,
    'listing_id', v_listing_id,
    'replayed', false
  );

  insert into public.domain_listing_create_receipts (
    actor_id,
    domain,
    idempotency_key,
    request_hash,
    item_id,
    listing_id,
    response
  ) values (
    v_actor,
    v_domain,
    p_idempotency_key,
    v_request_hash,
    v_item_id,
    v_listing_id,
    v_response
  );

  return v_response;
end;
$function$;

revoke all on function public.create_domain_listing_v1(text, jsonb, text)
  from public, anon;
grant execute on function public.create_domain_listing_v1(text, jsonb, text)
  to authenticated;

-- Direct domain-row creation is replaced by the atomic authority above.
revoke insert on table public.properties from authenticated;
revoke insert on table public.services_listings from authenticated;
revoke insert on table public.events_listings from authenticated;

-- Keep legacy direct item creation only for Objects. Properties, Services and
-- Events must be created through create_domain_listing_v1.
drop policy if exists items_insert_own on public.items;
create policy items_insert_own
  on public.items
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and item_type = 'object'
  );

comment on function public.create_domain_listing_v1(text, jsonb, text) is
  'V1-05.2 canonical atomic create authority for property, service and event listings.';
comment on table public.domain_listing_private_data is
  'Owner-only editor state and private exact/transfer data, separate from public listing projections.';
comment on table public.domain_listing_create_receipts is
  'Server-only exact-once receipts for domain listing creation.';

commit;
