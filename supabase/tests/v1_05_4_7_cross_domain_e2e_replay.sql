begin;

set local statement_timeout = '240s';
set local lock_timeout = '10s';

create temporary table pg_temp.v1547_state (
  key text primary key,
  value text not null
) on commit drop;

grant select, insert, update, delete
  on table pg_temp.v1547_state
  to authenticated;

create or replace function pg_temp.assert_true(
  p_condition boolean,
  p_message text
)
returns void
language plpgsql
as $function$
begin
  if coalesce(p_condition, false) is not true then
    raise exception 'V1-05.4.7 replay assertion failed: %', p_message;
  end if;
end;
$function$;

create or replace function pg_temp.authenticate_as(
  p_user_id uuid
)
returns void
language plpgsql
as $function$
begin
  perform pg_catalog.set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform pg_catalog.set_config('request.jwt.claim.role', 'authenticated', true);
  perform pg_catalog.set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', p_user_id,
      'role', 'authenticated',
      'aal', 'aal1'
    )::text,
    true
  );
end;
$function$;

create or replace function pg_temp.expect_error(
  p_sql text,
  p_expected_state text,
  p_message_fragment text default null
)
returns void
language plpgsql
as $function$
begin
  begin
    execute p_sql;
  exception
    when others then
      if sqlstate is distinct from p_expected_state then
        raise exception
          'V1-05.4.7 expected SQLSTATE %, received %: %',
          p_expected_state,
          sqlstate,
          sqlerrm;
      end if;

      if p_message_fragment is not null
        and pg_catalog.strpos(
          pg_catalog.lower(sqlerrm),
          pg_catalog.lower(p_message_fragment)
        ) = 0
      then
        raise exception
          'V1-05.4.7 expected error containing "%", received: %',
          p_message_fragment,
          sqlerrm;
      end if;

      return;
  end;

  raise exception
    'V1-05.4.7 expected SQLSTATE %, but the statement succeeded.',
    p_expected_state;
end;
$function$;

set local session_replication_role = replica;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'a5470000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'v1547-property-owner@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5470000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'v1547-service-owner@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5470000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'v1547-outsider@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  );

set local session_replication_role = origin;

insert into public.profiles (
  user_id,
  username,
  role,
  created_at,
  updated_at
) values
  (
    'a5470000-0000-4000-8000-000000000001',
    'v1547_property_owner',
    'user',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5470000-0000-4000-8000-000000000002',
    'v1547_service_owner',
    'user',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5470000-0000-4000-8000-000000000003',
    'v1547_outsider',
    'user',
    clock_timestamp(),
    clock_timestamp()
  );

insert into public.items (
  id,
  owner_id,
  title,
  description,
  category,
  condition,
  status,
  is_active,
  item_type,
  moderation_status,
  category_l1,
  category_l2,
  category_l3,
  subcategory,
  subcategory_slug,
  perceived_value_tier,
  swap_open_to,
  swap_wants_type,
  swap_wants_category_l1,
  swap_wants_description,
  swap_wants_value_tier,
  cross_category_swap,
  location,
  location_city,
  location_country,
  images,
  created_at,
  updated_at
) values
  (
    'a5470000-0000-4000-8000-000000000101',
    'a5470000-0000-4000-8000-000000000001',
    'V1-05.4.7 Property',
    'Deterministic Property offered in the canonical cross-domain replay.',
    'properties',
    'used_good',
    'active',
    true,
    'property',
    'approved',
    'property',
    'residential',
    'house',
    'house',
    'house',
    'medium',
    array['service']::text[],
    array['service']::text[],
    'technology',
    'Remote implementation service in exchange for a temporary stay.',
    'medium',
    true,
    'Paris, France',
    'Paris',
    'FR',
    '[]'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5470000-0000-4000-8000-000000000102',
    'a5470000-0000-4000-8000-000000000002',
    'V1-05.4.7 Service',
    'Deterministic Service requested by the Property owner.',
    'services',
    'used_good',
    'active',
    true,
    'service',
    'approved',
    'technology',
    'software',
    'web-development',
    'web-development',
    'web-development',
    'medium',
    array['property']::text[],
    array['property']::text[],
    'property',
    'A temporary Property stay in exchange for the completed service.',
    'medium',
    true,
    'Berlin, Germany',
    'Berlin',
    'DE',
    '[]'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5470000-0000-4000-8000-000000000103',
    'a5470000-0000-4000-8000-000000000002',
    'V1-05.4.7 Incompatible Service',
    'Negative fixture whose preferences reject a Property exchange.',
    'services',
    'used_good',
    'active',
    true,
    'service',
    'approved',
    'technology',
    'software',
    'testing',
    'testing',
    'testing',
    'small',
    array['object']::text[],
    array['object']::text[],
    'electronics',
    'Objects only.',
    'small',
    false,
    'Berlin, Germany',
    'Berlin',
    'DE',
    '[]'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  );

