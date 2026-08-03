begin;

set local statement_timeout = '240s';
set local lock_timeout = '10s';

create temporary table pg_temp.v156_state (
  key text primary key,
  value text not null
) on commit drop;

grant select, insert, update, delete
  on table pg_temp.v156_state
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
    raise exception 'V1-05.6 replay assertion failed: %', p_message;
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
          'V1-05.6 expected SQLSTATE %, received %: %',
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
          'V1-05.6 expected error containing "%", received: %',
          p_message_fragment,
          sqlerrm;
      end if;

      return;
  end;

  raise exception
    'V1-05.6 expected SQLSTATE %, but the statement succeeded.',
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
    'a5060000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'v156-event-owner@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5060000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'v156-object-owner@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5060000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'v156-outsider@example.invalid',
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
    'a5060000-0000-4000-8000-000000000001',
    'v156_event_owner',
    'user',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5060000-0000-4000-8000-000000000002',
    'v156_object_owner',
    'user',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5060000-0000-4000-8000-000000000003',
    'v156_outsider',
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
    'a5060000-0000-4000-8000-000000000101',
    'a5060000-0000-4000-8000-000000000001',
    'V1-05.6 Transferable Event',
    'A deterministic transferable Event listing for the cumulative domain replay.',
    'events',
    'used_good',
    'active',
    true,
    'event',
    'approved',
    'events',
    'tickets',
    'concert',
    'concert-ticket',
    'concert-ticket',
    'medium',
    array['object']::text[],
    array['object']::text[],
    'electronics',
    'A useful electronics Object in exchange for the transferable Event bundle.',
    'medium',
    true,
    'Vienna, Austria',
    'Vienna',
    'AT',
    '[]'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5060000-0000-4000-8000-000000000102',
    'a5060000-0000-4000-8000-000000000002',
    'V1-05.6 Offered Object',
    'A deterministic Object offered for the transferable Event bundle.',
    'electronics',
    'used_good',
    'active',
    true,
    'object',
    'approved',
    'electronics',
    'audio',
    'headphones',
    'headphones',
    'headphones',
    'medium',
    array['event']::text[],
    array['event']::text[],
    'events',
    'A transferable Event ticket with optional accommodation and transport.',
    'medium',
    true,
    'Prague, Czechia',
    'Prague',
    'CZ',
    '[]'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5060000-0000-4000-8000-000000000103',
    'a5060000-0000-4000-8000-000000000002',
    'V1-05.6 Incompatible Object',
    'Negative fixture whose preferences reject Event exchanges.',
    'electronics',
    'used_good',
    'active',
    true,
    'object',
    'approved',
    'electronics',
    'computers',
    'testing',
    'testing',
    'testing',
    'small',
    array['service']::text[],
    array['service']::text[],
    'services',
    'Services only.',
    'small',
    false,
    'Prague, Czechia',
    'Prague',
    'CZ',
    '[]'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  );

insert into public.events_listings (
  id,
  item_id,
  owner_id,
  status,
  event_group,
  event_category,
  event_subcategory,
  start_date,
  end_date,
  start_time,
  end_time,
  timezone,
  location_type,
  country_code,
  city,
  venue_name,
  venue_section,
  capacity_total,
  capacity_available,
  is_transferable,
  transfer_rule_confirmed,
  transfer_rule_source,
  transfer_deadline_at,
  includes_accommodation,
  includes_transport,
  includes_meals,
  created_at,
  updated_at
) values (
  'a5060000-0000-4000-8000-000000000111',
  'a5060000-0000-4000-8000-000000000101',
  'a5060000-0000-4000-8000-000000000001',
  'active',
  'Tickets & Access',
  'Concerts & Festivals',
  'Concert Ticket',
  current_date + 60,
  current_date + 60,
  time '19:00',
  time '22:00',
  'UTC',
  'indoor',
  'AT',
  'Vienna',
  'Public Arena',
  'General admission',
  2,
  2,
  true,
  true,
  'https://issuer.example.invalid/v1-05-6-transfer-policy',
  clock_timestamp() + interval '30 days',
  true,
  true,
  false,
  clock_timestamp(),
  clock_timestamp()
);

select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000001');
set local role authenticated;

do $interest$
declare
  v_interest record;
  v_replay record;
