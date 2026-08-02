begin;

set local statement_timeout = '180s';
set local lock_timeout = '10s';

create temporary table pg_temp.v1544_state (
  key text primary key,
  value uuid not null
) on commit drop;

create or replace function pg_temp.assert_true(
  p_condition boolean,
  p_message text
)
returns void
language plpgsql
as $function$
begin
  if coalesce(p_condition, false) is not true then
    raise exception 'V1-05.4.4 replay assertion failed: %', p_message;
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
          'V1-05.4.4 expected SQLSTATE %, received %: %',
          p_expected_state,
          sqlstate,
          sqlerrm;
      end if;

      if p_message_fragment is not null
        and pg_catalog.position(
          pg_catalog.lower(p_message_fragment)
          in pg_catalog.lower(sqlerrm)
        ) = 0
      then
        raise exception
          'V1-05.4.4 expected error containing "%", received: %',
          p_message_fragment,
          sqlerrm;
      end if;

      return;
  end;

  raise exception
    'V1-05.4.4 expected SQLSTATE %, but the statement succeeded.',
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
    'a5440000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'v1544-provider@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5440000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'v1544-recipient@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5440000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'v1544-outsider@example.invalid',
    '',
    clock_timestamp(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a5440000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'v1544-admin@example.invalid',
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
  primary_language,
  created_at,
  updated_at
) values
  (
    'a5440000-0000-4000-8000-000000000001',
    'v1544_provider',
    'user',
    'en',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5440000-0000-4000-8000-000000000002',
    'v1544_recipient',
    'user',
    'en',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5440000-0000-4000-8000-000000000003',
    'v1544_outsider',
    'user',
    'en',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5440000-0000-4000-8000-000000000004',
    'v1544_admin',
    'admin',
    'en',
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
    'a5440000-0000-4000-8000-000000000101',
    'a5440000-0000-4000-8000-000000000001',
    'V1-05.4.4 Service',
    'Deterministic Service fixture for authenticated replay.',
    'services',
    'used_good',
    'active',
    true,
    'service',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5440000-0000-4000-8000-000000000102',
    'a5440000-0000-4000-8000-000000000002',
    'V1-05.4.4 Object 1',
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
    'a5440000-0000-4000-8000-000000000103',
    'a5440000-0000-4000-8000-000000000002',
    'V1-05.4.4 Object 2',
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
    'a5440000-0000-4000-8000-000000000104',
    'a5440000-0000-4000-8000-000000000002',
    'V1-05.4.4 Object 3',
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
    'a5440000-0000-4000-8000-000000000105',
    'a5440000-0000-4000-8000-000000000002',
    'V1-05.4.4 Object 4',
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

insert into public.services_listings (
  id,
  item_id,
  owner_id,
  status,
  category_l1,
  service_name,
  delivery_mode,
  timezone,
  available_date_until,
  max_concurrent_jobs,
  estimated_hours,
  scope_description,
  deliverables,
  milestones,
  created_at,
  updated_at
) values (
  'a5440000-0000-4000-8000-000000000111',
  'a5440000-0000-4000-8000-000000000101',
  'a5440000-0000-4000-8000-000000000001',
  'active',
  'technology',
  'Deterministic implementation service',
  'remote',
  'UTC',
  current_date + 365,
  1,
  2,
  'Discovery report followed by a final implementation accepted by the recipient.',
  array['Discovery report', 'Final implementation'],
  '["Discovery report","Final implementation"]'::jsonb,
  clock_timestamp(),
  clock_timestamp()
);

insert into public.matches (
  id,
  initiator_id,
  target_user_id,
  initiator_item_id,
  target_item_id,
  match_type,
  status,
  created_at,
  updated_at
) values
  (
    'a5440000-0000-4000-8000-000000000201',
    'a5440000-0000-4000-8000-000000000001',
    'a5440000-0000-4000-8000-000000000002',
    'a5440000-0000-4000-8000-000000000101',
    'a5440000-0000-4000-8000-000000000102',
    'manual',
    'accepted',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5440000-0000-4000-8000-000000000202',
    'a5440000-0000-4000-8000-000000000001',
    'a5440000-0000-4000-8000-000000000002',
    'a5440000-0000-4000-8000-000000000101',
    'a5440000-0000-4000-8000-000000000103',
    'manual',
    'accepted',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5440000-0000-4000-8000-000000000203',
    'a5440000-0000-4000-8000-000000000001',
    'a5440000-0000-4000-8000-000000000002',
    'a5440000-0000-4000-8000-000000000101',
    'a5440000-0000-4000-8000-000000000104',
    'manual',
    'accepted',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5440000-0000-4000-8000-000000000204',
    'a5440000-0000-4000-8000-000000000001',
    'a5440000-0000-4000-8000-000000000002',
    'a5440000-0000-4000-8000-000000000101',
    'a5440000-0000-4000-8000-000000000105',
    'manual',
    'accepted',
    clock_timestamp(),
    clock_timestamp()
  );

insert into public.conversations (
  id,
  participant_ids,
  item_ids,
  status,
  agenda_state,
  match_id,
  created_at,
  updated_at
)
select
  fixture.conversation_id,
  array[
    'a5440000-0000-4000-8000-000000000001'::uuid,
    'a5440000-0000-4000-8000-000000000002'::uuid
  ],
  array[
    'a5440000-0000-4000-8000-000000000101'::uuid,
    fixture.object_item_id
  ],
  'active',
  jsonb_build_object(
    'version', 3,
    'conversation_id', fixture.conversation_id,
    'active_stage', 'agreement',
    'completed_stages', '[]'::jsonb
  ),
  fixture.match_id,
  clock_timestamp(),
  clock_timestamp()
from (
  values
    (
      'a5440000-0000-4000-8000-000000000301'::uuid,
      'a5440000-0000-4000-8000-000000000201'::uuid,
      'a5440000-0000-4000-8000-000000000102'::uuid
    ),
    (
      'a5440000-0000-4000-8000-000000000302'::uuid,
      'a5440000-0000-4000-8000-000000000202'::uuid,
      'a5440000-0000-4000-8000-000000000103'::uuid
    ),
    (
      'a5440000-0000-4000-8000-000000000303'::uuid,
      'a5440000-0000-4000-8000-000000000203'::uuid,
      'a5440000-0000-4000-8000-000000000104'::uuid
    ),
    (
      'a5440000-0000-4000-8000-000000000304'::uuid,
      'a5440000-0000-4000-8000-000000000204'::uuid,
      'a5440000-0000-4000-8000-000000000105'::uuid
    )
) as fixture(conversation_id, match_id, object_item_id);

set local session_replication_role = origin;

create or replace function pg_temp.create_service_exchange(
  p_conversation_id uuid,
  p_suffix text
)
returns uuid
language plpgsql
as $function$
declare
  v_provider constant uuid := 'a5440000-0000-4000-8000-000000000001';
  v_recipient constant uuid := 'a5440000-0000-4000-8000-000000000002';
  v_service_item constant uuid := 'a5440000-0000-4000-8000-000000000101';
  v_payload jsonb;
  v_saved jsonb;
  v_saved_replay jsonb;
  v_confirmed jsonb;
  v_exchange jsonb;
  v_exchange_replay jsonb;
  v_swap_id uuid;
begin
  v_payload := jsonb_build_object(
    'condition_notes', 'Service scope reviewed by both participants.',
    'offer_notes', 'Provider supplies the agreed Service for the target Object.',
    'logistics_method', 'other',
    'logistics_notes', 'Remote delivery through the Swaply conversation.',
    'additional_terms', 'Acceptance is milestone-based and remains participant-controlled.',
    'domain_terms', jsonb_build_array(jsonb_build_object(
      'item_id', v_service_item,
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
        'deadline_at', (clock_timestamp() + interval '7 days')::text,
        'milestones', jsonb_build_array(
          'Discovery report',
          'Final implementation'
        ),
        'acceptance_criteria', 'Each milestone must match the frozen Agreement and be explicitly accepted.',
        'no_show_terms', 'A missed deadline may be reported by the recipient with evidence.',
        'cancellation_terms', 'Cancellation follows the canonical Exchange lifecycle.',
        'dispute_terms', 'Unresolved delivery disagreements use the canonical dispute authority.'
      )
    ))
  );

  perform pg_temp.authenticate_as(v_provider);
  v_saved := public.update_match_conversation_agreement_v2(
    p_conversation_id,
    'save',
    0,
    'v1544.save.' || p_suffix,
    v_payload
  );

  perform pg_temp.assert_true(
    (v_saved #>> '{agreement,revision}')::integer = 1,
    'Agreement save must create revision 1 for ' || p_suffix
  );

  v_saved_replay := public.update_match_conversation_agreement_v2(
    p_conversation_id,
    'save',
    0,
    'v1544.save.' || p_suffix,
    v_payload
  );

  perform pg_temp.assert_true(
    v_saved_replay = v_saved,
    'Exact Agreement save replay must return the original receipt for ' || p_suffix
  );

  v_confirmed := public.update_match_conversation_agreement_v2(
    p_conversation_id,
    'confirm',
    1,
    'v1544.confirm.provider.' || p_suffix,
    '{}'::jsonb
  );

  perform pg_temp.authenticate_as(v_recipient);
  v_confirmed := public.update_match_conversation_agreement_v2(
    p_conversation_id,
    'confirm',
    1,
    'v1544.confirm.recipient.' || p_suffix,
    '{}'::jsonb
  );

  perform pg_temp.assert_true(
    jsonb_array_length(v_confirmed #> '{agreement,confirmed_by}') = 2,
    'Both participants must confirm the Agreement for ' || p_suffix
  );
  perform pg_temp.assert_true(
    coalesce(v_confirmed -> 'completed_stages' ? 'agreement', false),
    'Agreement stage must be complete for ' || p_suffix
  );

  perform pg_temp.authenticate_as(v_provider);
  v_exchange := public.create_exchange_from_match_agreement(
    p_conversation_id,
    1
  );
  v_swap_id := (v_exchange ->> 'swap_id')::uuid;

  perform pg_temp.assert_true(
    coalesce((v_exchange ->> 'created')::boolean, false),
    'First Exchange creation must report created=true for ' || p_suffix
  );

  v_exchange_replay := public.create_exchange_from_match_agreement(
    p_conversation_id,
    1
  );

  perform pg_temp.assert_true(
    (v_exchange_replay ->> 'swap_id')::uuid = v_swap_id,
    'Exact Exchange replay must preserve the Exchange ID for ' || p_suffix
  );
  perform pg_temp.assert_true(
    coalesce((v_exchange_replay ->> 'created')::boolean, true) is false,
    'Exact Exchange replay must report created=false for ' || p_suffix
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_deliveries d
      where d.swap_id = v_swap_id
    ) = 1,
    'Exchange must create exactly one Service delivery for ' || p_suffix
  );

  return v_swap_id;
end;
$function$;

do $replay_setup$
declare
  v_swap_id uuid;
  v_delivery_id uuid;
begin
  v_swap_id := pg_temp.create_service_exchange(
    'a5440000-0000-4000-8000-000000000301',
    's1'
  );

  select d.id
  into strict v_delivery_id
  from public.service_deliveries d
  where d.swap_id = v_swap_id;

  insert into pg_temp.v1544_state(key, value) values
    ('s1_swap', v_swap_id),
    ('s1_delivery', v_delivery_id);

  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_milestones m
      where m.delivery_id = v_delivery_id
    ) = 2,
    'Agreement milestones must be frozen into the delivery ledger'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_events e
      where e.delivery_id = v_delivery_id
        and e.event_type = 'created'
    ) = 1,
    'Delivery creation must emit exactly one created event'
  );