insert into public.properties (
  id,
  item_id,
  owner_id,
  status,
  property_type,
  property_subtype,
  country_code,
  city,
  lat,
  lon,
  bedrooms,
  bathrooms,
  sleeps_max,
  max_guests,
  surface_total_sqm,
  available_from,
  available_until,
  min_stay_days,
  max_stay_days,
  advance_notice_days,
  available_months,
  blocked_dates,
  flexible_dates,
  exchange_type,
  check_in_time,
  check_out_time,
  additional_rules,
  home_insurance_active,
  security_deposit_eur,
  timezone,
  created_at,
  updated_at
) values (
  'a5470000-0000-4000-8000-000000000111',
  'a5470000-0000-4000-8000-000000000101',
  'a5470000-0000-4000-8000-000000000001',
  'active',
  'house',
  'villa',
  'FR',
  'Paris',
  48.8566,
  2.3522,
  2,
  1,
  4,
  4,
  100,
  current_date + 10,
  current_date + 90,
  2,
  14,
  1,
  array[1,2,3,4,5,6,7,8,9,10,11,12],
  '[]'::jsonb,
  true,
  'simultaneous',
  time '15:00',
  time '11:00',
  'No smoking and no parties.',
  true,
  0,
  'UTC',
  clock_timestamp(),
  clock_timestamp()
);

insert into public.services_listings (
  id,
  item_id,
  owner_id,
  status,
  category_l1,
  category_l2,
  category_l3,
  service_name,
  delivery_mode,
  service_area_type,
  service_area_countries,
  service_area_cities,
  service_area_radius_km,
  experience_years,
  skill_level,
  available_days,
  available_from_time,
  available_until_time,
  available_date_from,
  available_date_until,
  blocked_dates,
  max_concurrent_jobs,
  estimated_hours,
  estimated_days,
  scope_description,
  deliverables,
  milestones,
  timezone,
  created_at,
  updated_at
) values
  (
    'a5470000-0000-4000-8000-000000000112',
    'a5470000-0000-4000-8000-000000000102',
    'a5470000-0000-4000-8000-000000000002',
    'active',
    'technology',
    'software',
    'web-development',
    'Cross-domain implementation service',
    'remote',
    'international',
    array['FR','DE']::text[],
    array['Paris','Berlin']::text[],
    null,
    8,
    'expert',
    array['monday','tuesday','wednesday','thursday','friday']::text[],
    time '09:00',
    time '18:00',
    current_date,
    current_date + 90,
    '[]'::jsonb,
    2,
    2,
    0,
    'Deliver two agreed milestones and obtain explicit recipient acceptance.',
    array['Discovery report','Final implementation']::text[],
    jsonb_build_array('Discovery report','Final implementation'),
    'UTC',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5470000-0000-4000-8000-000000000113',
    'a5470000-0000-4000-8000-000000000103',
    'a5470000-0000-4000-8000-000000000002',
    'active',
    'technology',
    'software',
    'testing',
    'Object-only testing service',
    'remote',
    'international',
    array['FR','DE']::text[],
    array['Paris','Berlin']::text[],
    null,
    5,
    'advanced',
    array['monday']::text[],
    time '09:00',
    time '18:00',
    current_date,
    current_date + 90,
    '[]'::jsonb,
    1,
    1,
    0,
    'Negative compatibility fixture.',
    array['Test report']::text[],
    jsonb_build_array('Test report'),
    'UTC',
    clock_timestamp(),
    clock_timestamp()
  );

select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $interest$
declare
  v_interest record;
  v_replay record;
