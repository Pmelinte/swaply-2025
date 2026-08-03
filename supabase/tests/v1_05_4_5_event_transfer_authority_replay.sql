begin;

set local statement_timeout = '180s';
set local lock_timeout = '10s';

create temporary table pg_temp.v1545_state (
  key text primary key,
  value uuid not null
) on commit drop;

grant select on table pg_temp.v1545_state to authenticated;

create or replace function pg_temp.assert_true(
  p_condition boolean,
  p_message text
)
returns void
language plpgsql
as $function$
begin
  if coalesce(p_condition, false) is not true then
    raise exception 'V1-05.4.5 replay assertion failed: %', p_message;
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
          'V1-05.4.5 expected SQLSTATE %, received %: %',
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
          'V1-05.4.5 expected error containing "%", received: %',
          p_message_fragment,
          sqlerrm;
      end if;

      return;
  end;

  raise exception
    'V1-05.4.5 expected SQLSTATE %, but the statement succeeded.',
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
    'a5450000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'v1545-provider@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5450000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'v1545-recipient@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5450000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'v1545-outsider@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5450000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'v1545-admin@example.invalid',
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
    'a5450000-0000-4000-8000-000000000001',
    'v1545_provider',
    'user',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5450000-0000-4000-8000-000000000002',
    'v1545_recipient',
    'user',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5450000-0000-4000-8000-000000000003',
    'v1545_outsider',
    'user',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5450000-0000-4000-8000-000000000004',
    'v1545_admin',
    'admin',
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
    'a5450000-0000-4000-8000-000000000101',
    'a5450000-0000-4000-8000-000000000001',
    'V1-05.4.5 Event',
    'Deterministic Event fixture for authenticated replay.',
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
    'a5450000-0000-4000-8000-000000000102',
    'a5450000-0000-4000-8000-000000000002',
    'V1-05.4.5 Object 1',
    'First deterministic target object.',
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
    'a5450000-0000-4000-8000-000000000103',
    'a5450000-0000-4000-8000-000000000002',
    'V1-05.4.5 Object 2',
    'Second deterministic target object.',
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
    'a5450000-0000-4000-8000-000000000104',
    'a5450000-0000-4000-8000-000000000002',
    'V1-05.4.5 Object 3',
    'Third deterministic target object.',
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
    'a5450000-0000-4000-8000-000000000105',
    'a5450000-0000-4000-8000-000000000002',
    'V1-05.4.5 Object 4',
    'Fourth deterministic target object.',
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
) values (
  'a5450000-0000-4000-8000-000000000111',
  'a5450000-0000-4000-8000-000000000101',
  'a5450000-0000-4000-8000-000000000001',
  'active',
  current_date + 60,
  'UTC',
  2,
  2,
  true,
  true,
  'https://issuer.example.invalid/transfer-policy-v1',
  clock_timestamp() + interval '30 days',
  true,
  true,
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
)
select
  fixture.conversation_id,
  array[
    'a5450000-0000-4000-8000-000000000001'::uuid,
    'a5450000-0000-4000-8000-000000000002'::uuid
  ],
  array[
    'a5450000-0000-4000-8000-000000000101'::uuid,
    fixture.object_item_id
  ],
  'active',
  jsonb_build_object(
    'version', 3,
    'conversation_id', fixture.conversation_id,
    'active_stage', 'agreement',
    'completed_stages', jsonb_build_array('agreement')
  ),
  clock_timestamp(),
  clock_timestamp()
from (
  values
    (
      'a5450000-0000-4000-8000-000000000301'::uuid,
      'a5450000-0000-4000-8000-000000000102'::uuid
    ),
    (
      'a5450000-0000-4000-8000-000000000302'::uuid,
      'a5450000-0000-4000-8000-000000000103'::uuid
    ),
    (
      'a5450000-0000-4000-8000-000000000303'::uuid,
      'a5450000-0000-4000-8000-000000000104'::uuid
    ),
    (
      'a5450000-0000-4000-8000-000000000304'::uuid,
      'a5450000-0000-4000-8000-000000000105'::uuid
    )
) as fixture(conversation_id, object_item_id);