end;
$replay_setup$;

select pg_temp.authenticate_as('a5440000-0000-4000-8000-000000000001');
set local role authenticated;

do $participant_rls$
begin
  if (
    select count(*)
    from public.service_deliveries d
    where d.service_item_id = 'a5440000-0000-4000-8000-000000000101'
  ) <> 1 then
    raise exception 'V1-05.4.4 participant RLS did not expose the delivery.';
  end if;

  if (
    select count(*)
    from public.service_delivery_milestones m
    where m.delivery_id in (
      select d.id
      from public.service_deliveries d
      where d.service_item_id = 'a5440000-0000-4000-8000-000000000101'
    )
  ) <> 2 then
    raise exception 'V1-05.4.4 participant RLS did not expose the milestones.';
  end if;

  if (
    select count(*)
    from public.service_delivery_events e
    where e.delivery_id in (
      select d.id
      from public.service_deliveries d
      where d.service_item_id = 'a5440000-0000-4000-8000-000000000101'
    )
  ) <> 1 then
    raise exception 'V1-05.4.4 participant RLS did not expose the event stream.';
  end if;
end;
$participant_rls$;

reset role;
select pg_temp.authenticate_as('a5440000-0000-4000-8000-000000000003');
set local role authenticated;

do $outsider_rls$
begin
  if exists (
    select 1
    from public.service_deliveries d
    where d.service_item_id = 'a5440000-0000-4000-8000-000000000101'
  ) then
    raise exception 'V1-05.4.4 outsider RLS exposed a Service delivery.';
  end if;

  if exists (
    select 1
    from public.service_delivery_milestones m
  ) then
    raise exception 'V1-05.4.4 outsider RLS exposed Service milestones.';
  end if;

  if exists (
    select 1
    from public.service_delivery_events e
  ) then
    raise exception 'V1-05.4.4 outsider RLS exposed Service events.';
  end if;
