begin;

set local statement_timeout = '120s';
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
    raise exception 'V1-05.4.5 hardening assertion failed: %', p_message;
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
          'V1-05.4.5 hardening expected SQLSTATE %, received %: %',
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
          'V1-05.4.5 hardening expected error containing "%", received: %',
          p_message_fragment,
          sqlerrm;
      end if;

      return;
  end;

  raise exception
    'V1-05.4.5 hardening expected SQLSTATE %, but the statement succeeded.',
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
    'v1545h-provider@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-8000-000000000000',
    'a5460000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'v1545h-recipient@example.invalid',
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
    'a5460000-0000-4000-8000-000000000001',
    'v1545h_provider',
    'user',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000002',
    'v1545h_recipient',
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
  created_at,
  updated_at
) values
  (
    'a5460000-0000-4000-8000-000000000101',
    'a5460000-0000-4000-8000-000000000001',
    'V1-05.4.5 guarded Event',
    'Event used to verify capacity hold protection.',
    'events',
    'used_good',
    'active',
    true,
    'event',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000102',
    'a5460000-0000-4000-8000-000000000002',
    'V1-05.4.5 guarded Object',
    'Object paired with the guarded Event.',
    'electronics',
    'used_good',
    'active',
    true,
    'object',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000103',
    'a5460000-0000-4000-8000-000000000001',
    'V1-05.4.5 pre-existing Event',
    'Event used to verify migration backfill.',
    'events',
    'used_good',
    'active',
    true,
    'event',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000104',
    'a5460000-0000-4000-8000-000000000002',
    'V1-05.4.5 pre-existing Object',
    'Object paired with the pre-existing Event.',
    'electronics',
    'used_good',
    'active',
    true,
    'object',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000105',
    'a5460000-0000-4000-8000-000000000002',
    'V1-05.4.5 missing-ledger Object',
    'Object paired with the missing-ledger Event Exchange.',
    'electronics',
    'used_good',
    'active',
    true,
    'object',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  );

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
  (
    'a5460000-0000-4000-8000-000000000111',
    'a5460000-0000-4000-8000-000000000101',
    'a5460000-0000-4000-8000-000000000001',
    'active',
    current_date + 60,
    'UTC',
    3,
    3,
    true,
    true,
    'https://issuer.example.invalid/v1545h-policy',
    clock_timestamp() + interval '30 days',
    false,
    false,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000112',
    'a5460000-0000-4000-8000-000000000103',
    'a5460000-0000-4000-8000-000000000001',
    'active',
    current_date + 60,
    'UTC',
    2,
    2,
    true,
    true,
    'https://issuer.example.invalid/v1545h-policy',
    clock_timestamp() + interval '30 days',
    false,
    false,
    clock_timestamp(),
    clock_timestamp()
  );

insert into public.conversations (
  id,
  participant_ids,
  item_ids,
  status,
  agenda_state,
  created_at,
  updated_at
) values
  (
    'a5460000-0000-4000-8000-000000000301',
    array[
      'a5460000-0000-4000-8000-000000000001'::uuid,
      'a5460000-0000-4000-8000-000000000002'::uuid
    ],
    array[
      'a5460000-0000-4000-8000-000000000101'::uuid,
      'a5460000-0000-4000-8000-000000000102'::uuid
    ],
    'active',
    '{"version":3,"active_stage":"agreement","completed_stages":["agreement"]}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000302',
    array[
      'a5460000-0000-4000-8000-000000000001'::uuid,
      'a5460000-0000-4000-8000-000000000002'::uuid
    ],
    array[
      'a5460000-0000-4000-8000-000000000103'::uuid,
      'a5460000-0000-4000-8000-000000000104'::uuid
    ],
    'active',
    '{"version":3,"active_stage":"agreement","completed_stages":["agreement"]}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5460000-0000-4000-8000-000000000303',
    array[
      'a5460000-0000-4000-8000-000000000001'::uuid,
      'a5460000-0000-4000-8000-000000000002'::uuid
    ],
    array[
      'a5460000-0000-4000-8000-000000000103'::uuid,
      'a5460000-0000-4000-8000-000000000105'::uuid
    ],
    'active',
    '{"version":3,"active_stage":"agreement","completed_stages":["agreement"]}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  );

select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000001');

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
  created_at,
  updated_at
) values (
  'a5460000-0000-4000-8000-000000000401',
  'a5460000-0000-4000-8000-000000000001',
  'a5460000-0000-4000-8000-000000000002',
  'accepted',
  'a5460000-0000-4000-8000-000000000301',
  'a5460000-0000-4000-8000-000000000101',
  'a5460000-0000-4000-8000-000000000102',
  'bilateral',
  jsonb_build_object(
    'source', 'domain_aware_match_agreement',
    'agreement_hash', repeat('a', 64),
    'fixture', 'v1_05_4_5_hardening'
  ),
  1,
  jsonb_build_object(
    'domain_terms',
    jsonb_build_array(jsonb_build_object(
      'item_id', 'a5460000-0000-4000-8000-000000000101'::uuid,
      'domain', 'event',
      'terms', jsonb_build_object(
        'quantity', 1,
        'transferable', true,
        'issuer_rule_confirmed', true,
        'issuer_rule_source', 'https://issuer.example.invalid/v1545h-policy',
        'transfer_deadline_at', (clock_timestamp() + interval '7 days')::text,
        'bundle', jsonb_build_object(
          'ticket', true,
          'accommodation', false,
          'transport', false
        ),
        'proof_required', true,
        'transfer_notes', 'Hardening fixture proof must remain private.'
      )
    ))
  ),
  true,
  true,
  clock_timestamp(),
  clock_timestamp()
);