begin
  select *
  into strict v_interest
  from public.express_matching_interest(
    'a5470000-0000-4000-8000-000000000101',
    'a5470000-0000-4000-8000-000000000102',
    91.5,
    'browsing'
  );

  select *
  into strict v_replay
  from public.express_matching_interest(
    'a5470000-0000-4000-8000-000000000101',
    'a5470000-0000-4000-8000-000000000102',
    91.5,
    'browsing'
  );

  perform pg_temp.assert_true(
    v_interest.id = v_replay.id
      and v_interest.status = 'pending'
      and v_replay.status = 'pending',
    'exact interest replay must return the same pending interest'
  );

  insert into pg_temp.v1547_state(key, value) values
    ('interest_id', v_interest.id::text);

  perform pg_temp.expect_error(
    $sql$
      select *
      from public.express_matching_interest(
        'a5470000-0000-4000-8000-000000000101'::uuid,
        'a5470000-0000-4000-8000-000000000103'::uuid,
        50,
        'browsing'
      )
    $sql$,
    '23514',
    'DOMAIN_PAIR_NOT_ALLOWED'
  );
end;
$interest$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_accept$
declare
  v_interest_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'interest_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      'select * from public.accept_matching_interest(%L::uuid)',
      v_interest_id
    ),
    '42501',
    'INTEREST_RECIPIENT_REQUIRED'
  );
end;
$outsider_accept$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000002');
set local role authenticated;

do $accept$
declare
  v_interest_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'interest_id'
  );
  v_accept record;
  v_replay record;
begin
  select *
  into strict v_accept
  from public.accept_matching_interest(v_interest_id);

  select *
  into strict v_replay
  from public.accept_matching_interest(v_interest_id);

  perform pg_temp.assert_true(
    v_accept.match_id = v_replay.match_id
      and v_accept.conversation_id = v_replay.conversation_id
      and v_accept.matching_session_id = v_replay.matching_session_id
      and v_accept.interest_status = 'accepted'
      and v_accept.match_status = 'accepted',
    'accept replay must preserve one Match, Conversation and matching session'
  );

  insert into pg_temp.v1547_state(key, value) values
    ('match_id', v_accept.match_id::text),
    ('conversation_id', v_accept.conversation_id::text);
end;
$accept$;

reset role;

do $matching_counts$
begin
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.matching_interests
      where from_item_id = 'a5470000-0000-4000-8000-000000000101'
        and to_item_id = 'a5470000-0000-4000-8000-000000000102'
    ) = 1,
    'interest replay must not create duplicates'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.matches
      where initiator_item_id = 'a5470000-0000-4000-8000-000000000101'
        and target_item_id = 'a5470000-0000-4000-8000-000000000102'
    ) = 1,
    'accept replay must not create duplicate Matches'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.conversations
      where match_id = (
        select value::uuid from pg_temp.v1547_state where key = 'match_id'
      )
    ) = 1,
    'accept replay must not create duplicate Conversations'
  );
end;
$matching_counts$;

select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $chat_insert$
declare
  v_match_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'match_id'
  );
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
  );
  v_message_id uuid;
begin
  insert into public.messages (
    match_id,
    swap_id,
    sender_id,
    recipient_id,
    conversation_id,
    content,
    message_type,
    metadata
  ) values (
    v_match_id,
    null,
    'a5470000-0000-4000-8000-000000000001',
    'a5470000-0000-4000-8000-000000000002',
    v_conversation_id::text,
    'I offer the agreed Property stay for the completed Service milestones.',
    'text',
    jsonb_build_object('fixture', 'v1_05_4_7_cross_domain_e2e')
  )
  returning id into v_message_id;

  insert into pg_temp.v1547_state(key, value)
  values ('message_id', v_message_id::text);
end;
$chat_insert$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_chat$
declare
  v_match_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'match_id'
  );
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      $sql$
        insert into public.messages (
          match_id, swap_id, sender_id, recipient_id,
          conversation_id, content, message_type
        ) values (
          %L::uuid,
          null,
          'a5470000-0000-4000-8000-000000000003'::uuid,
          'a5470000-0000-4000-8000-000000000002'::uuid,
          %L,
          'Outsider message must be denied.',
          'text'
        )
      $sql$,
      v_match_id,
      v_conversation_id::text
    ),
    '42501',
    'row-level security'
  );

  perform pg_temp.assert_true(
    not exists (
      select 1
      from public.messages
      where id = (
        select value::uuid from pg_temp.v1547_state where key = 'message_id'
      )
    ),
    'outsider must not read the participant message'
  );
