begin;

-- V1-05.4.4 contract verification.
-- This test is intentionally read-only and always ends with ROLLBACK.
-- For pre-merge compilation, execute the migration body and this assertion body
-- inside the same transaction, then keep the final ROLLBACK.

do $contract$
declare
  v_expected text;
  v_missing text;
  v_definition text;
  v_trigger_definition text;
begin
  -- ---------------------------------------------------------------------------
  -- Canonical tables and critical columns
  -- ---------------------------------------------------------------------------
  foreach v_expected in array array[
    'public.service_deliveries',
    'public.service_delivery_milestones',
    'public.service_delivery_events',
    'public.service_delivery_mutation_receipts'
  ]
  loop
    if to_regclass(v_expected) is null then
      raise exception 'V1-05.4.4 contract failure: missing table %.', v_expected;
    end if;
  end loop;

  select string_agg(
    expected.table_name || '.' || expected.column_name || ':' || expected.udt_name,
    ', '
    order by expected.table_name, expected.column_name
  )
  into v_missing
  from (
    values
      ('service_deliveries', 'id', 'uuid'),
      ('service_deliveries', 'service_item_id', 'uuid'),
      ('service_deliveries', 'swap_id', 'uuid'),
      ('service_deliveries', 'conversation_id', 'uuid'),
      ('service_deliveries', 'provider_id', 'uuid'),
      ('service_deliveries', 'recipient_id', 'uuid'),
      ('service_deliveries', 'agreement_revision', 'int4'),
      ('service_deliveries', 'agreement_hash', 'text'),
      ('service_deliveries', 'delivery_mode', 'text'),
      ('service_deliveries', 'timezone', 'text'),
      ('service_deliveries', 'deliverables', 'jsonb'),
      ('service_deliveries', 'deadline_at', 'timestamptz'),
      ('service_deliveries', 'status', 'text'),
      ('service_deliveries', 'revision', 'int8'),
      ('service_delivery_milestones', 'delivery_id', 'uuid'),
      ('service_delivery_milestones', 'position', 'int4'),
      ('service_delivery_milestones', 'status', 'text'),
      ('service_delivery_milestones', 'submission_revision', 'int4'),
      ('service_delivery_milestones', 'submission_evidence', 'jsonb'),
      ('service_delivery_events', 'delivery_id', 'uuid'),
      ('service_delivery_events', 'swap_id', 'uuid'),
      ('service_delivery_events', 'event_type', 'text'),
      ('service_delivery_events', 'delivery_revision', 'int8'),
      ('service_delivery_events', 'metadata', 'jsonb'),
      ('service_delivery_mutation_receipts', 'actor_id', 'uuid'),
      ('service_delivery_mutation_receipts', 'delivery_id', 'uuid'),
      ('service_delivery_mutation_receipts', 'command', 'text'),
      ('service_delivery_mutation_receipts', 'idempotency_key', 'text'),
      ('service_delivery_mutation_receipts', 'request_hash', 'text'),
      ('service_delivery_mutation_receipts', 'response', 'jsonb')
  ) as expected(table_name, column_name, udt_name)
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = expected.table_name
   and c.column_name = expected.column_name
   and c.udt_name = expected.udt_name
  where c.column_name is null;

  if v_missing is not null then
    raise exception 'V1-05.4.4 contract failure: missing or mistyped columns: %.', v_missing;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.service_deliveries'::regclass
      and constraint_row.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_row.oid)
          = 'UNIQUE (swap_id, service_item_id)'
  ) then
    raise exception 'V1-05.4.4 contract failure: one delivery per Swap and Service is not enforced.';
  end if;

  foreach v_expected in array array[
    'public.service_deliveries_swap_idx',
    'public.service_deliveries_capacity_idx',
    'public.service_delivery_events_delivery_created_idx',
    'public.service_delivery_receipts_created_idx'
  ]
  loop
    if to_regclass(v_expected) is null then
      raise exception 'V1-05.4.4 contract failure: missing index %.', v_expected;
    end if;
  end loop;

  -- ---------------------------------------------------------------------------
  -- RLS and participant-only read policies
  -- ---------------------------------------------------------------------------
  foreach v_expected in array array[
    'service_deliveries',
    'service_delivery_milestones',
    'service_delivery_events',
    'service_delivery_mutation_receipts'
  ]
  loop
    if not exists (
      select 1
      from pg_catalog.pg_class relation_row
      join pg_catalog.pg_namespace namespace_row
        on namespace_row.oid = relation_row.relnamespace
      where namespace_row.nspname = 'public'
        and relation_row.relname = v_expected
        and relation_row.relkind = 'r'
        and relation_row.relrowsecurity
    ) then
      raise exception 'V1-05.4.4 contract failure: RLS is not enabled on public.%.', v_expected;
    end if;
  end loop;

  select string_agg(expected.policy_name, ', ' order by expected.policy_name)
  into v_missing
  from (
    values
      ('service_deliveries_participant_select', 'service_deliveries'),
      ('service_delivery_milestones_participant_select', 'service_delivery_milestones'),
      ('service_delivery_events_participant_select', 'service_delivery_events')
  ) as expected(policy_name, table_name)
  left join pg_catalog.pg_policy policy_row
    on policy_row.polname = expected.policy_name
   and policy_row.polrelid = ('public.' || expected.table_name)::regclass
   and policy_row.polcmd = 'r'
   and 'authenticated'::regrole::oid = any(policy_row.polroles)
  where policy_row.oid is null;

  if v_missing is not null then
    raise exception 'V1-05.4.4 contract failure: missing authenticated SELECT policies: %.', v_missing;
  end if;

  select pg_catalog.pg_get_expr(policy_row.polqual, policy_row.polrelid)
  into v_definition
  from pg_catalog.pg_policy policy_row
  where policy_row.polname = 'service_deliveries_participant_select'
    and policy_row.polrelid = 'public.service_deliveries'::regclass;

  if position('auth.uid()' in coalesce(v_definition, '')) = 0
    or position('provider_id' in coalesce(v_definition, '')) = 0
    or position('recipient_id' in coalesce(v_definition, '')) = 0
  then
    raise exception 'V1-05.4.4 contract failure: Service delivery RLS is not participant-bound.';
  end if;

  foreach v_expected in array array[
    'service_delivery_milestones_participant_select',
    'service_delivery_events_participant_select'
  ]
  loop
    select pg_catalog.pg_get_expr(policy_row.polqual, policy_row.polrelid)
    into v_definition
    from pg_catalog.pg_policy policy_row
    where policy_row.polname = v_expected;

    if position('service_deliveries' in coalesce(v_definition, '')) = 0
      or position('auth.uid()' in coalesce(v_definition, '')) = 0
      or position('provider_id' in coalesce(v_definition, '')) = 0
      or position('recipient_id' in coalesce(v_definition, '')) = 0
    then
      raise exception 'V1-05.4.4 contract failure: policy % is not participant-bound through the delivery ledger.', v_expected;
    end if;
  end loop;

  if exists (
    select 1
    from pg_catalog.pg_policy policy_row
    where policy_row.polrelid = 'public.service_delivery_mutation_receipts'::regclass
  ) then
    raise exception 'V1-05.4.4 contract failure: mutation receipts must not be exposed by an RLS policy.';
  end if;

  -- ---------------------------------------------------------------------------
  -- Least-privilege table grants
  -- ---------------------------------------------------------------------------
  foreach v_expected in array array[
    'public.service_deliveries',
    'public.service_delivery_milestones',
    'public.service_delivery_events'
  ]
  loop
    if not pg_catalog.has_table_privilege('authenticated', v_expected, 'SELECT') then
      raise exception 'V1-05.4.4 contract failure: authenticated SELECT missing on %.', v_expected;
    end if;

    if pg_catalog.has_table_privilege('authenticated', v_expected, 'INSERT')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'UPDATE')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'DELETE')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'TRUNCATE')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'REFERENCES')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'TRIGGER')
      or pg_catalog.has_table_privilege('anon', v_expected, 'SELECT')
      or pg_catalog.has_table_privilege('anon', v_expected, 'INSERT')
      or pg_catalog.has_table_privilege('anon', v_expected, 'UPDATE')
      or pg_catalog.has_table_privilege('anon', v_expected, 'DELETE')
    then
      raise exception 'V1-05.4.4 contract failure: forbidden direct table privilege detected on %.', v_expected;
    end if;
  end loop;

  if pg_catalog.has_table_privilege(
      'authenticated',
      'public.service_delivery_mutation_receipts',
      'SELECT'
    )
    or pg_catalog.has_table_privilege(
      'authenticated',
      'public.service_delivery_mutation_receipts',
      'INSERT'
    )
    or pg_catalog.has_table_privilege(
      'authenticated',
      'public.service_delivery_mutation_receipts',
      'UPDATE'
    )
    or pg_catalog.has_table_privilege(
      'authenticated',
      'public.service_delivery_mutation_receipts',
      'DELETE'
    )
    or pg_catalog.has_table_privilege(
      'authenticated',
      'public.service_delivery_mutation_receipts',
      'TRUNCATE'
    )
    or pg_catalog.has_table_privilege(
      'authenticated',
      'public.service_delivery_mutation_receipts',
      'REFERENCES'
    )
    or pg_catalog.has_table_privilege(
      'authenticated',
      'public.service_delivery_mutation_receipts',
      'TRIGGER'
    )
    or pg_catalog.has_table_privilege(
      'anon',
      'public.service_delivery_mutation_receipts',
      'SELECT'
    )
  then
    raise exception 'V1-05.4.4 contract failure: mutation receipts are directly exposed.';
  end if;

  -- ---------------------------------------------------------------------------
  -- Function inventory, hardening and public RPC grants
  -- ---------------------------------------------------------------------------
  foreach v_expected in array array[
    'private.service_delivery_response_v1(uuid)',
    'public.get_service_deliveries_v1(uuid)',
    'private.validate_service_submission_evidence_v1(jsonb)',
    'private.create_service_deliveries_on_exchange_v1()',
    'private.service_delivery_completion_guard_v1()',
    'private.sync_service_deliveries_from_swap_v1()',
    'private.resolve_service_deliveries_from_dispute_v1()',
    'public.mutate_service_delivery_v1(uuid,text,bigint,integer,jsonb,text)'
  ]
  loop
    if to_regprocedure(v_expected) is null then
      raise exception 'V1-05.4.4 contract failure: missing function %.', v_expected;
    end if;

    if not exists (
      select 1
      from pg_catalog.pg_proc function_row
      where function_row.oid = to_regprocedure(v_expected)
        and exists (
          select 1
          from unnest(coalesce(function_row.proconfig, '{}'::text[])) setting(value)
          where setting.value = 'search_path=pg_catalog, pg_temp'
        )
    ) then
      raise exception 'V1-05.4.4 contract failure: hardened search_path missing on %.', v_expected;
    end if;
  end loop;

  foreach v_expected in array array[
    'private.service_delivery_response_v1(uuid)',
    'public.get_service_deliveries_v1(uuid)',
    'private.create_service_deliveries_on_exchange_v1()',
    'private.service_delivery_completion_guard_v1()',
    'private.sync_service_deliveries_from_swap_v1()',
    'private.resolve_service_deliveries_from_dispute_v1()',
    'public.mutate_service_delivery_v1(uuid,text,bigint,integer,jsonb,text)'
  ]
  loop
    if not (
      select function_row.prosecdef
      from pg_catalog.pg_proc function_row
      where function_row.oid = to_regprocedure(v_expected)
    ) then
      raise exception 'V1-05.4.4 contract failure: SECURITY DEFINER missing on %.', v_expected;
    end if;
  end loop;

  if (
    select function_row.prosecdef
    from pg_catalog.pg_proc function_row
    where function_row.oid = to_regprocedure(
      'private.validate_service_submission_evidence_v1(jsonb)'
    )
  ) then
    raise exception 'V1-05.4.4 contract failure: pure evidence validation must not be SECURITY DEFINER.';
  end if;

  if (
    select function_row.provolatile
    from pg_catalog.pg_proc function_row
    where function_row.oid = to_regprocedure(
      'private.validate_service_submission_evidence_v1(jsonb)'
    )
  ) <> 'i' then
    raise exception 'V1-05.4.4 contract failure: evidence validator must remain IMMUTABLE.';
  end if;

  if (
    select function_row.provolatile
    from pg_catalog.pg_proc function_row
    where function_row.oid = to_regprocedure(
      'private.service_delivery_response_v1(uuid)'
    )
  ) <> 's' then
    raise exception 'V1-05.4.4 contract failure: delivery response reader must remain STABLE.';
  end if;

  foreach v_expected in array array[
    'public.get_service_deliveries_v1(uuid)',
    'public.mutate_service_delivery_v1(uuid,text,bigint,integer,jsonb,text)'
  ]
  loop
    if not pg_catalog.has_function_privilege('authenticated', v_expected, 'EXECUTE') then
      raise exception 'V1-05.4.4 contract failure: authenticated EXECUTE missing on %.', v_expected;
    end if;

    if pg_catalog.has_function_privilege('anon', v_expected, 'EXECUTE') then
      raise exception 'V1-05.4.4 contract failure: anon EXECUTE is forbidden on %.', v_expected;
    end if;
  end loop;

  foreach v_expected in array array[
    'private.service_delivery_response_v1(uuid)',
    'private.validate_service_submission_evidence_v1(jsonb)',
    'private.create_service_deliveries_on_exchange_v1()',
    'private.service_delivery_completion_guard_v1()',
    'private.sync_service_deliveries_from_swap_v1()',
    'private.resolve_service_deliveries_from_dispute_v1()'
  ]
  loop
    if pg_catalog.has_function_privilege('authenticated', v_expected, 'EXECUTE')
      or pg_catalog.has_function_privilege('anon', v_expected, 'EXECUTE')
      or pg_catalog.has_function_privilege('service_role', v_expected, 'EXECUTE')
    then
      raise exception 'V1-05.4.4 contract failure: private function % is externally executable.', v_expected;
    end if;
  end loop;

  -- ---------------------------------------------------------------------------
  -- Function-level authority contracts
  -- ---------------------------------------------------------------------------
  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('private.create_service_deliveries_on_exchange_v1()')
  ));

  foreach v_expected in array array[
    'domain_aware_match_agreement',
    'agreement_hash',
    'pg_advisory_xact_lock',
    'service-delivery-capacity:',
    'max_concurrent_jobs',
    'service_delivery_events',
    'every service in the exchange requires one delivery contract',
    'duplicate service delivery terms are not allowed'
  ]
  loop
    if position(v_expected in v_definition) = 0 then
      raise exception 'V1-05.4.4 contract failure: Exchange-to-delivery authority is missing contract token %.', v_expected;
    end if;
  end loop;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure(
      'public.mutate_service_delivery_v1(uuid,text,bigint,integer,jsonb,text)'
    )
  ));

  foreach v_expected in array array[
    'service-delivery-receipt:',
    'stale service delivery revision',
    'only the service provider may start delivery',
    'only the service provider may submit a milestone',
    'only the service recipient may accept a milestone',
    'only the service recipient may request a revision',
    'only the service recipient may report a missed deadline',
    'service milestones must be delivered in agreement order',
    'apply_swap_transition_v1',
    'open_swap_dispute_v1',
    'replayed'
  ]
  loop
    if position(v_expected in v_definition) = 0 then
      raise exception 'V1-05.4.4 contract failure: mutation authority is missing contract token %.', v_expected;
    end if;
  end loop;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('private.service_delivery_completion_guard_v1()')
  ));
  if position(
      'every service delivery must be accepted before exchange completion'
      in v_definition
    ) = 0
  then
    raise exception 'V1-05.4.4 contract failure: Exchange completion guard is incomplete.';
  end if;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('private.sync_service_deliveries_from_swap_v1()')
  ));
  foreach v_expected in array array[
    'new.status in (''cancelled'', ''rejected'', ''expired'')',
    'new.status = ''disputed''',
    'set status = ''cancelled''',
    'set status = ''disputed'''
  ]
  loop
    if position(v_expected in v_definition) = 0 then
      raise exception 'V1-05.4.4 contract failure: Swap lifecycle sync is missing contract token %.', v_expected;
    end if;
  end loop;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('private.resolve_service_deliveries_from_dispute_v1()')
  ));
  foreach v_expected in array array[
    'new.status in (''resolved_requester'', ''resolved_responder'', ''resolved_split'', ''rejected'')',
    'set status = ''resolved''',
    'close_reason = ''dispute_'' || new.status'
  ]
  loop
    if position(v_expected in v_definition) = 0 then
      raise exception 'V1-05.4.4 contract failure: dispute resolution sync is missing contract token %.', v_expected;
    end if;
  end loop;

  -- ---------------------------------------------------------------------------
  -- Trigger inventory, relation, timing and function binding
  -- ---------------------------------------------------------------------------
  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgname = 'aaa_create_service_deliveries_v1'
      and trigger_row.tgrelid = 'public.swaps'::regclass
      and trigger_row.tgfoid = to_regprocedure(
        'private.create_service_deliveries_on_exchange_v1()'
      )
      and trigger_row.tgtype = 5
      and not trigger_row.tgisinternal
  ) then
    raise exception 'V1-05.4.4 contract failure: AFTER INSERT Service delivery creation trigger is missing or misbound.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgname = 'aaa_service_delivery_completion_guard_v1'
      and trigger_row.tgrelid = 'public.swaps'::regclass
      and trigger_row.tgfoid = to_regprocedure(
        'private.service_delivery_completion_guard_v1()'
      )
      and trigger_row.tgtype = 19
      and not trigger_row.tgisinternal
  ) then
    raise exception 'V1-05.4.4 contract failure: BEFORE UPDATE Exchange completion guard trigger is missing or misbound.';
  end if;

  select lower(pg_catalog.pg_get_triggerdef(trigger_row.oid))
  into v_trigger_definition
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgname = 'aaa_service_delivery_completion_guard_v1'
    and trigger_row.tgrelid = 'public.swaps'::regclass;

  if position('update of status' in coalesce(v_trigger_definition, '')) = 0 then
    raise exception 'V1-05.4.4 contract failure: completion guard must be scoped to Swap status updates.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgname = 'sync_service_deliveries_from_swap_v1'
      and trigger_row.tgrelid = 'public.swaps'::regclass
      and trigger_row.tgfoid = to_regprocedure(
        'private.sync_service_deliveries_from_swap_v1()'
      )
      and trigger_row.tgtype = 17
      and not trigger_row.tgisinternal
  ) then
    raise exception 'V1-05.4.4 contract failure: AFTER UPDATE Swap lifecycle sync trigger is missing or misbound.';
  end if;

  select lower(pg_catalog.pg_get_triggerdef(trigger_row.oid))
  into v_trigger_definition
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgname = 'sync_service_deliveries_from_swap_v1'
    and trigger_row.tgrelid = 'public.swaps'::regclass;

  if position('update of status' in coalesce(v_trigger_definition, '')) = 0 then
    raise exception 'V1-05.4.4 contract failure: lifecycle sync must be scoped to Swap status updates.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgname = 'resolve_service_deliveries_from_dispute_v1'
      and trigger_row.tgrelid = 'public.disputes'::regclass
      and trigger_row.tgfoid = to_regprocedure(
        'private.resolve_service_deliveries_from_dispute_v1()'
      )
      and trigger_row.tgtype = 17
      and not trigger_row.tgisinternal
  ) then
    raise exception 'V1-05.4.4 contract failure: AFTER UPDATE dispute resolution trigger is missing or misbound.';
  end if;

  select lower(pg_catalog.pg_get_triggerdef(trigger_row.oid))
  into v_trigger_definition
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgname = 'resolve_service_deliveries_from_dispute_v1'
    and trigger_row.tgrelid = 'public.disputes'::regclass;

  if position('update of status' in coalesce(v_trigger_definition, '')) = 0 then
    raise exception 'V1-05.4.4 contract failure: dispute resolution sync must be scoped to dispute status updates.';
  end if;

  raise notice 'PASS: V1-05.4.4 Service delivery authority structural contract.';
end;
$contract$;

select 'PASS: V1-05.4.4 Service delivery authority structural contract.'
  as contract_result;

rollback;
