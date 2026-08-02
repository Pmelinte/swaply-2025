begin;

create schema if not exists private;

create or replace view public.matching_items_v1
with (security_invoker = true, security_barrier = true)
as
select
  i.id,
  i.owner_id,
  i.title,
  i.description,
  coalesce(nullif(i.category_l1, ''), nullif(i.category, ''), i.item_type) as category,
  i.category_l1,
  i.category_l2,
  i.category_l3,
  i.subcategory,
  i.subcategory_slug,
  i.condition,
  i.item_type,
  i.perceived_value_tier,
  i.swap_open_to,
  i.swap_wants_type,
  i.swap_wants_category_l1,
  i.swap_wants_description,
  i.swap_wants_value_tier,
  i.cross_category_swap,
  i.images,
  i.image_url,
  i.estimated_value,
  i.approximate_value,
  i.location,
  i.location_city,
  i.location_country,
  i.created_at,
  i.is_active,
  i.status,
  case i.item_type
    when 'property' then jsonb_strip_nulls(jsonb_build_object(
      'domain', 'property',
      'property_type', p.property_type,
      'property_subtype', p.property_subtype,
      'available_from', p.available_from,
      'available_until', p.available_until,
      'blocked_dates', coalesce(p.blocked_dates, '[]'::jsonb),
      'flexible_dates', p.flexible_dates,
      'exchange_type', p.exchange_type,
      'min_stay_days', p.min_stay_days,
      'max_stay_days', p.max_stay_days,
      'bedrooms', p.bedrooms,
      'bathrooms', p.bathrooms,
      'sleeps_max', p.sleeps_max,
      'surface_total_sqm', p.surface_total_sqm,
      'timezone', p.timezone,
      'city', p.city,
      'country_code', nullif(btrim(p.country_code::text), ''),
      'lat', p.lat,
      'lon', p.lon
    ))
    when 'service' then jsonb_strip_nulls(jsonb_build_object(
      'domain', 'service',
      'category_l1', s.category_l1,
      'category_l2', s.category_l2,
      'category_l3', s.category_l3,
      'service_name', s.service_name,
      'delivery_mode', s.delivery_mode,
      'available_days', s.available_days,
      'available_from_time', s.available_from_time,
      'available_until_time', s.available_until_time,
      'available_date_from', s.available_date_from,
      'available_date_until', s.available_date_until,
      'blocked_dates', coalesce(s.blocked_dates, '[]'::jsonb),
      'timezone', s.timezone,
      'max_concurrent_jobs', s.max_concurrent_jobs,
      'estimated_hours', s.estimated_hours,
      'estimated_days', s.estimated_days,
      'experience_years', s.experience_years,
      'skill_level', s.skill_level,
      'service_area_type', s.service_area_type,
      'service_area_countries', s.service_area_countries,
      'service_area_cities', s.service_area_cities,
      'service_area_radius_km', s.service_area_radius_km
    ))
    when 'event' then jsonb_strip_nulls(jsonb_build_object(
      'domain', 'event',
      'event_group', e.event_group,
      'event_category', e.event_category,
      'event_subcategory', e.event_subcategory,
      'start_date', e.start_date,
      'end_date', e.end_date,
      'start_time', e.start_time,
      'end_time', e.end_time,
      'timezone', e.timezone,
      'location_type', e.location_type,
      'city', e.city,
      'country_code', nullif(btrim(e.country_code::text), ''),
      'capacity_total', e.capacity_total,
      'capacity_available', e.capacity_available,
      'is_transferable', e.is_transferable,
      'transfer_deadline_at', e.transfer_deadline_at,
      'transfer_rule_confirmed', e.transfer_rule_confirmed,
      'transfer_rule_source', e.transfer_rule_source,
      'includes_transport', e.includes_transport,
      'includes_accommodation', e.includes_accommodation,
      'includes_meals', e.includes_meals,
      'is_ticket', (
        lower(coalesce(e.event_group, '')) like '%ticket%'
        or lower(coalesce(e.event_category, '')) like '%ticket%'
      )
    ))
    else jsonb_build_object('domain', 'object')
  end as domain_profile
