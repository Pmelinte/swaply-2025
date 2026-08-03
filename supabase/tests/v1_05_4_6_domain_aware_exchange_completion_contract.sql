-- V1-05.4.6 catalog contract.
-- Runs after the exact migration chain in the isolated Supabase stack.

do $contract$
declare
  v_definition text;
begin
  if to_regprocedure('private.domain_completion_readiness_v1(uuid)') is null
    or to_regprocedure('private.require_domain_completion_ready_v1(uuid)') is null
    or to_regprocedure('public.get_domain_completion_readiness_v1(uuid)') is null
    or to_regprocedure('private.guard_domain_completion_confirmation_v1()') is null
    or to_regprocedure('private.guard_domain_aware_swap_completion_v1()') is null
    or to_regprocedure('public.apply_swap_completion_effects_v1(uuid,uuid,text)') is null
  then
    raise exception 'V1-05.4.6 required functions are incomplete.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.swap_completion_confirmations'::regclass
      and trigger_row.tgname = 'aaa_domain_completion_confirmation_guard_v1'
      and not trigger_row.tgisinternal
  ) then
    raise exception 'V1-05.4.6 confirmation guard trigger is missing.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.swaps'::regclass
      and trigger_row.tgname = 'aaa_domain_aware_swap_completion_guard_v1'
      and not trigger_row.tgisinternal
  ) then
    raise exception 'V1-05.4.6 swap completion guard trigger is missing.';
  end if;

  if not pg_catalog.has_function_privilege(
    'authenticated',
    'public.get_domain_completion_readiness_v1(uuid)',
    'EXECUTE'
  )
    or pg_catalog.has_function_privilege(
      'anon',
      'public.get_domain_completion_readiness_v1(uuid)',
      'EXECUTE'
    )
  then
    raise exception 'V1-05.4.6 readiness RPC grants are incorrect.';
  end if;

  if pg_catalog.has_function_privilege(
    'authenticated',
    'public.apply_swap_completion_effects_v1(uuid,uuid,text)',
    'EXECUTE'
  )
    or pg_catalog.has_function_privilege(
      'anon',
      'public.apply_swap_completion_effects_v1(uuid,uuid,text)',
      'EXECUTE'
    )
  then
    raise exception 'V1-05.4.6 structural completion effects are client-executable.';
  end if;

  select pg_catalog.pg_get_functiondef(
    'private.domain_completion_readiness_v1(uuid)'::regprocedure
  ) into v_definition;

  if pg_catalog.strpos(v_definition, 'property_reservations_not_ready') = 0
    or pg_catalog.strpos(v_definition, 'service_deliveries_not_ready') = 0
    or pg_catalog.strpos(v_definition, 'event_transfers_not_ready') = 0
    or pg_catalog.strpos(v_definition, 'domain_aware_match_agreement') = 0
  then
    raise exception 'V1-05.4.6 shared readiness contract is incomplete.';
  end if;

  select pg_catalog.pg_get_functiondef(
    'public.apply_swap_completion_effects_v1(uuid,uuid,text)'::regprocedure
  ) into v_definition;

  if pg_catalog.strpos(v_definition, 'when item_type = ''object'' then ''traded''') = 0
    or pg_catalog.strpos(v_definition, 'reusable_domain_items_preserved') = 0
    or pg_catalog.strpos(v_definition, 'apply_swap_post_completion_effects_v1') = 0
  then
    raise exception 'V1-05.4.6 domain-aware structural effect contract is incomplete.';
  end if;
end;
$contract$;

select jsonb_build_object(
  'contract', 'V1-05.4.6 Domain-aware Exchange Completion',
  'catalog_contract', 'PASS',
  'functions', 6,
  'triggers', 2,
  'participant_readiness_rpc', true,
  'private_structural_effects', true
) as result;