end;
$outsider_chat$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000002');
set local role authenticated;

do $participant_chat_read$
begin
  perform pg_temp.assert_true(
    exists (
      select 1
      from public.messages
      where id = (
        select value::uuid from pg_temp.v1547_state where key = 'message_id'
      )
    ),
    'the recipient must read the participant chat message'
  );
end;
$participant_chat_read$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_agreement_access$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      'select public.get_match_agreement_context_v1(%L::uuid)',
      v_conversation_id
    ),
    '42501',
    'Conversation access denied'
  );
end;
$outsider_agreement_access$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $agreement_save$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
  );
  v_payload jsonb;
  v_saved jsonb;
  v_replay jsonb;
  v_hash text;
begin
  v_payload := jsonb_build_object(
    'condition_notes', 'Property and Service listings remain active after completion.',
    'offer_notes', 'Temporary Property stay for the completed two-milestone Service.',
    'logistics_method', 'other',
    'logistics_notes', 'Property handover and Service delivery are tracked by their domain ledgers.',
    'additional_terms', 'Both participants explicitly accept the same frozen domain Agreement.',
    'domain_terms', jsonb_build_array(
      jsonb_build_object(
        'item_id', 'a5470000-0000-4000-8000-000000000101',
        'domain', 'property',
        'terms', jsonb_build_object(
          'period_start', (current_date + 14)::text,
          'period_end', (current_date + 18)::text,
          'timezone', 'UTC',
          'exchange_mode', 'simultaneous',
          'guests', 2,
          'rules', 'No smoking and no parties.',
          'security_deposit_eur', 0,
          'insurance_confirmed', true,
          'check_in_time', '15:00',
          'check_out_time', '11:00',
          'handover_notes', 'Keys are handed over only after the frozen Agreement is confirmed.'
        )
      ),
      jsonb_build_object(
        'item_id', 'a5470000-0000-4000-8000-000000000102',
        'domain', 'service',
        'terms', jsonb_build_object(
          'delivery_mode', 'remote',
          'timezone', 'UTC',
          'deliverables', jsonb_build_array(
            'Discovery report',
            'Final implementation'
          ),
          'duration_hours', 2,
          'duration_days', 0,
          'deadline_at', (clock_timestamp() + interval '30 days')::text,
          'milestones', jsonb_build_array(
            'Discovery report',
            'Final implementation'
          ),
          'acceptance_criteria',
            'Each milestone must match the frozen Agreement and be explicitly accepted.',
          'no_show_terms',
            'A missed deadline may be reported with evidence through canonical dispute authority.',
          'cancellation_terms',
            'Cancellation follows the canonical Exchange lifecycle.',
          'dispute_terms',
            'Unresolved delivery disagreements use canonical dispute authority.'
        )
      )
    )
  );

  v_saved := public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'save',
    0,
    'v1547.agreement.save',
    v_payload
  );

  v_replay := public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'save',
    0,
    'v1547.agreement.save',
    v_payload
  );

  v_hash := v_saved #>> '{agreement,content_hash}';

  perform pg_temp.assert_true(
    (v_saved #>> '{agreement,revision}')::integer = 1
      and v_replay = v_saved
      and v_hash ~ '^[a-f0-9]{64}$',
    'Agreement save must create revision 1 and replay exactly'
  );

  insert into pg_temp.v1547_state(key, value) values
    ('agreement_hash', v_hash);

  perform pg_temp.expect_error(
    format(
      $sql$
        select public.update_match_conversation_agreement_v2(
          %L::uuid,
          'save',
          0,
          'v1547.agreement.stale',
          %L::jsonb
        )
      $sql$,
      v_conversation_id,
      v_payload::text
    ),
    '40001',
    'Agreement revision conflict'
  );

  perform pg_temp.expect_error(
    format(
      $sql$
        select public.update_match_conversation_agreement_v2(
          %L::uuid,
          'save',
          0,
          'v1547.agreement.save',
          '{"condition_notes":"different request"}'::jsonb
        )
      $sql$,
      v_conversation_id
    ),
    '23505',
    'idempotency key'
  );

  perform public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'confirm',
    1,
    'v1547.agreement.confirm.property',
    '{}'::jsonb
  );
end;
$agreement_save$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000002');
set local role authenticated;