update public.conversations
set swap_id = 'a5460000-0000-4000-8000-000000000401',
    updated_at = clock_timestamp()
where id = 'a5460000-0000-4000-8000-000000000301';

do $capacity_guard$
begin
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_transfers
      where swap_id = 'a5460000-0000-4000-8000-000000000401'
    ) = 1,
    'new Event Exchange must create one transfer through the shared authority'
  );

  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5460000-0000-4000-8000-000000000101'
    ) = 2,
    'new Event Exchange must reserve one capacity unit'
  );

  perform pg_temp.expect_error(
    $sql$update public.events_listings
      set capacity_available = 3,
          updated_at = clock_timestamp()
      where item_id = 'a5460000-0000-4000-8000-000000000101'::uuid$sql$,
    '23514',
    'overwrite reserved Event transfer capacity'
  );

  update public.events_listings
  set capacity_total = 4,
      capacity_available = 3,
      updated_at = clock_timestamp()
  where item_id = 'a5460000-0000-4000-8000-000000000101';

  perform pg_temp.assert_true(
    (
      select capacity_total = 4 and capacity_available = 3
      from public.events_listings
      where item_id = 'a5460000-0000-4000-8000-000000000101'
    ),
    'capacity increase must preserve the active transfer hold'
  );

  perform public.cancel_swap_v1(
    'a5460000-0000-4000-8000-000000000401',
    'accepted',
    'Hardening replay cancellation.',
    'v1545h.cancel.guard'
  );

  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5460000-0000-4000-8000-000000000101'
    ) = 4,
    'terminal cancellation must release capacity through the guarded update path'
  );
end;
$capacity_guard$;

set local session_replication_role = replica;

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
  created_at,
  updated_at
) values (
  'a5460000-0000-4000-8000-000000000402',
  'a5460000-0000-4000-8000-000000000001',
  'a5460000-0000-4000-8000-000000000002',
  'in_progress',
  'a5460000-0000-4000-8000-000000000302',
  'a5460000-0000-4000-8000-000000000103',
  'a5460000-0000-4000-8000-000000000104',
  'bilateral',
  jsonb_build_object(
    'source', 'domain_aware_match_agreement',
    'agreement_hash', repeat('b', 64),
    'fixture', 'v1_05_4_5_preexisting'
  ),
  1,
  jsonb_build_object(
    'domain_terms',
    jsonb_build_array(jsonb_build_object(
      'item_id', 'a5460000-0000-4000-8000-000000000103'::uuid,
      'domain', 'event',
      'terms', jsonb_build_object(
        'quantity', 1,
        'transferable', true,
        'issuer_rule_confirmed', true,
        'issuer_rule_source', 'https://issuer.example.invalid/v1545h-policy',
        'transfer_deadline_at', (clock_timestamp() + interval '7 days')::text,
        'bundle', jsonb_build_object(
          'ticket', true,
          'accommodation', false,
          'transport', false
        ),
        'proof_required', true,
        'transfer_notes', 'Pre-existing Event Exchange requires migration backfill.'
      )
    ))
  ),
  true,
  true,
  clock_timestamp(),
  clock_timestamp()
);