begin
  select *
  into strict v_interest
  from public.express_matching_interest(
    'a5060000-0000-4000-8000-000000000101',
    'a5060000-0000-4000-8000-000000000102',
    93.5,
    'browsing'
  );

  select *
  into strict v_replay
  from public.express_matching_interest(
    'a5060000-0000-4000-8000-000000000101',
    'a5060000-0000-4000-8000-000000000102',
    93.5,
    'browsing'
  );

  perform pg_temp.assert_true(
    v_interest.id = v_replay.id
      and v_interest.status = 'pending'
      and v_replay.status = 'pending',
    'exact Event-to-Object interest replay must preserve one pending interest'
  );

  insert into pg_temp.v156_state(key, value)
  values ('interest_id', v_interest.id::text);

  perform pg_temp.expect_error(
    $sql$
      select *
      from public.express_matching_interest(
        'a5060000-0000-4000-8000-000000000101'::uuid,
        'a5060000-0000-4000-8000-000000000103'::uuid,
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
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_accept$
declare
  v_interest_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'interest_id'
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
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000002');
set local role authenticated;

do $accept$
declare
  v_interest_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'interest_id'
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

  insert into pg_temp.v156_state(key, value) values
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
      where from_item_id = 'a5060000-0000-4000-8000-000000000101'
        and to_item_id = 'a5060000-0000-4000-8000-000000000102'
    ) = 1,
    'interest replay must not create duplicate matching interests'
  );

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.matches
      where initiator_item_id = 'a5060000-0000-4000-8000-000000000101'
        and target_item_id = 'a5060000-0000-4000-8000-000000000102'
    ) = 1,
    'accept replay must not create duplicate Matches'
  );

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.conversations
      where match_id = (
        select value::uuid from pg_temp.v156_state where key = 'match_id'
      )
    ) = 1,
    'accept replay must not create duplicate Conversations'
  );
end;
$matching_counts$;

select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000001');
set local role authenticated;

do $chat_insert$
declare
  v_match_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'match_id'
  );
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'conversation_id'
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
    'a5060000-0000-4000-8000-000000000001',
    'a5060000-0000-4000-8000-000000000002',
    v_conversation_id::text,
    'I offer the transferable Event bundle for the agreed Object.',
    'text',
    jsonb_build_object('fixture', 'v1_05_6_event_object_e2e')
  )
  returning id into v_message_id;

  insert into pg_temp.v156_state(key, value)
  values ('message_id', v_message_id::text);
end;
$chat_insert$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_chat$
declare
  v_match_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'match_id'
  );
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'conversation_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      $sql$
        insert into public.messages (
          match_id,
          swap_id,
          sender_id,
          recipient_id,
          conversation_id,
          content,
          message_type
        ) values (
          %L::uuid,
          null,
          'a5060000-0000-4000-8000-000000000003'::uuid,
          'a5060000-0000-4000-8000-000000000002'::uuid,
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
        select value::uuid from pg_temp.v156_state where key = 'message_id'
      )
    ),
    'outsider must not read the participant message'
  );
end;
$outsider_chat$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000002');
set local role authenticated;

do $participant_chat_read$
begin
  perform pg_temp.assert_true(
    exists (
      select 1
      from public.messages
      where id = (
        select value::uuid from pg_temp.v156_state where key = 'message_id'
      )
    ),
    'the recipient must read the participant chat message'
  );
end;
$participant_chat_read$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_agreement_access$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'conversation_id'
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
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000001');
set local role authenticated;

do $agreement_save$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'conversation_id'
  );
  v_payload jsonb;
  v_saved jsonb;
  v_replay jsonb;
  v_hash text;