do $agreement_confirm_service$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
  );
  v_confirmed jsonb;
  v_replay jsonb;
begin
  v_confirmed := public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'confirm',
    1,
    'v1547.agreement.confirm.service',
    '{}'::jsonb
  );

  v_replay := public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'confirm',
    1,
    'v1547.agreement.confirm.service',
    '{}'::jsonb
  );

  perform pg_temp.assert_true(
    v_confirmed = v_replay
      and jsonb_array_length(v_confirmed #> '{agreement,confirmed_by}') = 2
      and (v_confirmed -> 'completed_stages') ? 'agreement',
    'both participants must confirm the same revision and exact confirmation replay'
  );
end;
$agreement_confirm_service$;

reset role;

do $agreement_receipts$
begin
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.match_agreement_mutation_receipts
      where conversation_id = (
        select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
      )
    ) = 3,
    'Agreement save and two participant confirmations require exactly three receipts'
  );
end;
$agreement_receipts$;

select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $create_exchange$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
  );
  v_created jsonb;
  v_swap_id uuid;
begin
  v_created := public.create_exchange_from_match_agreement(
    v_conversation_id,
    1
  );
  v_swap_id := (v_created ->> 'swap_id')::uuid;

  perform pg_temp.assert_true(
    coalesce((v_created ->> 'created')::boolean, false)
      and v_created ->> 'agreement_hash' = (
        select value from pg_temp.v1547_state where key = 'agreement_hash'
      ),
    'first explicit handoff must create one Exchange from the frozen Agreement'
  );

  insert into pg_temp.v1547_state(key, value)
  values ('swap_id', v_swap_id::text);
end;
$create_exchange$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000002');
set local role authenticated;

do $exchange_replay$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
  );
  v_swap_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'swap_id'
  );
  v_replay jsonb;
begin
  v_replay := public.create_exchange_from_match_agreement(
    v_conversation_id,
    1
  );

  perform pg_temp.assert_true(
    (v_replay ->> 'swap_id')::uuid = v_swap_id
      and coalesce((v_replay ->> 'created')::boolean, true) is false,
    'second participant handoff must return the same Exchange without duplication'
  );
end;
$exchange_replay$;

reset role;

do $domain_ledgers$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'swap_id'
  );
  v_reservation_id uuid;
  v_delivery_id uuid;
begin
  select id
  into strict v_reservation_id
  from public.property_reservations
  where swap_id = v_swap_id;

  select id
  into strict v_delivery_id
  from public.service_deliveries
  where swap_id = v_swap_id;

  perform pg_temp.assert_true(
    (
      select count(*) from public.swaps where id = v_swap_id
    ) = 1
      and (
        select count(*) from public.property_reservations where swap_id = v_swap_id
      ) = 1
      and (
        select count(*) from public.service_deliveries where swap_id = v_swap_id
      ) = 1
      and (
        select count(*)
        from public.service_delivery_milestones
        where delivery_id = v_delivery_id
      ) = 2,
    'Agreement handoff must atomically create one reservation and one two-milestone delivery'
  );

  insert into pg_temp.v1547_state(key, value) values
    ('reservation_id', v_reservation_id::text),
    ('delivery_id', v_delivery_id::text);
end;
$domain_ledgers$;

select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $premature_completion$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'swap_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      'select public.confirm_swap_completion_v1(%L::uuid, %L)',
      v_swap_id,
      'v1547.completion.premature'
    ),
    '23514',
    'Domain completion prerequisites are not satisfied'
  );
end;
$premature_completion$;

reset role;

do $no_partial_confirmation$
begin
  perform pg_temp.assert_true(
    not exists (
      select 1
      from public.swap_completion_confirmations
      where swap_id = (
        select value::uuid from pg_temp.v1547_state where key = 'swap_id'
      )
    ),
    'premature completion denial must leave zero partial confirmations'
  );
end;
$no_partial_confirmation$;

select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000002');
set local role authenticated;

do $service_start$
declare
  v_delivery_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'delivery_id'
  );
  v_started jsonb;
  v_replay jsonb;