create or replace function pg_temp.create_event_exchange(
  p_conversation_id uuid,
  p_object_item_id uuid,
  p_swap_id uuid,
  p_suffix text
)
returns uuid
language plpgsql
as $function$
declare
  v_provider constant uuid := 'a5450000-0000-4000-8000-000000000001';
  v_recipient constant uuid := 'a5450000-0000-4000-8000-000000000002';
  v_event_item constant uuid := 'a5450000-0000-4000-8000-000000000101';
  v_transfer_id uuid;
begin
  perform pg_temp.authenticate_as(v_provider);

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
    p_swap_id,
    v_provider,
    v_recipient,
    'accepted',
    p_conversation_id,
    v_event_item,
    p_object_item_id,
    'bilateral',
    jsonb_build_object(
      'source', 'domain_aware_match_agreement',
      'agreement_hash', repeat(substr(md5(p_suffix), 1, 1), 64),
      'fixture', 'v1_05_4_5_current_contract'
    ),
    1,
    jsonb_build_object(
      'domain_terms',
      jsonb_build_array(jsonb_build_object(
        'item_id', v_event_item,
        'domain', 'event',
        'terms', jsonb_build_object(
          'quantity', 1,
          'transferable', true,
          'issuer_rule_confirmed', true,
          'issuer_rule_source', 'https://issuer.example.invalid/transfer-policy-v1',
          'transfer_deadline_at', (clock_timestamp() + interval '7 days')::text,
          'bundle', jsonb_build_object(
            'ticket', true,
            'accommodation', false,
            'transport', false
          ),
          'proof_required', true,
          'transfer_notes', 'Provider transfers the private ticket code through Swaply proof authority.'
        )
      ))
    ),
    true,
    true,
    clock_timestamp(),
    clock_timestamp()
  );

  update public.conversations
  set swap_id = p_swap_id,
      updated_at = clock_timestamp()
  where id = p_conversation_id;

  select transfer_row.id
  into strict v_transfer_id
  from public.event_transfers transfer_row
  where transfer_row.swap_id = p_swap_id;

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_transfers transfer_row
      where transfer_row.swap_id = p_swap_id
    ) = 1,
    'Exchange must create exactly one Event transfer for ' || p_suffix
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_transfer_events event_row
      where event_row.transfer_id = v_transfer_id
        and event_row.event_type = 'created'
    ) = 1,
    'Event transfer creation must emit one created event for ' || p_suffix
  );

  return v_transfer_id;
end;
$function$;

do $setup$
declare
  v_transfer_id uuid;
begin
  v_transfer_id := pg_temp.create_event_exchange(
    'a5450000-0000-4000-8000-000000000301',
    'a5450000-0000-4000-8000-000000000102',
    'a5450000-0000-4000-8000-000000000401',
    's1'
  );

  insert into pg_temp.v1545_state(key, value) values
    ('s1_swap', 'a5450000-0000-4000-8000-000000000401'),
    ('s1_transfer', v_transfer_id);

  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5450000-0000-4000-8000-000000000101'
    ) = 1,
    'First Event transfer must reserve one unit of capacity'
  );
end;
$setup$;

select pg_temp.authenticate_as('a5450000-0000-4000-8000-000000000001');
set local role authenticated;

do $participant_rls$
declare
  v_transfer uuid;
begin
  select value into strict v_transfer
  from pg_temp.v1545_state where key = 's1_transfer';

  if (
    select count(*)
    from public.event_transfers transfer_row
    where transfer_row.id = v_transfer
  ) <> 1 then
    raise exception 'V1-05.4.5 participant RLS did not expose the transfer.';
  end if;

  if (
    select count(*)
    from public.event_transfer_events event_row
    where event_row.transfer_id = v_transfer
  ) <> 1 then
    raise exception 'V1-05.4.5 participant RLS did not expose the ledger.';
  end if;

  perform pg_temp.expect_error(
    'select count(*) from public.event_proofs',
    '42501',
    'permission denied'
  );
end;
$participant_rls$;