begin
  v_payload := jsonb_build_object(
    'condition_notes',
      'The Object condition and Event transferability are confirmed by both participants.',
    'offer_notes',
      'One transferable Event bundle is exchanged for the agreed Object.',
    'logistics_method',
      'other',
    'logistics_notes',
      'The ticket proof remains private and the Object handover follows the Exchange checklist.',
    'additional_terms',
      'Both participants confirm the same frozen Event contract before handoff.',
    'domain_terms',
      jsonb_build_array(jsonb_build_object(
        'item_id', 'a5060000-0000-4000-8000-000000000101',
        'domain', 'event',
        'terms', jsonb_build_object(
          'quantity', 1,
          'transferable', true,
          'issuer_rule_confirmed', true,
          'issuer_rule_source',
            'https://issuer.example.invalid/v1-05-6-transfer-policy',
          'transfer_deadline_at',
            (clock_timestamp() + interval '14 days')::text,
          'bundle', jsonb_build_object(
            'ticket', true,
            'accommodation', true,
            'transport', true
          ),
          'proof_required', true,
          'transfer_notes',
            'Provider submits the private Event proof through the canonical proof authority.'
        )
      ))
  );

  v_saved := public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'save',
    0,
    'v156.agreement.save',
    v_payload
  );

  v_replay := public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'save',
    0,
    'v156.agreement.save',
    v_payload
  );

  v_hash := v_saved #>> '{agreement,content_hash}';

  perform pg_temp.assert_true(
    (v_saved #>> '{agreement,revision}')::integer = 1
      and v_replay = v_saved
      and v_hash ~ '^[a-f0-9]{64}$',
    'Agreement save must create revision 1 and replay exactly'
  );

  insert into pg_temp.v156_state(key, value)
  values ('agreement_hash', v_hash);

  perform pg_temp.expect_error(
    format(
      $sql$
        select public.update_match_conversation_agreement_v2(
          %L::uuid,
          'save',
          0,
          'v156.agreement.stale',
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
          'v156.agreement.save',
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
    'v156.agreement.confirm.event',
    '{}'::jsonb
  );
end;
$agreement_save$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000002');
set local role authenticated;

do $agreement_confirm_object$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'conversation_id'
  );
  v_confirmed jsonb;
  v_replay jsonb;
begin
  v_confirmed := public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'confirm',
    1,
    'v156.agreement.confirm.object',
    '{}'::jsonb
  );

  v_replay := public.update_match_conversation_agreement_v2(
    v_conversation_id,
    'confirm',
    1,
    'v156.agreement.confirm.object',
    '{}'::jsonb
  );

  perform pg_temp.assert_true(
    v_confirmed = v_replay
      and jsonb_array_length(v_confirmed #> '{agreement,confirmed_by}') = 2
      and (v_confirmed -> 'completed_stages') ? 'agreement',
    'both participants must confirm the same Event Agreement revision'
  );
end;
$agreement_confirm_object$;

reset role;

do $agreement_receipts$
begin
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.match_agreement_mutation_receipts
      where conversation_id = (
        select value::uuid from pg_temp.v156_state where key = 'conversation_id'
      )
    ) = 3,
    'Agreement save and two confirmations require exactly three receipts'
  );
end;
$agreement_receipts$;

select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000001');
set local role authenticated;

do $create_exchange$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'conversation_id'
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
        select value from pg_temp.v156_state where key = 'agreement_hash'
      ),
    'first explicit handoff must create one Exchange from the frozen Agreement'
  );

  insert into pg_temp.v156_state(key, value)
  values ('swap_id', v_swap_id::text);
end;
$create_exchange$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000002');
set local role authenticated;

do $exchange_replay$
declare
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'conversation_id'
  );
  v_swap_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'swap_id'
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
    'second participant handoff must return the same Exchange'
  );
end;
$exchange_replay$;

reset role;

do $event_ledger$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'swap_id'
  );
  v_transfer_id uuid;
begin
  select id
  into strict v_transfer_id
  from public.event_transfers
  where swap_id = v_swap_id;

  perform pg_temp.assert_true(
    (
      select count(*) from public.swaps where id = v_swap_id
    ) = 1
      and (
        select count(*) from public.event_transfers where swap_id = v_swap_id
      ) = 1
      and (
        select count(*)
        from public.event_transfer_events
        where transfer_id = v_transfer_id
          and event_type = 'created'
      ) = 1,
    'Agreement handoff must atomically create one Event transfer'
  );

  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5060000-0000-4000-8000-000000000101'
    ) = 1,
    'Event handoff must reserve exactly one unit of capacity'
  );

  insert into pg_temp.v156_state(key, value)
  values ('transfer_id', v_transfer_id::text);
end;
$event_ledger$;

select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000001');
set local role authenticated;

do $premature_completion$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'swap_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      'select public.confirm_swap_completion_v1(%L::uuid, %L)',
      v_swap_id,
      'v156.completion.premature'
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
        select value::uuid from pg_temp.v156_state where key = 'swap_id'
      )
    ),
    'premature completion denial must leave zero partial confirmations'
  );
