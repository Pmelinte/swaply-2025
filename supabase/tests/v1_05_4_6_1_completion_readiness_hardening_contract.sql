-- V1-05.4.6.1 catalog contract.
-- Runs after the exact V1-05.4.3–V1-05.4.6.1 migration chain.

do $contract$
declare
  v_definition text;
begin
  if to_regprocedure('private.domain_completion_readiness_v1(uuid)') is null then
    raise exception 'V1-05.4.6.1 readiness function is missing.';
  end if;

  select pg_catalog.pg_get_functiondef(
    'private.domain_completion_readiness_v1(uuid)'::regprocedure
  ) into v_definition;

  if pg_catalog.strpos(
      v_definition,
      'coalesce(v_swap.agreement_revision, 0) < 1'
    ) = 0
    or pg_catalog.strpos(
      v_definition,
      'v_swap.exchange_kind IS DISTINCT FROM ''bilateral'''
    ) = 0
    or pg_catalog.strpos(v_definition, 'LEFT JOIN public.items term_item') = 0
    or pg_catalog.strpos(v_definition, 'term_item.item_type::text') = 0
    or pg_catalog.strpos(
      v_definition,
      'IS DISTINCT FROM (term.value ->> ''domain''::text)'
    ) = 0
  then
    raise exception 'V1-05.4.6.1 fail-closed readiness hardening is incomplete.';
  end if;

  if pg_catalog.has_function_privilege(
    'authenticated',
    'private.domain_completion_readiness_v1(uuid)',
    'EXECUTE'
  )
    or pg_catalog.has_function_privilege(
      'anon',
      'private.domain_completion_readiness_v1(uuid)',
      'EXECUTE'
    )
  then
    raise exception 'V1-05.4.6.1 private readiness authority became client-executable.';
  end if;
end;
$contract$;

select jsonb_build_object(
  'contract', 'V1-05.4.6.1 Completion Readiness Hardening',
  'catalog_contract', 'PASS',
  'null_revision_fail_closed', true,
  'domain_item_type_alignment', true,
  'private_authority', true
) as result;