end;
$outsider_rls$;

reset role;

do $delivery_lifecycle$
declare
  v_provider constant uuid := 'a5440000-0000-4000-8000-000000000001';
  v_recipient constant uuid := 'a5440000-0000-4000-8000-000000000002';
  v_outsider constant uuid := 'a5440000-0000-4000-8000-000000000003';
  v_swap_id uuid;
  v_delivery_id uuid;
  v_result jsonb;
  v_replay jsonb;
begin
  select value into strict v_swap_id
  from pg_temp.v1544_state where key = 's1_swap';

  select value into strict v_delivery_id
  from pg_temp.v1544_state where key = 's1_delivery';

  perform pg_temp.authenticate_as(v_provider);
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'start',
    0,
    null,
    '{}'::jsonb,
    'v1544.start.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'in_progress'
      and (v_result #>> '{delivery,revision}')::bigint = 1,
    'Provider start must advance delivery to in_progress revision 1'
  );
  perform pg_temp.assert_true(
    (select status from public.swaps where id = v_swap_id) = 'in_progress',
    'Starting a Service must advance an accepted Exchange to in_progress'
  );

  v_replay := public.mutate_service_delivery_v1(
    v_delivery_id,
    'start',
    0,
    null,
    '{}'::jsonb,
    'v1544.start.s1'
  );

  perform pg_temp.assert_true(
    coalesce((v_replay ->> 'replayed')::boolean, false),
    'Exact start replay must be marked replayed=true'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_events e
      where e.delivery_id = v_delivery_id
        and e.event_type = 'started'
    ) = 1,
    'Exact start replay must not duplicate the started event'
  );

  perform pg_temp.expect_error(
    format(
      $sql$select public.mutate_service_delivery_v1(%L::uuid, 'start', 0, null, '{"changed":true}'::jsonb, 'v1544.start.s1')$sql$,
      v_delivery_id
    ),
    '23505',
    'Idempotency key'
  );

  perform pg_temp.expect_error(
    format(
      $sql$select public.mutate_service_delivery_v1(%L::uuid, 'submit_milestone', 0, 1, '{"note":"Stale submission","evidence":[]}'::jsonb, 'v1544.stale.s1')$sql$,
      v_delivery_id
    ),
    '40001',
    'Stale Service delivery revision'
  );

  perform pg_temp.authenticate_as(v_outsider);
  perform pg_temp.expect_error(
    format(
      $sql$select public.get_service_deliveries_v1(%L::uuid)$sql$,
      v_swap_id
    ),
    '42501',
    'access denied'
  );
  perform pg_temp.expect_error(
    format(
      $sql$select public.mutate_service_delivery_v1(%L::uuid, 'submit_milestone', 1, 1, '{"note":"Outsider submission","evidence":[]}'::jsonb, 'v1544.outsider.s1')$sql$,
      v_delivery_id
    ),
    '42501',
    'mutation denied'
  );

  perform pg_temp.authenticate_as(v_provider);
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'submit_milestone',
    1,
    1,
    jsonb_build_object(
      'note', 'Discovery report delivered for recipient review.',
      'evidence', jsonb_build_array(jsonb_build_object(
        'type', 'note',
        'reference', 'Discovery report attached to the Swaply conversation.',
        'label', 'Discovery evidence'
      ))
    ),
    'v1544.submit.m1.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'awaiting_acceptance'
      and (v_result #>> '{delivery,revision}')::bigint = 2,
    'First milestone submission must await acceptance at revision 2'
  );

  perform pg_temp.authenticate_as(v_recipient);
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'request_revision',
    2,
    1,
    jsonb_build_object(
      'reason',
      'Add the agreed risk analysis before this milestone can be accepted.'
    ),
    'v1544.revision.m1.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'revision_requested'
      and (v_result #>> '{delivery,revision}')::bigint = 3,
    'Recipient revision request must advance delivery to revision 3'
  );

  perform pg_temp.authenticate_as(v_provider);
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'submit_milestone',
    3,
    1,
    jsonb_build_object(
      'note', 'Revised discovery report now includes the agreed risk analysis.',
      'evidence', jsonb_build_array(jsonb_build_object(
        'type', 'document',
        'reference', 'swaply://evidence/discovery-revision-2',
        'label', 'Revised discovery report'
      ))
    ),
    'v1544.resubmit.m1.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'awaiting_acceptance'
      and (v_result #>> '{delivery,revision}')::bigint = 4,
    'Revised milestone submission must advance delivery to revision 4'
  );

  perform pg_temp.authenticate_as(v_recipient);
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'accept_milestone',
    4,
    1,
    jsonb_build_object('note', 'Discovery milestone accepted.'),
    'v1544.accept.m1.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'in_progress'
      and (v_result #>> '{delivery,revision}')::bigint = 5,
    'Accepting the first milestone must activate the next milestone'
  );

  perform pg_temp.authenticate_as(v_provider);
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'submit_milestone',
    5,
    2,
    jsonb_build_object(
      'note', 'Final implementation delivered according to the frozen Agreement.',
      'evidence', jsonb_build_array(jsonb_build_object(
        'type', 'link',
        'reference', 'https://example.invalid/v1544/final-delivery',
        'label', 'Final delivery'
      ))
    ),
    'v1544.submit.m2.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'awaiting_acceptance'
      and (v_result #>> '{delivery,revision}')::bigint = 6,
    'Final milestone submission must await acceptance at revision 6'
  );

  perform pg_temp.authenticate_as(v_recipient);
  v_result := public.mutate_service_delivery_v1(
    v_delivery_id,
    'accept_milestone',
    6,
    2,
    jsonb_build_object('note', 'Final implementation accepted.'),
    'v1544.accept.m2.s1'
  );

  perform pg_temp.assert_true(
    v_result #>> '{delivery,status}' = 'completed'
      and (v_result #>> '{delivery,revision}')::bigint = 7,
    'Final milestone acceptance must complete delivery at revision 7'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_milestones m
      where m.delivery_id = v_delivery_id
        and m.status = 'accepted'
    ) = 2,
    'Both frozen milestones must be accepted'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_events e
      where e.delivery_id = v_delivery_id
        and e.event_type = 'milestone_submitted'
    ) = 3,
    'Initial, revised and final submissions must produce three submission events'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_events e
      where e.delivery_id = v_delivery_id
        and e.event_type = 'milestone_accepted'
    ) = 2,
    'Two accepted milestones must produce two acceptance events'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_events e
      where e.delivery_id = v_delivery_id
        and e.event_type = 'completed'
    ) = 1,
    'Delivery completion must be emitted exactly once'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.service_delivery_mutation_receipts r
      where r.delivery_id = v_delivery_id
    ) = 7,
    'Exact replay and rejected requests must not duplicate mutation receipts'
  );