end;
$no_partial_confirmation$;

select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000001');
set local role authenticated;

do $event_submit_proof$
declare
  v_transfer_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'transfer_id'
  );
  v_result jsonb;
  v_replay jsonb;
  v_secret constant text := 'SWAPLY-V156-PRIVATE-EVENT-CODE';
begin
  v_result := public.mutate_event_transfer_v1(
    v_transfer_id,
    'submit_proof',
    0,
    jsonb_build_object(
      'note', 'Issuer-approved Event transfer proof.',
      'proof', jsonb_build_array(jsonb_build_object(
        'type', 'qr_code',
        'reference', v_secret,
        'label', 'Private Event QR code'
      ))
    ),
    'v156.event.submit'
  );

  v_replay := public.mutate_event_transfer_v1(
    v_transfer_id,
    'submit_proof',
    0,
    jsonb_build_object(
      'note', 'Issuer-approved Event transfer proof.',
      'proof', jsonb_build_array(jsonb_build_object(
        'type', 'qr_code',
        'reference', v_secret,
        'label', 'Private Event QR code'
      ))
    ),
    'v156.event.submit'
  );

  perform pg_temp.assert_true(
    v_result #>> '{transfer,status}' = 'proof_submitted'
      and (v_result #>> '{transfer,revision}')::bigint = 1
      and (v_result #>> '{transfer,proof_revision}')::integer = 1
      and coalesce((v_replay ->> 'replayed')::boolean, false),
    'Event proof submission must advance once and replay exactly'
  );

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_transfer_events
      where transfer_id = v_transfer_id
        and event_type = 'proof_submitted'
    ) = 1,
    'Event proof replay must not duplicate participant-visible ledger events'
  );

  perform pg_temp.assert_true(
    (
      select status
      from public.swaps
      where id = (
        select value::uuid from pg_temp.v156_state where key = 'swap_id'
      )
    ) = 'in_progress',
    'first Event proof must advance the Exchange to in_progress'
  );
end;
$event_submit_proof$;

reset role;

do $event_private_proof_count$
declare
  v_transfer_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'transfer_id'
  );
begin
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_proofs
      where transfer_id = v_transfer_id
    ) = 1,
    'Event proof replay must persist exactly one private proof revision'
  );
end;
$event_private_proof_count$;

select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_event_access$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'swap_id'
  );
  v_transfer_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'transfer_id'
  );
begin
  perform pg_temp.expect_error(
    format(
      'select public.get_event_transfers_v1(%L::uuid)',
      v_swap_id
    ),
    '42501',
    'access denied'
  );

  perform pg_temp.expect_error(
    format(
      $sql$
        select public.mutate_event_transfer_v1(
          %L::uuid,
          'confirm_transfer',
          1,
          '{"note":"Outsider confirmation"}'::jsonb,
          'v156.event.outsider'
        )
      $sql$,
      v_transfer_id
    ),
    '42501',
    'mutation denied'
  );

  perform pg_temp.expect_error(
    format(
      'select public.get_domain_completion_readiness_v1(%L::uuid)',
      v_swap_id
    ),
    '42501',
    'access denied'
  );
end;
$outsider_event_access$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000002');
set local role authenticated;

do $event_confirm_transfer$
declare
  v_transfer_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'transfer_id'
  );
  v_result jsonb;
  v_proof jsonb;