from public.items i
left join public.properties p
  on i.item_type = 'property'
 and p.item_id = i.id
left join public.services_listings s
  on i.item_type = 'service'
 and s.item_id = i.id
left join public.events_listings e
  on i.item_type = 'event'
 and e.item_id = i.id
where i.is_active = true
  and i.status = 'active'
  and case i.item_type
    when 'object' then true
    when 'property' then
      p.id is not null
      and p.status = 'active'
      and (p.available_until is null or p.available_until >= current_date)
    when 'service' then
      s.id is not null
      and s.status = 'active'
      and (s.available_date_until is null or s.available_date_until >= current_date)
    when 'event' then
      e.id is not null
      and e.status = 'active'
      and e.start_date is not null
      and coalesce(e.end_date, e.start_date) >= current_date
      and coalesce(e.capacity_available, e.capacity_total, 1) > 0
      and (
        not (
          lower(coalesce(e.event_group, '')) like '%ticket%'
          or lower(coalesce(e.event_category, '')) like '%ticket%'
        )
        or (
          coalesce(e.is_transferable, false) = true
          and coalesce(e.transfer_rule_confirmed, false) = true
          and e.transfer_deadline_at is not null
          and e.transfer_deadline_at > now()
        )
      )
    else false
  end;

revoke all on table public.matching_items_v1 from public, anon;
grant select on table public.matching_items_v1 to authenticated, service_role;

comment on view public.matching_items_v1 is
  'V1-05.4.1 privacy-safe, RLS-invoker canonical matching projection for Object, Property, Service and Event listings.';

create or replace function private.matching_domain_allowed_v1(
  p_allowed text[],
  p_other_domain text
)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select
    coalesce(cardinality(p_allowed), 0) = 0
    or exists (
      select 1
      from unnest(coalesce(p_allowed, '{}'::text[])) as allowed(value)
      where lower(btrim(allowed.value)) in (
        lower(btrim(coalesce(p_other_domain, ''))),
        'anything',
        'all'
      )
    );
$function$;

create or replace function private.matching_pair_allowed_v1(
  p_from_domain text,
  p_from_open_to text[],
  p_from_wants_type text[],
  p_to_domain text,
  p_to_open_to text[],
  p_to_wants_type text[]
)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select
    lower(coalesce(p_from_domain, '')) in ('object', 'property', 'service', 'event')
    and lower(coalesce(p_to_domain, '')) in ('object', 'property', 'service', 'event')
    and private.matching_domain_allowed_v1(p_from_open_to, p_to_domain)
    and private.matching_domain_allowed_v1(p_from_wants_type, p_to_domain)
    and private.matching_domain_allowed_v1(p_to_open_to, p_from_domain)
    and private.matching_domain_allowed_v1(p_to_wants_type, p_from_domain);
$function$;

revoke all on function private.matching_domain_allowed_v1(text[], text)
  from public, anon, authenticated, service_role;
revoke all on function private.matching_pair_allowed_v1(
  text, text[], text[], text, text[], text[]
) from public, anon, authenticated, service_role;