end;
$delivery_lifecycle$;

do $capacity_cancel_dispute$
declare
  v_provider constant uuid := 'a5440000-0000-4000-8000-000000000001';
  v_recipient constant uuid := 'a5440000-0000-4000-8000-000000000002';
  v_admin constant uuid := 'a5440000-0000-4000-8000-000000000004';
  v_s2_swap uuid;
  v_s2_delivery uuid;
  v_s3_swap uuid;
  v_s3_delivery uuid;
  v_s4_swap uuid;
  v_s4_delivery uuid;
  v_dispute_id uuid;
  v_report jsonb;
  v_report_replay jsonb;
  v_resolution jsonb;
begin
  v_s2_swap := pg_temp.create_service_exchange(
    'a5440000-0000-4000-8000-000000000302',
    's2'
  );

  select d.id
  into strict v_s2_delivery
  from public.service_deliveries d
  where d.swap_id = v_s2_swap;

  perform pg_temp.expect_error(
    $sql$select pg_temp.create_service_exchange('a5440000-0000-4000-8000-000000000303'::uuid, 's3')$sql$,
    '23P01',
    'capacity is unavailable'
  );

  perform pg_temp.assert_true(
    (
      select c.swap_id is null
        and not (coalesce(c.agenda_state, '{}'::jsonb) ? 'agreement')
      from public.conversations c
      where c.id = 'a5440000-0000-4000-8000-000000000303'
    ),
    'Failed capacity acquisition must leave the next conversation unchanged'
  );

  perform pg_temp.authenticate_as(v_provider);
  perform public.apply_swap_transition_v1(
    v_s2_swap,
    'accepted',
    'cancelled',
    v_provider,
    'service_delivery_replay',
    'v1544.cancel.s2'
  );

  perform pg_temp.assert_true(
    (
      select d.status = 'cancelled'
        and d.closed_at is not null
        and d.close_reason = 'swap_cancelled'
      from public.service_deliveries d
      where d.id = v_s2_delivery
    ),
    'Cancelling the Exchange must close and release the Service delivery'
  );

  v_s3_swap := pg_temp.create_service_exchange(
    'a5440000-0000-4000-8000-000000000303',
    's3'
  );

  select d.id
  into strict v_s3_delivery
  from public.service_deliveries d
  where d.swap_id = v_s3_swap;

  update public.service_deliveries
  set deadline_at = clock_timestamp() - interval '1 minute',
      updated_at = clock_timestamp()
  where id = v_s3_delivery;

  perform pg_temp.authenticate_as(v_recipient);
  v_report := public.mutate_service_delivery_v1(
    v_s3_delivery,
    'report_missed_deadline',
    0,
    null,
    jsonb_build_object(
      'description',
      'The agreed Service deadline passed without an accepted delivery.',
      'evidence', '[]'::jsonb
    ),
    'v1544.deadline.s3'
  );

  perform pg_temp.assert_true(
    v_report #>> '{delivery,status}' = 'disputed',
    'Missed deadline reporting must freeze the delivery as disputed'
  );

  v_report_replay := public.mutate_service_delivery_v1(
    v_s3_delivery,
    'report_missed_deadline',
    0,
    null,
    jsonb_build_object(
      'description',
      'The agreed Service deadline passed without an accepted delivery.',
      'evidence', '[]'::jsonb
    ),
    'v1544.deadline.s3'
  );

  perform pg_temp.assert_true(
    coalesce((v_report_replay ->> 'replayed')::boolean, false),
    'Exact missed-deadline replay must return the original receipt'
  );

  select d.id
  into strict v_dispute_id
  from public.disputes d
  where d.swap_id = v_s3_swap;

  perform pg_temp.assert_true(
    (select status from public.swaps where id = v_s3_swap) = 'disputed',
    'Missed deadline reporting must open the canonical disputed Exchange state'
  );
  perform pg_temp.assert_true(
    (
      select count(*)
      from public.disputes d
      where d.swap_id = v_s3_swap
    ) = 1,
    'Missed deadline replay must not duplicate the dispute'
  );

  perform pg_temp.expect_error(
    $sql$select pg_temp.create_service_exchange('a5440000-0000-4000-8000-000000000304'::uuid, 's4')$sql$,
    '23P01',
    'capacity is unavailable'
  );

  perform pg_temp.authenticate_as(v_admin);
  v_resolution := public.resolve_swap_dispute_v1(
    v_dispute_id,
    'resolved_split',
    'Rollback-only Service delivery replay resolution.',
    'v1544.resolve.s3'
  );

  perform pg_temp.assert_true(
    v_resolution #>> '{dispute,status}' = 'resolved_split',
    'Moderator resolution must close the canonical dispute'
  );
  perform pg_temp.assert_true(
    (
      select d.status = 'resolved'
        and d.closed_at is not null
        and d.close_reason = 'dispute_resolved_split'
      from public.service_deliveries d
      where d.id = v_s3_delivery
    ),
    'Terminal dispute resolution must release Service capacity'
  );

  v_s4_swap := pg_temp.create_service_exchange(
    'a5440000-0000-4000-8000-000000000304',
    's4'
  );

  select d.id
  into strict v_s4_delivery
  from public.service_deliveries d
  where d.swap_id = v_s4_swap;

  perform pg_temp.assert_true(
    (select status from public.service_deliveries where id = v_s4_delivery) = 'pending',
    'A terminally resolved dispute must allow a new pending Service delivery'
  );

  perform pg_temp.authenticate_as(v_provider);
  perform public.apply_swap_transition_v1(
    v_s4_swap,
    'accepted',
    'cancelled',
    v_provider,
    'service_delivery_replay',
    'v1544.cancel.s4'
  );

  perform pg_temp.assert_true(
    (select status from public.service_deliveries where id = v_s4_delivery) = 'cancelled',
    'Final replay cleanup Exchange must release its Service delivery'
  );