begin
  v_started := public.mutate_service_delivery_v1(
    v_delivery_id,
    'start',
    0,
    null,
    '{}'::jsonb,
    'v1547.service.start'
  );

  v_replay := public.mutate_service_delivery_v1(
    v_delivery_id,
    'start',
    0,
    null,
    '{}'::jsonb,
    'v1547.service.start'
  );

  perform pg_temp.assert_true(
    v_started #>> '{delivery,status}' = 'in_progress'
      and (v_started #>> '{delivery,revision}')::bigint = 1
      and coalesce((v_replay ->> 'replayed')::boolean, false)
      and (
        select status
        from public.swaps
        where id = (
          select value::uuid from pg_temp.v1547_state where key = 'swap_id'
        )
      ) = 'in_progress',
    'Service start must advance the Exchange and replay exactly once'
  );
end;
$service_start$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_service_mutation$
declare
  v_delivery_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'delivery_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      $sql$
        select public.mutate_service_delivery_v1(
          %L::uuid,
          'submit_milestone',
          1,
          1,
          '{"note":"Outsider submission","evidence":[]}'::jsonb,
          'v1547.service.outsider'
        )
      $sql$,
      v_delivery_id
    ),
    '42501',
    'mutation denied'
  );
end;
$outsider_service_mutation$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000002');
set local role authenticated;

do $service_submit_one$
declare
  v_delivery_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'delivery_id'
  );
  v_result jsonb;
begin
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'submit_milestone',
    1,
    1,
    jsonb_build_object(
      'note', 'Discovery report delivered for recipient review.',
      'evidence', jsonb_build_array(jsonb_build_object(
        'type', 'note',
        'reference', 'Discovery report attached to the participant conversation.',
        'label', 'Discovery evidence'
      ))
    ),
    'v1547.service.submit.1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'awaiting_acceptance'
      and (v_result #>> '{delivery,revision}')::bigint = 2,
    'first Service milestone must be submitted at revision 2'
  );
end;
$service_submit_one$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $service_accept_one$
declare
  v_delivery_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'delivery_id'
  );
  v_result jsonb;
begin
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'accept_milestone',
    2,
    1,
    jsonb_build_object('note', 'Discovery milestone accepted.'),
    'v1547.service.accept.1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'in_progress'
      and (v_result #>> '{delivery,revision}')::bigint = 3,
    'first accepted milestone must reopen the next milestone at revision 3'
  );
end;
$service_accept_one$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000002');
set local role authenticated;

do $service_submit_two$
declare
  v_delivery_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'delivery_id'
  );
  v_result jsonb;
begin
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'submit_milestone',
    3,
    2,
    jsonb_build_object(
      'note', 'Final implementation delivered according to the frozen Agreement.',
      'evidence', jsonb_build_array(jsonb_build_object(
        'type', 'link',
        'reference', 'https://example.invalid/v1547/final-delivery',
        'label', 'Final implementation'
      ))
    ),
    'v1547.service.submit.2'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'awaiting_acceptance'
      and (v_result #>> '{delivery,revision}')::bigint = 4,
    'second Service milestone must be submitted at revision 4'
  );
end;
$service_submit_two$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $service_accept_two$
declare
  v_delivery_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'delivery_id'
  );
  v_result jsonb;
begin
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'accept_milestone',
    4,
    2,
    jsonb_build_object('note', 'Final implementation accepted.'),
    'v1547.service.accept.2'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'completed'
      and (v_result #>> '{delivery,revision}')::bigint = 5,
    'all accepted Service milestones must complete the delivery at revision 5'
  );
end;
$service_accept_two$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $readiness$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'swap_id'
  );
  v_readiness jsonb;
begin
  v_readiness := public.get_domain_completion_readiness_v1(v_swap_id);

  perform pg_temp.assert_true(
    coalesce((v_readiness ->> 'ready')::boolean, false)
      and coalesce((v_readiness ->> 'domain_aware')::boolean, false)
      and (v_readiness #>> '{expected,property}')::integer = 1
      and (v_readiness #>> '{expected,service}')::integer = 1
      and (v_readiness #>> '{ready_ledgers,property}')::integer = 1
      and (v_readiness #>> '{ready_ledgers,service}')::integer = 1,
    'Property reservation and Service delivery must make the Exchange ready'
  );
end;
$readiness$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_readiness$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'swap_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      'select public.get_domain_completion_readiness_v1(%L::uuid)',
      v_swap_id
    ),
    '42501',
    'access denied'
  );
end;
$outsider_readiness$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000001');
set local role authenticated;

do $completion_first$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'swap_id'
  );
  v_first jsonb;
  v_replay jsonb;
begin
  v_first := public.confirm_swap_completion_v1(
    v_swap_id,
    'v1547.completion.property'
  );

  v_replay := public.confirm_swap_completion_v1(
    v_swap_id,
    'v1547.completion.property'
  );

  perform pg_temp.assert_true(
    coalesce((v_first ->> 'both_confirmed')::boolean, true) is false
      and coalesce((v_first ->> 'replayed')::boolean, true) is false
      and coalesce((v_replay ->> 'replayed')::boolean, false)
      and jsonb_array_length(v_first -> 'confirmed_by') = 1
      and v_replay -> 'confirmed_by' = v_first -> 'confirmed_by',
    'first participant completion must persist once and replay exactly'
  );
end;
$completion_first$;

reset role;
select pg_temp.authenticate_as('a5470000-0000-4000-8000-000000000002');
set local role authenticated;

do $completion_second$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'swap_id'
  );
  v_completed jsonb;
  v_replay jsonb;