create or replace function public.express_matching_interest(
  p_from_item_id uuid,
  p_to_item_id uuid,
  p_match_score numeric default null,
  p_source text default 'browsing'
)
returns table (
  id uuid,
  to_user_id uuid,
  to_item_id uuid,
  match_score numeric,
  status text
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_from public.matching_items_v1%rowtype;
  v_to public.matching_items_v1%rowtype;
  v_source text := coalesce(p_source, 'browsing');
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if v_source not in ('browsing', 'map', 'ai') then
    raise exception using errcode = '22023', message = 'INVALID_INTEREST_SOURCE';
  end if;

  select *
  into v_from
  from public.matching_items_v1 item
  where item.id = p_from_item_id
    and item.owner_id = v_actor_id;

  if not found then
    raise exception using errcode = '42501', message = 'SOURCE_ITEM_OWNER_REQUIRED';
  end if;

  select *
  into v_to
  from public.matching_items_v1 item
  where item.id = p_to_item_id;

  if not found then
    raise exception using errcode = '23514', message = 'TARGET_ITEM_UNAVAILABLE';
  end if;

  if v_to.owner_id = v_actor_id then
    raise exception using errcode = '23514', message = 'SELF_INTEREST_NOT_ALLOWED';
  end if;

  if not private.matching_pair_allowed_v1(
    v_from.item_type,
    v_from.swap_open_to,
    v_from.swap_wants_type,
    v_to.item_type,
    v_to.swap_open_to,
    v_to.swap_wants_type
  ) then
    raise exception using errcode = '23514', message = 'DOMAIN_PAIR_NOT_ALLOWED';
  end if;

  insert into public.matching_sessions (user_id, slot_1_item_id, filters)
  values (
    v_actor_id,
    p_from_item_id,
    jsonb_build_object(
      'source', 'express_interest',
      'from_domain', v_from.item_type,
      'to_domain', v_to.item_type
    )
  )
  on conflict (user_id)
  do update set
    slot_1_item_id = excluded.slot_1_item_id,
    filters = excluded.filters,
    updated_at = now();

  return query
  insert into public.matching_interests (
    from_user_id,
    to_user_id,
    from_item_id,
    to_item_id,
    match_score,
    source,
    status
  )
  values (
    v_actor_id,
    v_to.owner_id,
    p_from_item_id,
    p_to_item_id,
    least(100, greatest(0, coalesce(p_match_score, 0))),
    v_source,
    'pending'
  )
  on conflict (from_user_id, from_item_id, to_user_id, to_item_id)
  where status in ('pending', 'accepted')
  do update set
    match_score = excluded.match_score,
    source = excluded.source
  returning
    matching_interests.id,
    matching_interests.to_user_id,
    matching_interests.to_item_id,
    matching_interests.match_score,
    matching_interests.status;
end;
$function$;

create or replace function public.accept_matching_interest(p_interest_id uuid)
returns table (
  interest_id uuid,
  matching_session_id uuid,
  match_id uuid,
  conversation_id uuid,
  interest_status text,
  match_status text
)
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_interest public.matching_interests%rowtype;
  v_from public.matching_items_v1%rowtype;
  v_to public.matching_items_v1%rowtype;
  v_matching_session_id uuid;
  v_match_id uuid;
  v_conversation_id uuid;
  v_existing_match_status text;
  v_existing_converted_swap_id uuid;
  v_match_type text;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select interest.*
  into v_interest
  from public.matching_interests interest
  where interest.id = p_interest_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'INTEREST_NOT_FOUND';
  end if;

  if v_interest.to_user_id is distinct from v_actor_id then
    raise exception using errcode = '42501', message = 'INTEREST_RECIPIENT_REQUIRED';
  end if;

  if v_interest.from_user_id is null
    or v_interest.to_user_id is null
    or v_interest.from_item_id is null
    or v_interest.to_item_id is null
    or v_interest.from_user_id = v_interest.to_user_id
  then
    raise exception using errcode = '23514', message = 'INVALID_INTEREST_PARTICIPANTS';
  end if;

  if v_interest.status is null or v_interest.status not in ('pending', 'accepted') then
    raise exception using errcode = '23514', message = 'INTEREST_NOT_PENDING';
  end if;

  select *
  into v_from
  from public.matching_items_v1 item
  where item.id = v_interest.from_item_id
    and item.owner_id = v_interest.from_user_id;

  if not found then
    raise exception using errcode = '23514', message = 'OFFERED_ITEM_UNAVAILABLE';
  end if;

  select *
  into v_to
  from public.matching_items_v1 item
  where item.id = v_interest.to_item_id
    and item.owner_id = v_interest.to_user_id;

  if not found then
    raise exception using errcode = '23514', message = 'TARGET_ITEM_UNAVAILABLE';
  end if;

  if not private.matching_pair_allowed_v1(
    v_from.item_type,
    v_from.swap_open_to,
    v_from.swap_wants_type,
    v_to.item_type,
    v_to.swap_open_to,
    v_to.swap_wants_type
  ) then
    raise exception using errcode = '23514', message = 'DOMAIN_PAIR_NOT_ALLOWED';
  end if;

  insert into public.matching_sessions (user_id, slot_1_item_id, filters)
  values (
    v_interest.from_user_id,
    v_interest.from_item_id,
    jsonb_build_object(
      'source', 'accepted_interest',
      'interest_id', v_interest.id,
      'from_domain', v_from.item_type,
      'to_domain', v_to.item_type
    )
  )
  on conflict (user_id)
  do update set
    slot_1_item_id = excluded.slot_1_item_id,
    filters = excluded.filters,
    updated_at = now()
  returning id into v_matching_session_id;

  v_match_type := case when v_interest.source = 'ai' then 'ai' else 'manual' end;

  select match_row.id, match_row.status, match_row.converted_swap_id
  into v_match_id, v_existing_match_status, v_existing_converted_swap_id
  from public.matches match_row
  where match_row.initiator_id = v_interest.from_user_id
    and match_row.target_user_id = v_interest.to_user_id
    and match_row.initiator_item_id = v_interest.from_item_id
    and match_row.target_item_id = v_interest.to_item_id
  for update;

  if found then
    if v_existing_match_status = 'converted_to_swap'
      or v_existing_converted_swap_id is not null
    then
      raise exception using errcode = '23514', message = 'MATCH_ALREADY_CONVERTED';
    end if;

    update public.matches
    set match_type = v_match_type,
        status = 'accepted',
        ai_score = v_interest.match_score,
        ai_reasoning = null,
        slot_position = 1,
        dismissed_by = null,
        dismissed_at = null,
        dismiss_reason = null,
        expires_at = now() + interval '30 days',
        updated_at = now()
    where id = v_match_id;
  else
    insert into public.matches (
      initiator_id,
      target_user_id,
      initiator_item_id,
      target_item_id,
      match_type,
      status,
      ai_score,
      slot_position
    ) values (
      v_interest.from_user_id,
      v_interest.to_user_id,
      v_interest.from_item_id,
      v_interest.to_item_id,
      v_match_type,
      'accepted',
      v_interest.match_score,
      1
    )
    returning id into v_match_id;
  end if;

  insert into public.conversations (
    match_id,
    participant_ids,
    item_ids,
    status,
    agenda_state
  ) values (
    v_match_id,
    array[v_interest.from_user_id, v_interest.to_user_id]::uuid[],
    array[v_interest.from_item_id, v_interest.to_item_id]::uuid[],
    'active',
    '{}'::jsonb
  )
  on conflict on constraint conversations_match_id_key
  do update set
    participant_ids = excluded.participant_ids,
    item_ids = excluded.item_ids,
    updated_at = now()
  returning id into v_conversation_id;

  if v_interest.status = 'pending' then
    update public.matching_interests
    set status = 'accepted'
    where id = v_interest.id;
  end if;

  return query
  select
    v_interest.id,
    v_matching_session_id,
    v_match_id,
    v_conversation_id,
    'accepted'::text,
    'accepted'::text;
end;
$function$;

revoke all on function public.express_matching_interest(uuid, uuid, numeric, text)
  from public, anon;
grant execute on function public.express_matching_interest(uuid, uuid, numeric, text)
  to authenticated;

revoke all on function public.accept_matching_interest(uuid)
  from public, anon;
grant execute on function public.accept_matching_interest(uuid)
  to authenticated;

comment on function public.express_matching_interest(uuid, uuid, numeric, text) is
  'V1-05.4.1 canonical participant-only interest authority with active-domain and mutual swap compatibility validation.';
comment on function public.accept_matching_interest(uuid) is
  'V1-05.4.1 canonical accept authority that revalidates active-domain availability and mutual compatibility before Match and Conversation creation.';

commit;