begin
  v_proof := public.get_event_transfer_proof_v1(v_transfer_id, 1);

  perform pg_temp.assert_true(
    v_proof #>> '{proof,0,reference}' =
      'SWAPLY-V156-PRIVATE-EVENT-CODE',
    'recipient must retrieve the exact private proof through authorized authority'
  );

  v_result := public.mutate_event_transfer_v1(
    v_transfer_id,
    'confirm_transfer',
    1,
    jsonb_build_object('note', 'Event transfer proof accepted.'),
    'v156.event.confirm'
  );

  perform pg_temp.assert_true(
    v_result #>> '{transfer,status}' = 'confirmed'
      and (v_result #>> '{transfer,revision}')::bigint = 2
      and (v_result #>> '{transfer,confirmed_at}') is not null,
    'recipient confirmation must complete the Event transfer'
  );
end;
$event_confirm_transfer$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000001');
set local role authenticated;

do $readiness$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'swap_id'
  );
  v_readiness jsonb;
begin
  v_readiness := public.get_domain_completion_readiness_v1(v_swap_id);

  perform pg_temp.assert_true(
    coalesce((v_readiness ->> 'ready')::boolean, false)
      and coalesce((v_readiness ->> 'domain_aware')::boolean, false)
      and (v_readiness #>> '{expected,event}')::integer = 1
      and (v_readiness #>> '{ready_ledgers,event}')::integer = 1,
    'confirmed Event transfer must make the Exchange ready'
  );
end;
$readiness$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000001');
set local role authenticated;

do $completion_first$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'swap_id'
  );
  v_first jsonb;
  v_replay jsonb;
begin
  v_first := public.confirm_swap_completion_v1(
    v_swap_id,
    'v156.completion.event'
  );

  v_replay := public.confirm_swap_completion_v1(
    v_swap_id,
    'v156.completion.event'
  );

  perform pg_temp.assert_true(
    coalesce((v_first ->> 'both_confirmed')::boolean, true) is false
      and coalesce((v_first ->> 'replayed')::boolean, true) is false
      and coalesce((v_replay ->> 'replayed')::boolean, false)
      and jsonb_array_length(v_first -> 'confirmed_by') = 1,
    'first participant completion must persist once and replay exactly'
  );
end;
$completion_first$;

reset role;
select pg_temp.authenticate_as('a5060000-0000-4000-8000-000000000002');
set local role authenticated;

do $completion_second$
declare
  v_swap_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'swap_id'
  );
  v_completed jsonb;
  v_replay jsonb;
begin
  v_completed := public.confirm_swap_completion_v1(
    v_swap_id,
    'v156.completion.object'
  );

  v_replay := public.confirm_swap_completion_v1(
    v_swap_id,
    'v156.completion.object'
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
    select value::uuid from pg_temp.v156_state where key = 'swap_id'
  );
  v_conversation_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'conversation_id'
  );
  v_transfer_id uuid := (
    select value::uuid from pg_temp.v156_state where key = 'transfer_id'
  );
begin
  perform pg_temp.assert_true(
    (
      select status from public.swaps where id = v_swap_id
    ) = 'completed',
    'Event-to-Object Exchange must be completed'
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
      from public.event_transfers
      where id = v_transfer_id
    ) = 'confirmed',
    'Event transfer must remain confirmed'
  );

  perform pg_temp.assert_true(
    (
      select status = 'active' and is_active
      from public.items
      where id = 'a5060000-0000-4000-8000-000000000101'
    ),
    'reusable Event listing must remain active'
  );

  perform pg_temp.assert_true(
    (
      select status = 'traded' and not is_active
      from public.items
      where id = 'a5060000-0000-4000-8000-000000000102'
    ),
    'consumed Object listing must become traded and inactive'
  );

  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5060000-0000-4000-8000-000000000101'
    ) = 1,
    'confirmed Event capacity must remain consumed exactly once'
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
      from public.event_transfer_mutation_receipts
      where transfer_id = v_transfer_id
    ) = 2,
    'Event lifecycle must persist exactly two command receipts'
  );

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_proofs
      where transfer_id = v_transfer_id
    ) = 1,
    'Event lifecycle must preserve one private proof revision'
  );

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.messages
      where match_id = (
        select value::uuid from pg_temp.v156_state where key = 'match_id'
      )
    ) = 1,
    'Event-to-Object flow must preserve exactly one participant chat message'
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
  'contract', 'V1-05.6 Event-to-Object cumulative E2E',
  'flow',
    'Event -> Matching -> Chat -> Agreement -> Exchange -> Transfer -> Completion',
  'authenticated_replay', 'PASS',
  'interest_replay', 'PASS',
  'match_conversation_replay', 'PASS',
  'chat_participant_only', 'PASS',
  'agreement_revision_hash_replay', 'PASS',
  'exchange_handoff_replay', 'PASS',
  'event_transfer', 'PASS',
  'private_proof_boundary', 'PASS',
  'domain_completion', 'PASS',
  'outsider_denied', 'PASS',
  'premature_completion_denied', 'PASS',
  'event_capacity_consumed_once', 'PASS',
  'object_consumed', 'PASS',
  'event_listing_preserved', 'PASS',
  'rollback', true
) as result;