begin
  v_completed := public.confirm_swap_completion_v1(
    v_swap_id,
    'v1547.completion.service'
  );

  v_replay := public.confirm_swap_completion_v1(
    v_swap_id,
    'v1547.completion.service'
  );

  perform pg_temp.assert_true(
    coalesce((v_completed ->> 'both_confirmed')::boolean, false)
      and v_completed #>> '{swap,status}' = 'completed'
      and coalesce((v_replay ->> 'replayed')::boolean, false),
    'second participant must complete the same Exchange and replay exactly'
  );
end;
$completion_second$;

reset role;

do $final_assertions$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'swap_id'
  );
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'conversation_id'
  );
  v_delivery_id uuid := (
    select value::uuid from pg_temp.v1547_state where key = 'delivery_id'
  );
begin
  perform pg_temp.assert_true(
    (
      select status from public.swaps where id = v_swap_id
    ) = 'completed',
    'cross-domain Exchange must be completed'
  );
  perform pg_temp.assert_true(
    (
      select status from public.conversations where id = v_conversation_id
    ) = 'completed',
    'linked participant Conversation must be completed'
  );
  perform pg_temp.assert_true(
    (
      select status
      from public.property_reservations
      where swap_id = v_swap_id
    ) = 'completed',
    'Property reservation must be completed'
  );
  perform pg_temp.assert_true(
    (
      select status
      from public.service_deliveries
      where id = v_delivery_id
    ) = 'completed',
    'Service delivery must remain completed'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.items
      where id in (
        'a5470000-0000-4000-8000-000000000101',
        'a5470000-0000-4000-8000-000000000102'
      )
        and status = 'active'
        and is_active = true
    ) = 2,
    'reusable Property and Service listings must remain active'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.swap_completion_confirmations
      where swap_id = v_swap_id
    ) = 2
      and (
        select count(*)
        from public.swap_completion_effects
        where swap_id = v_swap_id
      ) = 1
      and (
        select count(*)
        from public.swap_post_completion_effects
        where swap_id = v_swap_id
      ) = 1,
    'completion must produce two confirmations and one exact-once effect set'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_mutation_receipts
      where delivery_id = v_delivery_id
    ) = 5,
    'Service lifecycle must persist five exact-once command receipts'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.messages
      where match_id = (
        select value::uuid from pg_temp.v1547_state where key = 'match_id'
      )
    ) = 1,
    'cross-domain flow must preserve exactly one participant chat message'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.swaps
      where conversation_id = v_conversation_id
    ) = 1,
    'explicit handoff replay must preserve exactly one Exchange'
  );
end;
$final_assertions$;

rollback;

select jsonb_build_object(
  'contract', 'V1-05.4.7 Cross-domain E2E',
  'flow', 'Property -> Matching -> Chat -> Agreement -> Service -> Exchange -> Completion',
  'authenticated_replay', 'PASS',
  'interest_replay', 'PASS',
  'match_conversation_replay', 'PASS',
  'chat_participant_only', 'PASS',
  'agreement_revision_hash_replay', 'PASS',
  'exchange_handoff_replay', 'PASS',
  'property_reservation', 'PASS',
  'service_delivery', 'PASS',
  'domain_completion', 'PASS',
  'outsider_denied', 'PASS',
  'premature_completion_denied', 'PASS',
  'reusable_listings_preserved', 'PASS',
  'rollback', true
) as result;
