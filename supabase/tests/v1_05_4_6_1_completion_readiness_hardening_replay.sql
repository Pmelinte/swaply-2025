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
    raise exception 'V1-05.4.6.1 replay assertion failed: %', p_message;
  end if;
end;
$function$;

set local session_replication_role = replica;

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
    'a5461000-0000-4000-8000-000000000101',
    'a5461000-0000-4000-8000-000000000001',
    'NULL revision Property',
    'Rollback-only readiness hardening fixture.',
    'fixture',
    'used',
    'active',
    true,
    'property',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5461000-0000-4000-8000-000000000102',
    'a5461000-0000-4000-8000-000000000002',
    'NULL revision Object',
    'Rollback-only readiness hardening fixture.',
    'fixture',
    'used',
    'active',
    true,
    'object',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5461000-0000-4000-8000-000000000103',
    'a5461000-0000-4000-8000-000000000001',
    'Domain mismatch Property',
    'Rollback-only readiness hardening fixture.',
    'fixture',
    'used',
    'active',
    true,
    'property',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5461000-0000-4000-8000-000000000104',
    'a5461000-0000-4000-8000-000000000002',
    'Domain mismatch Service',
    'Rollback-only readiness hardening fixture.',
    'fixture',
    'used',
    'active',
    true,
    'service',
    'approved',
    clock_timestamp(),
    clock_timestamp()
  );

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
  (
    'a5461000-0000-4000-8000-000000000401',
    'a5461000-0000-4000-8000-000000000001',
    'a5461000-0000-4000-8000-000000000002',
    'in_progress',
    'a5461000-0000-4000-8000-000000000301',
    'a5461000-0000-4000-8000-000000000101',
    'a5461000-0000-4000-8000-000000000102',
    'bilateral',
    jsonb_build_object(
      'source', 'domain_aware_match_agreement',
      'agreement_hash', repeat('a', 64)
    ),
    null,
    jsonb_build_object(
      'domain_terms',
      jsonb_build_array(jsonb_build_object(
        'item_id', 'a5461000-0000-4000-8000-000000000101',
        'domain', 'property',
        'terms', '{}'::jsonb
      ))
    ),
    false,
    false,
    '{}'::uuid[],
    clock_timestamp(),
    clock_timestamp()
  ),
  (
    'a5461000-0000-4000-8000-000000000402',
    'a5461000-0000-4000-8000-000000000001',
    'a5461000-0000-4000-8000-000000000002',
    'in_progress',
    'a5461000-0000-4000-8000-000000000302',
    'a5461000-0000-4000-8000-000000000103',
    'a5461000-0000-4000-8000-000000000104',
    'bilateral',
    jsonb_build_object(
      'source', 'domain_aware_match_agreement',
      'agreement_hash', repeat('b', 64)
    ),
    1,
    jsonb_build_object(
      'domain_terms',
      jsonb_build_array(
        jsonb_build_object(
          'item_id', 'a5461000-0000-4000-8000-000000000103',
          'domain', 'service',
          'terms', '{}'::jsonb
        ),
        jsonb_build_object(
          'item_id', 'a5461000-0000-4000-8000-000000000104',
          'domain', 'property',
          'terms', '{}'::jsonb
        )
      )
    ),
    false,
    false,
    '{}'::uuid[],
    clock_timestamp(),
    clock_timestamp()
  );

set local session_replication_role = origin;

do $replay$
declare
  v_null_revision jsonb;
  v_domain_mismatch jsonb;
begin
  v_null_revision := private.domain_completion_readiness_v1(
    'a5461000-0000-4000-8000-000000000401'
  );

  perform pg_temp.assert_true(
    coalesce((v_null_revision ->> 'ready')::boolean, true) is false,
    'a NULL Agreement revision must not be ready'
  );
  perform pg_temp.assert_true(
    coalesce((v_null_revision ->> 'domain_aware')::boolean, true) is false,
    'a NULL Agreement revision must not be domain-aware'
  );
  perform pg_temp.assert_true(
    (v_null_revision -> 'blocked_by') ? 'domain_agreement_required',
    'a NULL Agreement revision must emit domain_agreement_required'
  );

  v_domain_mismatch := private.domain_completion_readiness_v1(
    'a5461000-0000-4000-8000-000000000402'
  );

  perform pg_temp.assert_true(
    coalesce((v_domain_mismatch ->> 'ready')::boolean, true) is false,
    'swapped Property/Service domains must not be ready'
  );
  perform pg_temp.assert_true(
    coalesce((v_domain_mismatch ->> 'domain_aware')::boolean, true) is false,
    'swapped Property/Service domains must invalidate the domain contract'
  );
  perform pg_temp.assert_true(
    (v_domain_mismatch -> 'blocked_by') ? 'domain_terms_mismatch',
    'a domain/item-type mismatch must emit domain_terms_mismatch'
  );
end;
$replay$;

rollback;

select jsonb_build_object(
  'contract', 'V1-05.4.6.1 Completion Readiness Hardening',
  'null_revision_fail_closed', 'PASS',
  'domain_item_type_alignment', 'PASS',
  'rollback', true
) as result;
