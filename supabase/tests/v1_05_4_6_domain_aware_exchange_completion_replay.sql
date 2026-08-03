begin;

set local statement_timeout = '180s';
set local lock_timeout = '10s';

create or replace function pg_temp.assert_true(
  p_condition boolean,
  p_message text
)
returns void
language plpgsql
as $function$
begin
  if coalesce(p_condition, false) is not true then
    raise exception 'V1-05.4.6 replay assertion failed: %', p_message;
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
          'V1-05.4.6 expected SQLSTATE %, received %: %',
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
          'V1-05.4.6 expected error containing "%", received: %',
          p_message_fragment,
          sqlerrm;
      end if;

      return;
  end;

  raise exception
    'V1-05.4.6 expected SQLSTATE %, but the statement succeeded.',
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
    'a5460000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'v1546-requester@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5460000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'v1546-responder@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5460000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'v1546-outsider@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  );

insert into public.profiles (
  user_id,
  username,
  role,
  created_at,
  updated_at
) values
  ('a5460000-0000-4000-8000-000000000001', 'v1546_requester', 'user', clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000002', 'v1546_responder', 'user', clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000003', 'v1546_outsider', 'user', clock_timestamp(), clock_timestamp());

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
  locked_by,
  locked_until,
  lock_reason,
  created_at,
  updated_at
) values
  ('a5460000-0000-4000-8000-000000000101', 'a5460000-0000-4000-8000-000000000001', 'Object A', 'Object completion fixture', 'fixture', 'used', 'active', true, 'object', 'approved', 'a5460000-0000-4000-8000-000000000002', clock_timestamp() + interval '1 day', 'exchange', clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000102', 'a5460000-0000-4000-8000-000000000002', 'Object B', 'Object completion fixture', 'fixture', 'used', 'active', true, 'object', 'approved', 'a5460000-0000-4000-8000-000000000001', clock_timestamp() + interval '1 day', 'exchange', clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000103', 'a5460000-0000-4000-8000-000000000001', 'Property A', 'Property completion fixture', 'fixture', 'used', 'active', true, 'property', 'approved', 'a5460000-0000-4000-8000-000000000002', clock_timestamp() + interval '1 day', 'exchange', clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000104', 'a5460000-0000-4000-8000-000000000002', 'Service B', 'Service completion fixture', 'fixture', 'used', 'active', true, 'service', 'approved', 'a5460000-0000-4000-8000-000000000001', clock_timestamp() + interval '1 day', 'exchange', clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000105', 'a5460000-0000-4000-8000-000000000001', 'Event A', 'Event completion fixture', 'fixture', 'used', 'active', true, 'event', 'approved', 'a5460000-0000-4000-8000-000000000002', clock_timestamp() + interval '1 day', 'exchange', clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000106', 'a5460000-0000-4000-8000-000000000002', 'Object C', 'Cross-domain object fixture', 'fixture', 'used', 'active', true, 'object', 'approved', 'a5460000-0000-4000-8000-000000000001', clock_timestamp() + interval '1 day', 'exchange', clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000107', 'a5460000-0000-4000-8000-000000000001', 'Missing Property', 'Missing ledger fixture', 'fixture', 'used', 'active', true, 'property', 'approved', null, null, null, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000108', 'a5460000-0000-4000-8000-000000000002', 'Object D', 'Missing ledger counterpart', 'fixture', 'used', 'active', true, 'object', 'approved', null, null, null, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000109', 'a5460000-0000-4000-8000-000000000001', 'Pending Service', 'Incomplete delivery fixture', 'fixture', 'used', 'active', true, 'service', 'approved', null, null, null, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000110', 'a5460000-0000-4000-8000-000000000002', 'Object E', 'Incomplete delivery counterpart', 'fixture', 'used', 'active', true, 'object', 'approved', null, null, null, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000111', 'a5460000-0000-4000-8000-000000000001', 'Pending Event', 'Unconfirmed transfer fixture', 'fixture', 'used', 'active', true, 'event', 'approved', null, null, null, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000112', 'a5460000-0000-4000-8000-000000000002', 'Object F', 'Unconfirmed transfer counterpart', 'fixture', 'used', 'active', true, 'object', 'approved', null, null, null, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000113', 'a5460000-0000-4000-8000-000000000001', 'Legacy Property', 'Legacy Exchange fixture', 'fixture', 'used', 'active', true, 'property', 'approved', null, null, null, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000114', 'a5460000-0000-4000-8000-000000000002', 'Object G', 'Legacy Exchange counterpart', 'fixture', 'used', 'active', true, 'object', 'approved', null, null, null, clock_timestamp(), clock_timestamp());

insert into public.properties (
  id,
  item_id,
  owner_id,
  status,
  available_from,
  available_until,
  min_stay_days,
  max_stay_days,
  advance_notice_days,
  available_months,
  blocked_dates,
  created_at,
  updated_at
) values
  ('a5460000-0000-4000-8000-000000000201', 'a5460000-0000-4000-8000-000000000103', 'a5460000-0000-4000-8000-000000000001', 'active', current_date + 10, current_date + 200, 1, 30, 0, '{}'::integer[], '[]'::jsonb, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000202', 'a5460000-0000-4000-8000-000000000107', 'a5460000-0000-4000-8000-000000000001', 'active', current_date + 10, current_date + 200, 1, 30, 0, '{}'::integer[], '[]'::jsonb, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000203', 'a5460000-0000-4000-8000-000000000113', 'a5460000-0000-4000-8000-000000000001', 'active', current_date + 10, current_date + 200, 1, 30, 0, '{}'::integer[], '[]'::jsonb, clock_timestamp(), clock_timestamp());

insert into public.services_listings (
  id,
  item_id,
  owner_id,
  status,
  max_concurrent_jobs,
  created_at,
  updated_at
) values
  ('a5460000-0000-4000-8000-000000000211', 'a5460000-0000-4000-8000-000000000104', 'a5460000-0000-4000-8000-000000000002', 'active', 2, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000212', 'a5460000-0000-4000-8000-000000000109', 'a5460000-0000-4000-8000-000000000001', 'active', 2, clock_timestamp(), clock_timestamp());

insert into public.events_listings (
  id,
  item_id,
  owner_id,
  status,
  start_date,
  timezone,
  capacity_total,
  capacity_available,
  is_transferable,
  transfer_rule_confirmed,
  transfer_rule_source,
  transfer_deadline_at,
  includes_accommodation,
  includes_transport,
  created_at,
  updated_at
) values
  ('a5460000-0000-4000-8000-000000000221', 'a5460000-0000-4000-8000-000000000105', 'a5460000-0000-4000-8000-000000000001', 'active', current_date + 30, 'UTC', 2, 1, true, true, 'Fixture issuer rules', clock_timestamp() + interval '20 days', false, false, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000222', 'a5460000-0000-4000-8000-000000000111', 'a5460000-0000-4000-8000-000000000001', 'active', current_date + 30, 'UTC', 2, 1, true, true, 'Fixture issuer rules', clock_timestamp() + interval '20 days', false, false, clock_timestamp(), clock_timestamp());

insert into public.conversations (
  id,
  participant_ids,
  item_ids,
  status,
  agenda_state,
  created_at,
  updated_at
) values
  ('a5460000-0000-4000-8000-000000000301', array['a5460000-0000-4000-8000-000000000001'::uuid, 'a5460000-0000-4000-8000-000000000002'::uuid], array['a5460000-0000-4000-8000-000000000101'::uuid, 'a5460000-0000-4000-8000-000000000102'::uuid], 'agreed', '{}'::jsonb, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000302', array['a5460000-0000-4000-8000-000000000001'::uuid, 'a5460000-0000-4000-8000-000000000002'::uuid], array['a5460000-0000-4000-8000-000000000103'::uuid, 'a5460000-0000-4000-8000-000000000104'::uuid], 'agreed', '{}'::jsonb, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000303', array['a5460000-0000-4000-8000-000000000001'::uuid, 'a5460000-0000-4000-8000-000000000002'::uuid], array['a5460000-0000-4000-8000-000000000105'::uuid, 'a5460000-0000-4000-8000-000000000106'::uuid], 'agreed', '{}'::jsonb, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000304', array['a5460000-0000-4000-8000-000000000001'::uuid, 'a5460000-0000-4000-8000-000000000002'::uuid], array['a5460000-0000-4000-8000-000000000107'::uuid, 'a5460000-0000-4000-8000-000000000108'::uuid], 'agreed', '{}'::jsonb, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000305', array['a5460000-0000-4000-8000-000000000001'::uuid, 'a5460000-0000-4000-8000-000000000002'::uuid], array['a5460000-0000-4000-8000-000000000109'::uuid, 'a5460000-0000-4000-8000-000000000110'::uuid], 'agreed', '{}'::jsonb, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000306', array['a5460000-0000-4000-8000-000000000001'::uuid, 'a5460000-0000-4000-8000-000000000002'::uuid], array['a5460000-0000-4000-8000-000000000111'::uuid, 'a5460000-0000-4000-8000-000000000112'::uuid], 'agreed', '{}'::jsonb, clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000307', array['a5460000-0000-4000-8000-000000000001'::uuid, 'a5460000-0000-4000-8000-000000000002'::uuid], array['a5460000-0000-4000-8000-000000000113'::uuid, 'a5460000-0000-4000-8000-000000000114'::uuid], 'agreed', '{}'::jsonb, clock_timestamp(), clock_timestamp());

insert into public.swaps (
  id,
  requester_id,
  responder_id,
  status,
  conversation_id,
  offered_item_id,
  requested_item_id,
  exchange_kind,
  swap_metadata,
  agreement_revision,
  exchange_data,
  requester_confirmed,
  responder_confirmed,
  confirmed_by,
  created_at,
  updated_at
) values
  ('a5460000-0000-4000-8000-000000000401', 'a5460000-0000-4000-8000-000000000001', 'a5460000-0000-4000-8000-000000000002', 'in_progress', 'a5460000-0000-4000-8000-000000000301', 'a5460000-0000-4000-8000-000000000101', 'a5460000-0000-4000-8000-000000000102', 'bilateral', '{}'::jsonb, 1, jsonb_build_object('domain_terms', '[]'::jsonb), false, false, '{}'::uuid[], clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000402', 'a5460000-0000-4000-8000-000000000001', 'a5460000-0000-4000-8000-000000000002', 'in_progress', 'a5460000-0000-4000-8000-000000000302', 'a5460000-0000-4000-8000-000000000103', 'a5460000-0000-4000-8000-000000000104', 'bilateral', jsonb_build_object('source', 'domain_aware_match_agreement', 'agreement_hash', repeat('a', 64)), 1, jsonb_build_object('domain_terms', jsonb_build_array(jsonb_build_object('item_id', 'a5460000-0000-4000-8000-000000000103', 'domain', 'property', 'terms', '{}'::jsonb), jsonb_build_object('item_id', 'a5460000-0000-4000-8000-000000000104', 'domain', 'service', 'terms', '{}'::jsonb))), false, false, '{}'::uuid[], clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000403', 'a5460000-0000-4000-8000-000000000001', 'a5460000-0000-4000-8000-000000000002', 'in_progress', 'a5460000-0000-4000-8000-000000000303', 'a5460000-0000-4000-8000-000000000105', 'a5460000-0000-4000-8000-000000000106', 'bilateral', jsonb_build_object('source', 'domain_aware_match_agreement', 'agreement_hash', repeat('b', 64)), 1, jsonb_build_object('domain_terms', jsonb_build_array(jsonb_build_object('item_id', 'a5460000-0000-4000-8000-000000000105', 'domain', 'event', 'terms', '{}'::jsonb))), false, false, '{}'::uuid[], clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000404', 'a5460000-0000-4000-8000-000000000001', 'a5460000-0000-4000-8000-000000000002', 'in_progress', 'a5460000-0000-4000-8000-000000000304', 'a5460000-0000-4000-8000-000000000107', 'a5460000-0000-4000-8000-000000000108', 'bilateral', jsonb_build_object('source', 'domain_aware_match_agreement', 'agreement_hash', repeat('c', 64)), 1, jsonb_build_object('domain_terms', jsonb_build_array(jsonb_build_object('item_id', 'a5460000-0000-4000-8000-000000000107', 'domain', 'property', 'terms', '{}'::jsonb))), false, false, '{}'::uuid[], clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000405', 'a5460000-0000-4000-8000-000000000001', 'a5460000-0000-4000-8000-000000000002', 'in_progress', 'a5460000-0000-4000-8000-000000000305', 'a5460000-0000-4000-8000-000000000109', 'a5460000-0000-4000-8000-000000000110', 'bilateral', jsonb_build_object('source', 'domain_aware_match_agreement', 'agreement_hash', repeat('d', 64)), 1, jsonb_build_object('domain_terms', jsonb_build_array(jsonb_build_object('item_id', 'a5460000-0000-4000-8000-000000000109', 'domain', 'service', 'terms', '{}'::jsonb))), false, false, '{}'::uuid[], clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000406', 'a5460000-0000-4000-8000-000000000001', 'a5460000-0000-4000-8000-000000000002', 'in_progress', 'a5460000-0000-4000-8000-000000000306', 'a5460000-0000-4000-8000-000000000111', 'a5460000-0000-4000-8000-000000000112', 'bilateral', jsonb_build_object('source', 'domain_aware_match_agreement', 'agreement_hash', repeat('e', 64)), 1, jsonb_build_object('domain_terms', jsonb_build_array(jsonb_build_object('item_id', 'a5460000-0000-4000-8000-000000000111', 'domain', 'event', 'terms', '{}'::jsonb))), false, false, '{}'::uuid[], clock_timestamp(), clock_timestamp()),
  ('a5460000-0000-4000-8000-000000000407', 'a5460000-0000-4000-8000-000000000001', 'a5460000-0000-4000-8000-000000000002', 'in_progress', 'a5460000-0000-4000-8000-000000000307', 'a5460000-0000-4000-8000-000000000113', 'a5460000-0000-4000-8000-000000000114', 'bilateral', '{}'::jsonb, 1, '{}'::jsonb, false, false, '{}'::uuid[], clock_timestamp(), clock_timestamp());

update public.conversations conversation_row
set swap_id = mapping.swap_id
from (
  values
    ('a5460000-0000-4000-8000-000000000301'::uuid, 'a5460000-0000-4000-8000-000000000401'::uuid),
    ('a5460000-0000-4000-8000-000000000302'::uuid, 'a5460000-0000-4000-8000-000000000402'::uuid),
    ('a5460000-0000-4000-8000-000000000303'::uuid, 'a5460000-0000-4000-8000-000000000403'::uuid),
    ('a5460000-0000-4000-8000-000000000304'::uuid, 'a5460000-0000-4000-8000-000000000404'::uuid),
    ('a5460000-0000-4000-8000-000000000305'::uuid, 'a5460000-0000-4000-8000-000000000405'::uuid),
    ('a5460000-0000-4000-8000-000000000306'::uuid, 'a5460000-0000-4000-8000-000000000406'::uuid),
    ('a5460000-0000-4000-8000-000000000307'::uuid, 'a5460000-0000-4000-8000-000000000407'::uuid)
) as mapping(conversation_id, swap_id)
where conversation_row.id = mapping.conversation_id;

set local session_replication_role = origin;

insert into public.property_reservations (
  id,
  property_item_id,
  swap_id,
  conversation_id,
  agreement_revision,
  agreement_hash,
  reserved_from,
  reserved_until,
  status,
  created_by,
  created_at,
  updated_at
) values (
  'a5460000-0000-4000-8000-000000000501',
  'a5460000-0000-4000-8000-000000000103',
  'a5460000-0000-4000-8000-000000000402',
  'a5460000-0000-4000-8000-000000000302',
  1,
  repeat('a', 64),
  current_date + 30,
  current_date + 35,
  'reserved',
  'a5460000-0000-4000-8000-000000000001',
  clock_timestamp(),
  clock_timestamp()
);

insert into public.service_deliveries (
  id,
  service_item_id,
  swap_id,
  conversation_id,
  provider_id,
  recipient_id,
  agreement_revision,
  agreement_hash,
  delivery_mode,
  timezone,
  deliverables,
  duration_hours,
  duration_days,
  deadline_at,
  acceptance_criteria,
  no_show_terms,
  cancellation_terms,
  dispute_terms,
  status,
  revision,
  completed_at,
  created_at,
  updated_at
) values
  (
    'a5460000-0000-4000-8000-000000000502',
    'a5460000-0000-4000-8000-000000000104',
    'a5460000-0000-4000-8000-000000000402',
    'a5460000-0000-4000-8000-000000000302',
    'a5460000-0000-4000-8000-000000000002',
    'a5460000-0000-4000-8000-000000000001',
    1,
    repeat('a', 64),
    'remote',
    'UTC',
    '["Completed fixture delivery"]'::jsonb,
    1,
    0,
    clock_timestamp() + interval '7 days',
    'Recipient accepted the completed fixture.',
    'No-show terms.',
    'Cancellation terms.',
    'Dispute terms.',
    'completed',
    1,
    clock_timestamp(),
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000504',
    'a5460000-0000-4000-8000-000000000109',
    'a5460000-0000-4000-8000-000000000405',
    'a5460000-0000-4000-8000-000000000305',
    'a5460000-0000-4000-8000-000000000001',
    'a5460000-0000-4000-8000-000000000002',
    1,
    repeat('d', 64),
    'remote',
    'UTC',
    '["Pending fixture delivery"]'::jsonb,
    1,
    0,
    clock_timestamp() + interval '7 days',
    'Recipient must accept the fixture.',
    'No-show terms.',
    'Cancellation terms.',
    'Dispute terms.',
    'pending',
    0,
    null,
    clock_timestamp(),
    clock_timestamp()
  );

insert into public.event_transfers (
  id,
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
  transfer_notes,
  status,
  revision,
  proof_revision,
  submitted_at,
  confirmed_at,
  created_at,
  updated_at
) values
  (
    'a5460000-0000-4000-8000-000000000503',
    'a5460000-0000-4000-8000-000000000105',
    'a5460000-0000-4000-8000-000000000403',
    'a5460000-0000-4000-8000-000000000303',
    'a5460000-0000-4000-8000-000000000001',
    'a5460000-0000-4000-8000-000000000002',
    1,
    repeat('b', 64),
    1,
    'Fixture issuer rules',
    clock_timestamp() + interval '20 days',
    '{"ticket":true,"accommodation":false,"transport":false}'::jsonb,
    true,
    'Confirmed fixture transfer.',
    'confirmed',
    2,
    1,
    clock_timestamp(),
    clock_timestamp(),
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000505',
    'a5460000-0000-4000-8000-000000000111',
    'a5460000-0000-4000-8000-000000000406',
    'a5460000-0000-4000-8000-000000000306',
    'a5460000-0000-4000-8000-000000000001',
    'a5460000-0000-4000-8000-000000000002',
    1,
    repeat('e', 64),
    1,
    'Fixture issuer rules',
    clock_timestamp() + interval '20 days',
    '{"ticket":true,"accommodation":false,"transport":false}'::jsonb,
    true,
    'Pending fixture transfer.',
    'pending',
    0,
    0,
    null,
    null,
    clock_timestamp(),
    clock_timestamp()
  );

select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000001');
set local role authenticated;

do $ready_cross_domain$
declare
  v_readiness jsonb;
begin
  v_readiness := public.get_domain_completion_readiness_v1(
    'a5460000-0000-4000-8000-000000000402'
  );

  perform pg_temp.assert_true(
    (v_readiness ->> 'ready')::boolean,
    'Property ↔ Service readiness must be true.'
  );
  perform pg_temp.assert_true(
    (v_readiness #>> '{expected,property}')::integer = 1
      and (v_readiness #>> '{expected,service}')::integer = 1
      and (v_readiness #>> '{ready_ledgers,property}')::integer = 1
      and (v_readiness #>> '{ready_ledgers,service}')::integer = 1,
    'Property ↔ Service expected and ready ledger counts must match.'
  );
end;
$ready_cross_domain$;

reset role;
select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000003');
set local role authenticated;

select pg_temp.expect_error(
  $$select public.get_domain_completion_readiness_v1('a5460000-0000-4000-8000-000000000402')$$,
  '42501',
  'access denied'
);
select pg_temp.expect_error(
  $$select public.confirm_swap_completion_v1('a5460000-0000-4000-8000-000000000402', 'v1546.outsider')$$,
  '42501',
  'not a swap participant'
);

reset role;
select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000001');
set local role authenticated;

select pg_temp.expect_error(
  $$select public.confirm_swap_completion_v1('a5460000-0000-4000-8000-000000000404', 'v1546.missing.property')$$,
  '23514',
  'Domain completion prerequisites'
);
select pg_temp.expect_error(
  $$select public.confirm_swap_completion_v1('a5460000-0000-4000-8000-000000000405', 'v1546.pending.service')$$,
  '23514',
  'Domain completion prerequisites'
);
select pg_temp.expect_error(
  $$select public.confirm_swap_completion_v1('a5460000-0000-4000-8000-000000000406', 'v1546.pending.event')$$,
  '23514',
  'Domain completion prerequisites'
);
select pg_temp.expect_error(
  $$select public.confirm_swap_completion_v1('a5460000-0000-4000-8000-000000000407', 'v1546.legacy.property')$$,
  '23514',
  'Domain completion prerequisites'
);

reset role;

do $premature_zero_side_effects$
begin
  perform pg_temp.assert_true(
    not exists (
      select 1
      from public.swap_completion_confirmations confirmation_row
      where confirmation_row.swap_id in (
        'a5460000-0000-4000-8000-000000000404',
        'a5460000-0000-4000-8000-000000000405',
        'a5460000-0000-4000-8000-000000000406',
        'a5460000-0000-4000-8000-000000000407'
      )
    ),
    'Rejected domain confirmations must leave zero confirmation rows.'
  );
  perform pg_temp.assert_true(
    not exists (
      select 1
      from public.swaps swap_row
      where swap_row.id in (
        'a5460000-0000-4000-8000-000000000404',
        'a5460000-0000-4000-8000-000000000405',
        'a5460000-0000-4000-8000-000000000406',
        'a5460000-0000-4000-8000-000000000407'
      )
        and (swap_row.requester_confirmed or swap_row.responder_confirmed)
    ),
    'Rejected domain confirmations must not mutate participant flags.'
  );
end;
$premature_zero_side_effects$;

select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000001');
set local role authenticated;

do $cross_first_confirmation$
declare
  v_result jsonb;
begin
  v_result := public.confirm_swap_completion_v1(
    'a5460000-0000-4000-8000-000000000402',
    'v1546.cross.requester'
  );
  perform pg_temp.assert_true(
    coalesce((v_result ->> 'both_confirmed')::boolean, false) is false
      and coalesce((v_result ->> 'replayed')::boolean, false) is false,
    'First cross-domain confirmation must persist without completion.'
  );

  v_result := public.confirm_swap_completion_v1(
    'a5460000-0000-4000-8000-000000000402',
    'v1546.cross.requester'
  );
  perform pg_temp.assert_true(
    (v_result ->> 'replayed')::boolean,
    'Exact cross-domain confirmation replay must be idempotent.'
  );
end;
$cross_first_confirmation$;

reset role;
select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000002');
set local role authenticated;

do $cross_second_confirmation$
declare
  v_result jsonb;
begin
  v_result := public.confirm_swap_completion_v1(
    'a5460000-0000-4000-8000-000000000402',
    'v1546.cross.responder'
  );
  perform pg_temp.assert_true(
    (v_result ->> 'both_confirmed')::boolean
      and (v_result #>> '{swap,status}') = 'completed'
      and (v_result ->> 'effects_applied')::boolean,
    'Second cross-domain confirmation must complete exactly once.'
  );
end;
$cross_second_confirmation$;

reset role;

do $cross_effects$
begin
  perform pg_temp.assert_true(
    exists (
      select 1
      from public.property_reservations reservation_row
      where reservation_row.swap_id = 'a5460000-0000-4000-8000-000000000402'
        and reservation_row.status = 'completed'
    ),
    'Property reservation must become completed with its Exchange.'
  );
  perform pg_temp.assert_true(
    exists (
      select 1
      from public.service_deliveries delivery_row
      where delivery_row.swap_id = 'a5460000-0000-4000-8000-000000000402'
        and delivery_row.status = 'completed'
    ),
    'Accepted Service delivery must remain completed.'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.items item_row
      where item_row.id in (
        'a5460000-0000-4000-8000-000000000103',
        'a5460000-0000-4000-8000-000000000104'
      )
        and item_row.status = 'active'
        and item_row.is_active
        and item_row.locked_by is null
        and item_row.locked_until is null
        and item_row.lock_reason is null
    ) = 2,
    'Property and Service listings must remain reusable after completion.'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.swap_completion_effects effect_row
      where effect_row.swap_id = 'a5460000-0000-4000-8000-000000000402'
    ) = 1
      and (
        select count(*)
        from public.swap_post_completion_effects effect_row
        where effect_row.swap_id = 'a5460000-0000-4000-8000-000000000402'
      ) = 1,
    'Cross-domain structural and post-completion effects must be exact-once.'
  );
  perform pg_temp.assert_true(
    exists (
      select 1
      from public.swap_events event_row
      where event_row.swap_id = 'a5460000-0000-4000-8000-000000000402'
        and event_row.action = 'completion_effects_applied'
        and event_row.metadata ->> 'scope' = 'domain_aware_structural_effects'
        and (event_row.metadata ->> 'object_items_consumed')::integer = 0
        and (event_row.metadata ->> 'reusable_domain_items_preserved')::integer = 2
    ),
    'Cross-domain completion evidence must record reusable assets.'
  );
end;
$cross_effects$;

select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000001');
set local role authenticated;
select public.confirm_swap_completion_v1(
  'a5460000-0000-4000-8000-000000000401',
  'v1546.objects.requester'
);
reset role;
select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000002');
set local role authenticated;
select public.confirm_swap_completion_v1(
  'a5460000-0000-4000-8000-000000000401',
  'v1546.objects.responder'
);
reset role;

do $object_effects$
begin
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.items item_row
      where item_row.id in (
        'a5460000-0000-4000-8000-000000000101',
        'a5460000-0000-4000-8000-000000000102'
      )
        and item_row.status = 'traded'
        and item_row.is_active is false
    ) = 2,
    'Object-only Exchange must continue consuming both Objects.'
  );
end;
$object_effects$;

select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000001');
set local role authenticated;
select public.confirm_swap_completion_v1(
  'a5460000-0000-4000-8000-000000000403',
  'v1546.event.requester'
);
reset role;
select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000002');
set local role authenticated;
select public.confirm_swap_completion_v1(
  'a5460000-0000-4000-8000-000000000403',
  'v1546.event.responder'
);
reset role;

do $event_effects$
begin
  perform pg_temp.assert_true(
    exists (
      select 1
      from public.items item_row
      where item_row.id = 'a5460000-0000-4000-8000-000000000105'
        and item_row.status = 'active'
        and item_row.is_active
    ),
    'Event listing must remain active after one confirmed transfer.'
  );
  perform pg_temp.assert_true(
    exists (
      select 1
      from public.items item_row
      where item_row.id = 'a5460000-0000-4000-8000-000000000106'
        and item_row.status = 'traded'
        and item_row.is_active is false
    ),
    'Object counterpart must be consumed in Event ↔ Object completion.'
  );
  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings listing_row
      where listing_row.item_id = 'a5460000-0000-4000-8000-000000000105'
    ) = 1,
    'Completion must not overwrite Event capacity authority.'
  );
end;
$event_effects$;

select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000002');
set local role authenticated;

do $completed_replay$
declare
  v_result jsonb;
  v_readiness jsonb;
begin
  v_result := public.confirm_swap_completion_v1(
    'a5460000-0000-4000-8000-000000000402',
    'v1546.cross.responder'
  );
  perform pg_temp.assert_true(
    (v_result ->> 'replayed')::boolean
      and (v_result #>> '{swap,status}') = 'completed',
    'Completed Exchange replay must return the existing completed state.'
  );

  v_readiness := public.get_domain_completion_readiness_v1(
    'a5460000-0000-4000-8000-000000000402'
  );
  perform pg_temp.assert_true(
    (v_readiness ->> 'ready')::boolean
      and (v_readiness #>> '{ready_ledgers,property}')::integer = 1,
    'Readiness must accept completed Property reservation state post-transition.'
  );
end;
$completed_replay$;

reset role;

select jsonb_build_object(
  'contract', 'V1-05.4.6 Domain-aware Exchange Completion',
  'authenticated_replay', 'PASS',
  'completed_exchanges', (
    select count(*)
    from public.swaps
    where id in (
      'a5460000-0000-4000-8000-000000000401',
      'a5460000-0000-4000-8000-000000000402',
      'a5460000-0000-4000-8000-000000000403'
    )
      and status = 'completed'
  ),
  'rejected_incomplete_exchanges', 4,
  'completion_effects', (
    select count(*) from public.swap_completion_effects
    where swap_id::text like 'a5460000-%'
  ),
  'post_completion_effects', (
    select count(*) from public.swap_post_completion_effects
    where swap_id::text like 'a5460000-%'
  ),
  'object_items_consumed', (
    select count(*) from public.items
    where id::text like 'a5460000-%'
      and item_type = 'object'
      and status = 'traded'
      and is_active is false
  ),
  'reusable_domain_items_preserved', (
    select count(*) from public.items
    where id::text like 'a5460000-%'
      and item_type in ('property', 'service', 'event')
      and status = 'active'
      and is_active
  ),
  'rollback', true
) as result;

rollback;
