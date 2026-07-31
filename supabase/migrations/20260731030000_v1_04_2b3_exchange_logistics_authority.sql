-- V1-04.2B.3 — Exchange Logistics Authority

create or replace function public.update_exchange_logistics_v1(
  p_swap_id uuid,
  p_command text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_metadata jsonb;
  v_logistics jsonb;
  v_method text;
  v_status text;
  v_title text;
  v_description text;
  v_event jsonb;
  v_confirmed jsonb;
  v_now timestamptz := clock_timestamp();
begin
  if v_actor is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if p_command not in (
    'set_method',
    'set_status',
    'set_local_handover',
    'set_courier',
    'set_property',
    'set_service',
    'set_event'
  ) then
    raise exception 'unsupported_logistics_command' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid_logistics_payload' using errcode = '22023';
  end if;

  if coalesce(p_payload, '{}'::jsonb) ?| array[
    'latitude', 'longitude', 'coordinates', 'exact_address', 'street_address'
  ] then
    raise exception 'exact_location_not_allowed' using errcode = '22023';
  end if;

  select *
  into v_swap
  from public.swaps
  where id = p_swap_id
  for update;

  if not found then
    raise exception 'swap_not_found' using errcode = 'P0002';
  end if;

  if v_actor <> v_swap.requester_id and v_actor <> v_swap.responder_id then
    raise exception 'swap_participant_required' using errcode = '42501';
  end if;

  v_metadata := coalesce(v_swap.swap_metadata, '{}'::jsonb);
  v_logistics := v_metadata -> 'exchange_logistics';

  if jsonb_typeof(v_logistics) <> 'object' then
    v_method := case
      when p_command = 'set_method' then p_payload ->> 'method'
      when p_command = 'set_courier' then 'national_courier'
      when p_command = 'set_property' then 'vacation_handoff'
      when p_command = 'set_service' then 'service_exchange'
      else 'local_meetup'
    end;

    v_logistics := jsonb_build_object(
      'swap_id', p_swap_id,
      'method', v_method,
      'status', 'planning',
      'meetup_location', null,
      'courier', null,
      'property', null,
      'service', null,
      'event', null,
      'vacation', null,
      'timeline', jsonb_build_array(
        jsonb_build_object(
          'id', gen_random_uuid(),
          'type', 'planning',
          'title', 'Exchange planning started',
          'created_at', v_now
        )
      )
    );
  end if;

  if p_command = 'set_method' then
    v_method := p_payload ->> 'method';
    if v_method not in (
      'local_meetup', 'national_courier', 'international_courier',
      'vacation_handoff', 'service_exchange'
    ) then
      raise exception 'invalid_exchange_method' using errcode = '22023';
    end if;
    v_logistics := jsonb_set(v_logistics, '{method}', to_jsonb(v_method), true);
    v_status := 'planning';
    v_title := 'Exchange method selected';
    v_description := v_method;

  elsif p_command = 'set_status' then
    v_status := p_payload ->> 'status';
    if v_status not in (
      'planning', 'meeting_scheduled', 'packaging', 'in_transit',
      'awaiting_pickup', 'delivered', 'completed', 'failed'
    ) then
      raise exception 'invalid_exchange_status' using errcode = '22023';
    end if;
    v_title := left(coalesce(nullif(btrim(p_payload ->> 'title'), ''),
      'Exchange status changed to ' || v_status), 160);
    v_description := left(nullif(btrim(p_payload ->> 'description'), ''), 500);

  elsif p_command = 'set_local_handover' then
    if nullif(btrim(p_payload ->> 'area_label'), '') is null then
      raise exception 'area_label_required' using errcode = '22023';
    end if;
    v_confirmed := coalesce(v_logistics #> '{meetup_location,exact_location_confirmed_by}', '[]'::jsonb);
    if not (v_confirmed @> jsonb_build_array(v_actor)) then
      v_confirmed := v_confirmed || jsonb_build_array(v_actor);
    end if;
    v_logistics := jsonb_set(v_logistics, '{method}', '"local_meetup"'::jsonb, true);
    v_logistics := jsonb_set(v_logistics, '{meetup_location}', jsonb_strip_nulls(jsonb_build_object(
      'area_label', left(btrim(p_payload ->> 'area_label'), 160),
      'city', left(nullif(btrim(p_payload ->> 'city'), ''), 80),
      'country', left(nullif(btrim(p_payload ->> 'country'), ''), 80),
      'scheduled_at', nullif(p_payload ->> 'scheduled_at', ''),
      'exact_location_confirmed_by', v_confirmed
    )), true);
    v_status := 'meeting_scheduled';
    v_title := 'Local handover plan updated';
    v_description := left(btrim(p_payload ->> 'area_label'), 160);

  elsif p_command = 'set_courier' then
    v_method := case
      when v_logistics ->> 'method' = 'international_courier' then 'international_courier'
      else 'national_courier'
    end;
    v_logistics := jsonb_set(v_logistics, '{method}', to_jsonb(v_method), true);
    v_logistics := jsonb_set(v_logistics, '{courier}', jsonb_strip_nulls(jsonb_build_object(
      'provider', left(nullif(btrim(p_payload ->> 'provider'), ''), 80),
      'tracking_code', left(nullif(btrim(p_payload ->> 'tracking_code'), ''), 80),
      'packaging', left(nullif(btrim(p_payload ->> 'packaging'), ''), 80),
      'package_notes', left(nullif(btrim(p_payload ->> 'package_notes'), ''), 240),
      'estimated_delivery', nullif(p_payload ->> 'estimated_delivery', '')
    )), true);
    v_status := 'in_transit';
    v_title := 'Courier logistics updated';

  elsif p_command = 'set_property' then
    v_confirmed := coalesce(v_logistics #> '{property,confirmed_by}', '[]'::jsonb);
    if not (v_confirmed @> jsonb_build_array(v_actor)) then
      v_confirmed := v_confirmed || jsonb_build_array(v_actor);
    end if;
    v_logistics := jsonb_set(v_logistics, '{method}', '"vacation_handoff"'::jsonb, true);
    v_logistics := jsonb_set(v_logistics, '{property}', jsonb_strip_nulls(jsonb_build_object(
      'check_in', nullif(p_payload ->> 'check_in', ''),
      'check_out', nullif(p_payload ->> 'check_out', ''),
      'rules', left(nullif(btrim(p_payload ->> 'rules'), ''), 500),
      'confirmed_by', v_confirmed
    )), true);
    v_status := 'meeting_scheduled';
    v_title := 'Property exchange logistics confirmed';

  elsif p_command = 'set_service' then
    v_confirmed := coalesce(v_logistics #> '{service,confirmed_by}', '[]'::jsonb);
    if not (v_confirmed @> jsonb_build_array(v_actor)) then
      v_confirmed := v_confirmed || jsonb_build_array(v_actor);
    end if;
    v_logistics := jsonb_set(v_logistics, '{method}', '"service_exchange"'::jsonb, true);
    v_logistics := jsonb_set(v_logistics, '{service}', jsonb_strip_nulls(jsonb_build_object(
      'deliverables', left(nullif(btrim(p_payload ->> 'deliverables'), ''), 500),
      'deadline', nullif(p_payload ->> 'deadline', ''),
      'session_url', left(nullif(btrim(p_payload ->> 'session_url'), ''), 240),
      'confirmed_by', v_confirmed
    )), true);
    v_status := 'meeting_scheduled';
    v_title := 'Service exchange logistics confirmed';

  else
    v_confirmed := coalesce(v_logistics #> '{event,confirmed_by}', '[]'::jsonb);
    if not (v_confirmed @> jsonb_build_array(v_actor)) then
      v_confirmed := v_confirmed || jsonb_build_array(v_actor);
    end if;
    v_logistics := jsonb_set(v_logistics, '{event}', jsonb_strip_nulls(jsonb_build_object(
      'transfer_deadline', nullif(p_payload ->> 'transfer_deadline', ''),
      'proof_label', left(nullif(btrim(p_payload ->> 'proof_label'), ''), 160),
      'transfer_notes', left(nullif(btrim(p_payload ->> 'transfer_notes'), ''), 500),
      'confirmed_by', v_confirmed
    )), true);
    v_status := 'awaiting_pickup';
    v_title := 'Event transfer logistics confirmed';
  end if;

  v_event := jsonb_strip_nulls(jsonb_build_object(
    'id', gen_random_uuid(),
    'type', v_status,
    'title', v_title,
    'description', v_description,
    'created_at', v_now,
    'actor_id', v_actor
  ));

  v_logistics := jsonb_set(v_logistics, '{status}', to_jsonb(v_status), true);
  v_logistics := jsonb_set(
    v_logistics,
    '{timeline}',
    coalesce(v_logistics -> 'timeline', '[]'::jsonb) || jsonb_build_array(v_event),
    true
  );
  v_metadata := jsonb_set(v_metadata, '{exchange_logistics}', v_logistics, true);

  update public.swaps
  set swap_metadata = v_metadata,
      updated_at = v_now
  where id = p_swap_id;

  if p_command = 'set_status' then
    insert into public.notifications (
      user_id, type, title, body, data, read, is_read, priority
    )
    values
      (v_swap.requester_id, 'exchange_update', 'Exchange updated', v_title,
       jsonb_build_object('swap_id', p_swap_id, 'status', v_status), false, false, 'normal'),
      (v_swap.responder_id, 'exchange_update', 'Exchange updated', v_title,
       jsonb_build_object('swap_id', p_swap_id, 'status', v_status), false, false, 'normal');
  end if;

  return v_logistics;
end;
$$;

revoke all on function public.update_exchange_logistics_v1(uuid, text, jsonb) from public;
revoke all on function public.update_exchange_logistics_v1(uuid, text, jsonb) from anon;
grant execute on function public.update_exchange_logistics_v1(uuid, text, jsonb) to authenticated;