reset role;
select pg_temp.authenticate_as('a5450000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_rls$
begin
  if exists (select 1 from public.event_transfers) then
    raise exception 'V1-05.4.5 outsider RLS exposed Event transfers.';
  end if;

  if exists (select 1 from public.event_transfer_events) then
    raise exception 'V1-05.4.5 outsider RLS exposed Event transfer events.';
  end if;
end;
$outsider_rls$;

reset role;

do $transfer_lifecycle$
declare
  v_provider constant uuid := 'a5450000-0000-4000-8000-000000000001';
  v_recipient constant uuid := 'a5450000-0000-4000-8000-000000000002';
  v_outsider constant uuid := 'a5450000-0000-4000-8000-000000000003';
  v_swap_id uuid;
  v_transfer_id uuid;
  v_result jsonb;
  v_replay jsonb;
  v_private_proof jsonb;
  v_projection jsonb;
  v_secret_one constant text := 'SWAPLY-V1545-PRIVATE-CODE-ONE';
  v_secret_two constant text := 'SWAPLY-V1545-PRIVATE-CODE-TWO';
begin
  select value into strict v_swap_id
  from pg_temp.v1545_state where key = 's1_swap';
  select value into strict v_transfer_id
  from pg_temp.v1545_state where key = 's1_transfer';

  perform pg_temp.expect_error(
    format(
      $sql$select public.apply_swap_transition_v1(%L::uuid, 'accepted', 'completed', %L::uuid, 'bilateral_completion', 'v1545.premature.s1')$sql$,
      v_swap_id,
      v_recipient
    ),
    '23514',
    'Every Event transfer must be confirmed'
  );

  perform pg_temp.authenticate_as(v_provider);
  v_result := public.mutate_event_transfer_v1(
    v_transfer_id,
    'submit_proof',
    0,
    jsonb_build_object(
      'note', 'Initial issuer transfer proof.',
      'proof', jsonb_build_array(jsonb_build_object(
        'type', 'qr_code',
        'reference', v_secret_one,
        'label', 'Private ticket QR code'
      ))
    ),
    'v1545.submit.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{transfer,status}' = 'proof_submitted'
      and (v_result #>> '{transfer,revision}')::bigint = 1
      and (v_result #>> '{transfer,proof_revision}')::integer = 1,
    'Provider proof submission must create transfer revision 1 and proof revision 1'
  );
  perform pg_temp.assert_true(
    (select status from public.swaps where id = v_swap_id) = 'in_progress',
    'First Event proof submission must advance the Exchange to in_progress'
  );

  v_replay := public.mutate_event_transfer_v1(
    v_transfer_id,
    'submit_proof',
    0,
    jsonb_build_object(
      'note', 'Initial issuer transfer proof.',
      'proof', jsonb_build_array(jsonb_build_object(
        'type', 'qr_code',
        'reference', v_secret_one,
        'label', 'Private ticket QR code'
      ))
    ),
    'v1545.submit.s1'
  );

  perform pg_temp.assert_true(
    coalesce((v_replay ->> 'replayed')::boolean, false),
    'Exact Event proof replay must be marked replayed=true'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_proofs proof_row
      where proof_row.transfer_id = v_transfer_id
    ) = 1,
    'Exact replay must not duplicate private proof'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_transfer_events event_row
      where event_row.transfer_id = v_transfer_id
        and event_row.event_type = 'proof_submitted'
    ) = 1,
    'Exact replay must not duplicate proof-submitted event'
  );

  perform pg_temp.expect_error(
    format(
      $sql$select public.mutate_event_transfer_v1(%L::uuid, 'submit_proof', 0, '{"note":"Changed payload","proof":[{"type":"note","reference":"changed"}]}'::jsonb, 'v1545.submit.s1')$sql$,
      v_transfer_id
    ),
    '23505',
    'Idempotency key'
  );

  perform pg_temp.expect_error(
    format(
      $sql$select public.mutate_event_transfer_v1(%L::uuid, 'request_retry', 0, '{"reason":"Stale retry"}'::jsonb, 'v1545.stale.s1')$sql$,
      v_transfer_id
    ),
    '40001',
    'Stale Event transfer revision'
  );

  v_projection := public.get_event_transfers_v1(v_swap_id);
  perform pg_temp.assert_true(
    pg_catalog.strpos(v_projection::text, v_secret_one) = 0,
    'Participant transfer projection must not expose raw private proof'
  );
  perform pg_temp.assert_true(
    not exists (
      select 1
      from public.event_transfer_events event_row
      where event_row.transfer_id = v_transfer_id
        and pg_catalog.strpos(event_row.metadata::text, v_secret_one) > 0
    ),
    'Participant Event ledger must not expose raw private proof'
  );

  v_private_proof := public.get_event_transfer_proof_v1(v_transfer_id, 1);
  perform pg_temp.assert_true(
    v_private_proof #>> '{proof,0,reference}' = v_secret_one,
    'Provider must retrieve the exact private proof through the authorized RPC'
  );

  perform pg_temp.authenticate_as(v_outsider);
  perform pg_temp.expect_error(
    format(
      $sql$select public.get_event_transfers_v1(%L::uuid)$sql$,
      v_swap_id
    ),
    '42501',
    'access denied'
  );
  perform pg_temp.expect_error(
    format(
      $sql$select public.get_event_transfer_proof_v1(%L::uuid, 1)$sql$,
      v_transfer_id
    ),
    '42501',
    'proof access denied'
  );
  perform pg_temp.expect_error(
    format(
      $sql$select public.mutate_event_transfer_v1(%L::uuid, 'request_retry', 1, '{"reason":"Outsider retry"}'::jsonb, 'v1545.outsider.s1')$sql$,
      v_transfer_id
    ),
    '42501',
    'mutation denied'
  );

  perform pg_temp.authenticate_as(v_recipient);
  v_private_proof := public.get_event_transfer_proof_v1(v_transfer_id, 1);
  perform pg_temp.assert_true(
    v_private_proof #>> '{proof,0,reference}' = v_secret_one,
    'Recipient must retrieve the exact private proof through the authorized RPC'
  );

  v_result := public.mutate_event_transfer_v1(
    v_transfer_id,
    'request_retry',
    1,
    jsonb_build_object(
      'reason', 'Issuer rejected the first transfer code; submit a replacement.'
    ),
    'v1545.retry.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{transfer,status}' = 'retry_requested'
      and (v_result #>> '{transfer,revision}')::bigint = 2,
    'Recipient retry request must advance transfer to revision 2'
  );

  perform pg_temp.authenticate_as(v_provider);
  v_result := public.mutate_event_transfer_v1(
    v_transfer_id,
    'submit_proof',
    2,
    jsonb_build_object(
      'note', 'Replacement issuer transfer proof.',
      'proof', jsonb_build_array(jsonb_build_object(
        'type', 'booking_reference',
        'reference', v_secret_two,
        'label', 'Replacement private booking reference'
      ))
    ),
    'v1545.resubmit.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{transfer,status}' = 'proof_submitted'
      and (v_result #>> '{transfer,revision}')::bigint = 3
      and (v_result #>> '{transfer,proof_revision}')::integer = 2,
    'Replacement proof must create transfer revision 3 and proof revision 2'
  );

  perform pg_temp.authenticate_as(v_recipient);
  v_private_proof := public.get_event_transfer_proof_v1(v_transfer_id, 2);
  perform pg_temp.assert_true(
    v_private_proof #>> '{proof,0,reference}' = v_secret_two,
    'Recipient must receive the replacement private proof revision'
  );

  v_result := public.mutate_event_transfer_v1(
    v_transfer_id,
    'confirm_transfer',
    3,
    jsonb_build_object('note', 'Replacement booking reference accepted.'),
    'v1545.confirm.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{transfer,status}' = 'confirmed'
      and (v_result #>> '{transfer,revision}')::bigint = 4
      and (v_result #>> '{transfer,confirmed_at}') is not null,
    'Recipient confirmation must complete the Event transfer at revision 4'
  );

  perform public.apply_swap_transition_v1(
    v_swap_id,
    'in_progress',
    'completed',
    v_recipient,
    'bilateral_completion',
    'v1545.complete.s1'
  );

  perform pg_temp.assert_true(
    (select status from public.swaps where id = v_swap_id) = 'completed',
    'Exchange completion must succeed after Event transfer confirmation'
  );
  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5450000-0000-4000-8000-000000000101'
    ) = 1,
    'Confirmed Event consumption must not restore capacity'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_proofs proof_row
      where proof_row.transfer_id = v_transfer_id
    ) = 2,
    'Event proof history must preserve both private revisions'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.event_transfer_mutation_receipts receipt_row
      where receipt_row.transfer_id = v_transfer_id
    ) = 4,
    'Exact replay and rejected requests must not duplicate mutation receipts'
  );
end;
$transfer_lifecycle$;

do $capacity_cancel_dispute$
declare
  v_provider constant uuid := 'a5450000-0000-4000-8000-000000000001';
  v_recipient constant uuid := 'a5450000-0000-4000-8000-000000000002';
  v_admin constant uuid := 'a5450000-0000-4000-8000-000000000004';
  v_s2_transfer uuid;
  v_s3_transfer uuid;
  v_s4_transfer uuid;
  v_dispute_id uuid;
  v_report jsonb;
  v_report_replay jsonb;
  v_resolution jsonb;
begin
  v_s2_transfer := pg_temp.create_event_exchange(
    'a5450000-0000-4000-8000-000000000302',
    'a5450000-0000-4000-8000-000000000103',
    'a5450000-0000-4000-8000-000000000402',
    's2'
  );

  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5450000-0000-4000-8000-000000000101'
    ) = 0,
    'Second Event transfer must consume the last available unit'
  );

  perform pg_temp.expect_error(
    $sql$select pg_temp.create_event_exchange(
      'a5450000-0000-4000-8000-000000000303'::uuid,
      'a5450000-0000-4000-8000-000000000104'::uuid,
      'a5450000-0000-4000-8000-000000000403'::uuid,
      's3'
    )$sql$,
    '23P01',
    'capacity is unavailable'
  );

  perform pg_temp.assert_true(
    not exists (
      select 1
      from public.swaps
      where id = 'a5450000-0000-4000-8000-000000000403'
    ),
    'Failed Event capacity acquisition must leave Exchange absent'
  );

  perform pg_temp.authenticate_as(v_provider);
  perform public.cancel_swap_v1(
    'a5450000-0000-4000-8000-000000000402',
    'accepted',
    'Rollback-only Event capacity cancellation.',
    'v1545.cancel.s2'
  );

  perform pg_temp.assert_true(
    (
      select transfer_row.status = 'cancelled'
        and transfer_row.closed_at is not null
        and transfer_row.close_reason = 'swap_cancelled'
        and transfer_row.capacity_released_at is not null
      from public.event_transfers transfer_row
      where transfer_row.id = v_s2_transfer
    ),
    'Cancellation must close the unconfirmed Event transfer and release capacity'
  );
  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5450000-0000-4000-8000-000000000101'
    ) = 1,
    'Cancellation must restore exactly one Event capacity unit'
  );

  v_s3_transfer := pg_temp.create_event_exchange(
    'a5450000-0000-4000-8000-000000000303',
    'a5450000-0000-4000-8000-000000000104',
    'a5450000-0000-4000-8000-000000000403',
    's3'
  );

  update public.event_transfers
  set transfer_deadline_at = clock_timestamp() - interval '1 minute',
      updated_at = clock_timestamp()
  where id = v_s3_transfer;

  perform pg_temp.authenticate_as(v_recipient);
  v_report := public.mutate_event_transfer_v1(
    v_s3_transfer,
    'report_failure',
    0,
    jsonb_build_object(
      'reason', 'not_received',
      'description', 'The issuer transfer deadline passed without a usable ticket or booking reference.',
      'evidence', '[]'::jsonb
    ),
    'v1545.failure.s3'
  );

  perform pg_temp.assert_true(
    v_report #>> '{transfer,status}' = 'disputed',
    'Missed Event transfer deadline must freeze the transfer as disputed'
  );

  v_report_replay := public.mutate_event_transfer_v1(
    v_s3_transfer,
    'report_failure',
    0,
    jsonb_build_object(
      'reason', 'not_received',
      'description', 'The issuer transfer deadline passed without a usable ticket or booking reference.',
      'evidence', '[]'::jsonb
    ),
    'v1545.failure.s3'
  );

  perform pg_temp.assert_true(
    coalesce((v_report_replay ->> 'replayed')::boolean, false),
    'Exact Event failure replay must return the original receipt'
  );

  select dispute_row.id
  into strict v_dispute_id
  from public.disputes dispute_row
  where dispute_row.swap_id = 'a5450000-0000-4000-8000-000000000403';

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.disputes dispute_row
      where dispute_row.swap_id = 'a5450000-0000-4000-8000-000000000403'
    ) = 1,
    'Exact Event failure replay must not duplicate the dispute'
  );
  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5450000-0000-4000-8000-000000000101'
    ) = 0,
    'Active Event dispute must preserve the capacity hold'
  );

  perform pg_temp.expect_error(
    $sql$select pg_temp.create_event_exchange(
      'a5450000-0000-4000-8000-000000000304'::uuid,
      'a5450000-0000-4000-8000-000000000105'::uuid,
      'a5450000-0000-4000-8000-000000000404'::uuid,
      's4'
    )$sql$,
    '23P01',
    'capacity is unavailable'
  );

  perform pg_temp.authenticate_as(v_admin);
  v_resolution := public.resolve_swap_dispute_v1(
    v_dispute_id,
    'resolved_split',
    'Rollback-only Event transfer replay resolution.',
    'v1545.resolve.s3'
  );

  perform pg_temp.assert_true(
    v_resolution #>> '{dispute,status}' = 'resolved_split',
    'Moderator resolution must close the canonical Event dispute'
  );
  perform pg_temp.assert_true(
    (
      select transfer_row.status = 'resolved'
        and transfer_row.closed_at is not null
        and transfer_row.close_reason = 'dispute_resolved_split'
        and transfer_row.capacity_released_at is not null
      from public.event_transfers transfer_row
      where transfer_row.id = v_s3_transfer
    ),
    'Terminal dispute resolution must release unconfirmed Event capacity'
  );
  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5450000-0000-4000-8000-000000000101'
    ) = 1,
    'Terminal dispute resolution must restore one Event capacity unit'
  );

  v_s4_transfer := pg_temp.create_event_exchange(
    'a5450000-0000-4000-8000-000000000304',
    'a5450000-0000-4000-8000-000000000105',
    'a5450000-0000-4000-8000-000000000404',
    's4'
  );

  perform pg_temp.authenticate_as(v_provider);
  perform public.cancel_swap_v1(
    'a5450000-0000-4000-8000-000000000404',
    'accepted',
    'Rollback-only final Event cleanup.',
    'v1545.cancel.s4'
  );

  perform pg_temp.assert_true(
    (
      select status
      from public.event_transfers
      where id = v_s4_transfer
    ) = 'cancelled',
    'Final Event replay cleanup must cancel its transfer'
  );
  perform pg_temp.assert_true(
    (
      select capacity_available
      from public.events_listings
      where item_id = 'a5450000-0000-4000-8000-000000000101'
    ) = 1,
    'Only the confirmed transfer must remain consumed after cleanup'
  );