set local session_replication_role = origin;

update public.conversations
set swap_id = 'a5460000-0000-4000-8000-000000000402',
    updated_at = clock_timestamp()
where id = 'a5460000-0000-4000-8000-000000000302';

do $backfill$
declare
  v_capacity_after_first integer;
  v_capacity_after_second integer;
begin
  perform pg_temp.assert_true(
    not exists (
      select 1
      from public.event_transfers
      where swap_id = 'a5460000-0000-4000-8000-000000000402'
    ),
    'pre-existing Exchange must begin without a transfer row'
  );

  perform private.backfill_event_transfers_v1();

  select capacity_available
  into strict v_capacity_after_first
  from public.events_listings
  where item_id = 'a5460000-0000-4000-8000-000000000103';

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_transfers
      where swap_id = 'a5460000-0000-4000-8000-000000000402'
    ) = 1
      and v_capacity_after_first = 1,
    'backfill must create one transfer and one capacity hold'
  );

  perform private.backfill_event_transfers_v1();

  select capacity_available
  into strict v_capacity_after_second
  from public.events_listings
  where item_id = 'a5460000-0000-4000-8000-000000000103';

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_transfers
      where swap_id = 'a5460000-0000-4000-8000-000000000402'
    ) = 1
      and v_capacity_after_second = v_capacity_after_first,
    'backfill replay must not duplicate transfer rows or capacity holds'
  );
end;
$backfill$;

set local session_replication_role = replica;

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
  created_at,
  updated_at
) values (
  'a5460000-0000-4000-8000-000000000403',
  'a5460000-0000-4000-8000-000000000001',
  'a5460000-0000-4000-8000-000000000002',
  'in_progress',
  'a5460000-0000-4000-8000-000000000303',
  'a5460000-0000-4000-8000-000000000103',
  'a5460000-0000-4000-8000-000000000105',
  'bilateral',
  jsonb_build_object(
    'source', 'domain_aware_match_agreement',
    'agreement_hash', repeat('c', 64),
    'fixture', 'v1_05_4_5_missing_ledger'
  ),
  1,
  jsonb_build_object(
    'domain_terms',
    jsonb_build_array(jsonb_build_object(
      'item_id', 'a5460000-0000-4000-8000-000000000103'::uuid,
      'domain', 'event',
      'terms', jsonb_build_object(
        'quantity', 1,
        'transferable', true,
        'issuer_rule_confirmed', true,
        'issuer_rule_source', 'https://issuer.example.invalid/v1545h-policy',
        'transfer_deadline_at', (clock_timestamp() + interval '7 days')::text,
        'bundle', jsonb_build_object(
          'ticket', true,
          'accommodation', false,
          'transport', false
        ),
        'proof_required', true,
        'transfer_notes', 'Missing-ledger completion must fail closed.'
      )
    ))
  ),
  true,
  true,
  clock_timestamp(),
  clock_timestamp()
);

set local session_replication_role = origin;

update public.conversations
set swap_id = 'a5460000-0000-4000-8000-000000000403',
    updated_at = clock_timestamp()
where id = 'a5460000-0000-4000-8000-000000000303';

select pg_temp.authenticate_as('a5460000-0000-4000-8000-000000000001');

select pg_temp.expect_error(
  $sql$select public.apply_swap_transition_v1(
    'a5460000-0000-4000-8000-000000000403'::uuid,
    'in_progress',
    'completed',
    'a5460000-0000-4000-8000-000000000001'::uuid,
    'v1_05_4_5_missing_ledger',
    'v1545h.complete.missing'
  )$sql$,
  '23514',
  'one transfer per Event'
);

select jsonb_build_object(
  'contract', 'V1-05.4.5 Event Transfer Hardening',
  'capacity_edit_guard', 'PASS',
  'active_exchange_backfill', 'PASS',
  'backfill_idempotency', 'PASS',
  'missing_ledger_completion_guard', 'PASS',
  'rollback', true
) as v1_05_4_5_hardening_result;

rollback;