end;
$capacity_cancel_dispute$;

select jsonb_build_object(
  'contract', 'V1-05.4.4 Service Delivery Authority',
  'authenticated_replay', 'PASS',
  'service_deliveries', (
    select count(*) from public.service_deliveries
    where service_item_id = 'a5440000-0000-4000-8000-000000000101'
  ),
  'completed_deliveries', (
    select count(*) from public.service_deliveries
    where service_item_id = 'a5440000-0000-4000-8000-000000000101'
      and status = 'completed'
  ),
  'cancelled_deliveries', (
    select count(*) from public.service_deliveries
    where service_item_id = 'a5440000-0000-4000-8000-000000000101'
      and status = 'cancelled'
  ),
  'resolved_deliveries', (
    select count(*) from public.service_deliveries
    where service_item_id = 'a5440000-0000-4000-8000-000000000101'
      and status = 'resolved'
  ),
  'events', (
    select count(*)
    from public.service_delivery_events e
    join public.service_deliveries d on d.id = e.delivery_id
    where d.service_item_id = 'a5440000-0000-4000-8000-000000000101'
  ),
  'receipts', (
    select count(*)
    from public.service_delivery_mutation_receipts r
    join public.service_deliveries d on d.id = r.delivery_id
    where d.service_item_id = 'a5440000-0000-4000-8000-000000000101'
  ),
  'rollback', true
) as v1_05_4_4_replay_result;

rollback;