end;
$capacity_cancel_dispute$;

select jsonb_build_object(
  'contract', 'V1-05.4.5 Event Transfer Authority',
  'authenticated_replay', 'PASS',
  'event_transfers', (
    select count(*)
    from public.event_transfers
    where event_item_id = 'a5450000-0000-4000-8000-000000000101'
  ),
  'confirmed_transfers', (
    select count(*)
    from public.event_transfers
    where event_item_id = 'a5450000-0000-4000-8000-000000000101'
      and status = 'confirmed'
  ),
  'cancelled_transfers', (
    select count(*)
    from public.event_transfers
    where event_item_id = 'a5450000-0000-4000-8000-000000000101'
      and status = 'cancelled'
  ),
  'resolved_transfers', (
    select count(*)
    from public.event_transfers
    where event_item_id = 'a5450000-0000-4000-8000-000000000101'
      and status = 'resolved'
  ),
  'proof_revisions', (
    select count(*)
    from public.event_proofs proof_row
    join public.event_transfers transfer_row
      on transfer_row.id = proof_row.transfer_id
    where transfer_row.event_item_id = 'a5450000-0000-4000-8000-000000000101'
  ),
  'events', (
    select count(*)
    from public.event_transfer_events event_row
    join public.event_transfers transfer_row
      on transfer_row.id = event_row.transfer_id
    where transfer_row.event_item_id = 'a5450000-0000-4000-8000-000000000101'
  ),
  'receipts', (
    select count(*)
    from public.event_transfer_mutation_receipts receipt_row
    join public.event_transfers transfer_row
      on transfer_row.id = receipt_row.transfer_id
    where transfer_row.event_item_id = 'a5450000-0000-4000-8000-000000000101'
  ),
  'capacity_available', (
    select capacity_available
    from public.events_listings
    where item_id = 'a5450000-0000-4000-8000-000000000101'
  ),
  'rollback', true
) as v1_05_4_5_replay_result;

rollback;
