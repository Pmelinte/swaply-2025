begin;

set local statement_timeout = '60s';
set local lock_timeout = '10s';

do $contract$
declare
  v_signature text;
  v_function oid;
  v_private_signature text;
  v_private_function oid;
  v_policy_count integer;
  v_trigger_count integer;
begin
  foreach v_signature in array array[
    'public.express_matching_interest(uuid,uuid,numeric,text)',
    'public.accept_matching_interest(uuid)',
    'public.get_match_agreement_context_v1(uuid)',
    'public.update_match_conversation_agreement_v2(uuid,text,integer,text,jsonb)',
    'public.create_exchange_from_match_agreement(uuid,integer)',
    'public.check_property_period_availability_v1(uuid,uuid,date,date)',
    'public.get_property_reservations_v1(uuid)',
    'public.get_service_deliveries_v1(uuid)',
    'public.mutate_service_delivery_v1(uuid,text,bigint,integer,jsonb,text)',
    'public.get_domain_completion_readiness_v1(uuid)',
    'public.confirm_swap_completion_v1(uuid,text)'
  ]
  loop
    v_function := to_regprocedure(v_signature);

    if v_function is null then
      raise exception 'V1-05.4.7 missing public authority: %', v_signature;
    end if;

    if not pg_catalog.has_function_privilege(
      'authenticated',
      v_function,
      'EXECUTE'
    ) then
      raise exception 'V1-05.4.7 authenticated cannot execute: %', v_signature;
    end if;

    if pg_catalog.has_function_privilege('anon', v_function, 'EXECUTE') then
      raise exception 'V1-05.4.7 anon unexpectedly executes: %', v_signature;
    end if;
  end loop;

  foreach v_private_signature in array array[
    'private.matching_pair_allowed_v1(text,text[],text[],text,text[],text[])',
    'private.validate_match_agreement_domain_terms_v1(uuid,jsonb)',
    'private.reserve_property_periods_on_exchange_v1()',
    'private.create_service_deliveries_on_exchange_v1()',
    'private.domain_completion_readiness_v1(uuid)',
    'private.require_domain_completion_ready_v1(uuid)'
  ]
  loop
    v_private_function := to_regprocedure(v_private_signature);

    if v_private_function is null then
      raise exception 'V1-05.4.7 missing private authority: %', v_private_signature;
    end if;

    if pg_catalog.has_function_privilege(
      'authenticated',
      v_private_function,
      'EXECUTE'
    ) or pg_catalog.has_function_privilege(
      'anon',
      v_private_function,
      'EXECUTE'
    ) then
      raise exception 'V1-05.4.7 private authority is client-executable: %',
        v_private_signature;
    end if;
  end loop;

  if to_regclass('public.matching_interests') is null
    or to_regclass('public.matches') is null
    or to_regclass('public.conversations') is null
    or to_regclass('public.messages') is null
    or to_regclass('public.match_agreement_mutation_receipts') is null
    or to_regclass('public.property_reservations') is null
    or to_regclass('public.service_deliveries') is null
    or to_regclass('public.service_delivery_milestones') is null
    or to_regclass('public.swap_completion_confirmations') is null
    or to_regclass('public.swap_completion_effects') is null
    or to_regclass('public.swap_post_completion_effects') is null
  then
    raise exception 'V1-05.4.7 canonical cross-domain tables are incomplete.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.conversations'::regclass
      and constraint_row.conname = 'conversations_match_id_key'
      and constraint_row.contype = 'u'
  ) then
    raise exception 'V1-05.4.7 canonical Conversation replay constraint is missing.';
  end if;

  select count(*)
  into v_trigger_count
  from pg_catalog.pg_trigger trigger_row
  where not trigger_row.tgisinternal
    and (
      (trigger_row.tgrelid = 'public.swaps'::regclass and trigger_row.tgname in (
        'aaa_reserve_property_periods_v1',
        'aaa_create_service_deliveries_v1',
        'aaa_domain_aware_swap_completion_guard_v1'
      ))
      or (
        trigger_row.tgrelid = 'public.swap_completion_confirmations'::regclass
        and trigger_row.tgname = 'aaa_domain_completion_confirmation_guard_v1'
      )
    );

  if v_trigger_count <> 4 then
    raise exception
      'V1-05.4.7 expected 4 Property/Service/completion triggers, found %.',
      v_trigger_count;
  end if;

  select count(*)
  into v_policy_count
  from pg_catalog.pg_policy policy_row
  where policy_row.polrelid in (
    'public.matching_interests'::regclass,
    'public.matches'::regclass,
    'public.conversations'::regclass,
    'public.messages'::regclass,
    'public.property_reservations'::regclass,
    'public.service_deliveries'::regclass,
    'public.service_delivery_milestones'::regclass
  );

  if v_policy_count < 7 then
    raise exception
      'V1-05.4.7 participant RLS policy coverage is incomplete: %.',
      v_policy_count;
  end if;

  if pg_catalog.has_table_privilege(
    'authenticated',
    'public.property_reservations',
    'INSERT,UPDATE,DELETE'
  ) or pg_catalog.has_table_privilege(
    'authenticated',
    'public.service_deliveries',
    'INSERT,UPDATE,DELETE'
  ) or pg_catalog.has_table_privilege(
    'authenticated',
    'public.service_delivery_mutation_receipts',
    'SELECT,INSERT,UPDATE,DELETE'
  ) or pg_catalog.has_table_privilege(
    'authenticated',
    'public.match_agreement_mutation_receipts',
    'SELECT,INSERT,UPDATE,DELETE'
  ) then
    raise exception 'V1-05.4.7 authenticated has direct ledger write access.';
  end if;
end;
$contract$;

rollback;

select jsonb_build_object(
  'contract', 'V1-05.4.7 Cross-domain E2E',
  'catalog_contract', 'PASS',
  'public_authorities', 11,
  'private_authorities_client_denied', 6,
  'domain_triggers', 4,
  'participant_rls', 'PASS',
  'direct_ledger_writes', 'DENIED',
  'rollback', true
) as result;
