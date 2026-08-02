begin;

-- V1-05.4.5 catalog verification.
-- Run after the migration in an isolated database or inside one rollback-only
-- transaction. This file never commits data or schema changes.
do $contract$
declare
  v_expected text;
  v_missing text;
  v_definition text;
  v_trigger_definition text;
begin
  -- -------------------------------------------------------------------------
  -- Tables, columns, constraints and indexes
  -- -------------------------------------------------------------------------
  foreach v_expected in array array[
    'public.event_transfers',
    'public.event_proofs',
    'public.event_transfer_events',
    'public.event_transfer_mutation_receipts'
  ]
  loop
    if to_regclass(v_expected) is null then
      raise exception 'V1-05.4.5 contract failure: missing table %.', v_expected;
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
      ('event_transfers', 'id', 'uuid'),
      ('event_transfers', 'event_item_id', 'uuid'),
      ('event_transfers', 'swap_id', 'uuid'),
      ('event_transfers', 'conversation_id', 'uuid'),
      ('event_transfers', 'provider_id', 'uuid'),
      ('event_transfers', 'recipient_id', 'uuid'),
      ('event_transfers', 'agreement_revision', 'int4'),
      ('event_transfers', 'agreement_hash', 'text'),
      ('event_transfers', 'quantity', 'int4'),
      ('event_transfers', 'issuer_rule_source', 'text'),
      ('event_transfers', 'transfer_deadline_at', 'timestamptz'),
      ('event_transfers', 'bundle', 'jsonb'),
      ('event_transfers', 'proof_required', 'bool'),
      ('event_transfers', 'transfer_notes', 'text'),
      ('event_transfers', 'status', 'text'),
      ('event_transfers', 'revision', 'int8'),
      ('event_transfers', 'proof_revision', 'int4'),
      ('event_transfers', 'submitted_at', 'timestamptz'),
      ('event_transfers', 'confirmed_at', 'timestamptz'),
      ('event_transfers', 'closed_at', 'timestamptz'),
      ('event_transfers', 'close_reason', 'text'),
      ('event_transfers', 'capacity_released_at', 'timestamptz'),
      ('event_proofs', 'id', 'uuid'),
      ('event_proofs', 'transfer_id', 'uuid'),
      ('event_proofs', 'proof_revision', 'int4'),
      ('event_proofs', 'submitted_by', 'uuid'),
      ('event_proofs', 'note', 'text'),
      ('event_proofs', 'payload', 'jsonb'),
      ('event_proofs', 'payload_digest', 'text'),
      ('event_transfer_events', 'id', 'uuid'),
      ('event_transfer_events', 'transfer_id', 'uuid'),
      ('event_transfer_events', 'swap_id', 'uuid'),
      ('event_transfer_events', 'actor_id', 'uuid'),
      ('event_transfer_events', 'event_type', 'text'),
      ('event_transfer_events', 'transfer_revision', 'int8'),
      ('event_transfer_events', 'proof_revision', 'int4'),
      ('event_transfer_events', 'metadata', 'jsonb'),
      ('event_transfer_mutation_receipts', 'actor_id', 'uuid'),
      ('event_transfer_mutation_receipts', 'transfer_id', 'uuid'),
      ('event_transfer_mutation_receipts', 'command', 'text'),
      ('event_transfer_mutation_receipts', 'idempotency_key', 'text'),
      ('event_transfer_mutation_receipts', 'request_hash', 'text'),
      ('event_transfer_mutation_receipts', 'response', 'jsonb')
  ) as expected(table_name, column_name, udt_name)
  left join information_schema.columns column_row
    on column_row.table_schema = 'public'
   and column_row.table_name = expected.table_name
   and column_row.column_name = expected.column_name
   and column_row.udt_name = expected.udt_name
  where column_row.column_name is null;

  if v_missing is not null then
    raise exception 'V1-05.4.5 contract failure: missing or mistyped columns: %.', v_missing;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.event_transfers'::regclass
      and constraint_row.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_row.oid)
          = 'UNIQUE (swap_id, event_item_id)'
  ) then
    raise exception 'V1-05.4.5 contract failure: one transfer per Swap and Event is not enforced.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.event_proofs'::regclass
      and constraint_row.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_row.oid)
          = 'UNIQUE (transfer_id, proof_revision)'
  ) then
    raise exception 'V1-05.4.5 contract failure: proof revisions are not unique.';
  end if;

  foreach v_expected in array array[
    'public.event_transfers_swap_idx',
    'public.event_transfers_capacity_idx',
    'public.event_transfers_conversation_idx',
    'public.event_transfers_provider_idx',
    'public.event_transfers_recipient_idx',
    'public.event_proofs_transfer_created_idx',
    'public.event_proofs_submitted_by_idx',
    'public.event_transfer_events_transfer_created_idx',
    'public.event_transfer_events_swap_idx',
    'public.event_transfer_events_actor_idx',
    'public.event_transfer_receipts_created_idx'
  ]
  loop
    if to_regclass(v_expected) is null then
      raise exception 'V1-05.4.5 contract failure: missing index %.', v_expected;
    end if;
  end loop;

  -- -------------------------------------------------------------------------
  -- RLS and least privilege
  -- -------------------------------------------------------------------------
  foreach v_expected in array array[
    'event_transfers',
    'event_proofs',
    'event_transfer_events',
    'event_transfer_mutation_receipts'
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
      raise exception 'V1-05.4.5 contract failure: RLS is not enabled on public.%.', v_expected;
    end if;
  end loop;

  select string_agg(expected.policy_name, ', ' order by expected.policy_name)
  into v_missing
  from (
    values
      ('event_transfers_participant_select', 'event_transfers'),
      ('event_transfer_events_participant_select', 'event_transfer_events')
  ) as expected(policy_name, table_name)
  left join pg_catalog.pg_policy policy_row
    on policy_row.polname = expected.policy_name
   and policy_row.polrelid = ('public.' || expected.table_name)::regclass
   and policy_row.polcmd = 'r'
   and 'authenticated'::regrole::oid = any(policy_row.polroles)
  where policy_row.oid is null;

  if v_missing is not null then
    raise exception 'V1-05.4.5 contract failure: missing authenticated SELECT policies: %.', v_missing;
  end if;

  select pg_catalog.pg_get_expr(policy_row.polqual, policy_row.polrelid)
  into v_definition
  from pg_catalog.pg_policy policy_row
  where policy_row.polname = 'event_transfers_participant_select'
    and policy_row.polrelid = 'public.event_transfers'::regclass;

  if pg_catalog.strpos(coalesce(v_definition, ''), 'auth.uid()') = 0
    or pg_catalog.strpos(coalesce(v_definition, ''), 'provider_id') = 0
    or pg_catalog.strpos(coalesce(v_definition, ''), 'recipient_id') = 0
  then
    raise exception 'V1-05.4.5 contract failure: Event transfer RLS is not participant-bound.';
  end if;

  select pg_catalog.pg_get_expr(policy_row.polqual, policy_row.polrelid)
  into v_definition
  from pg_catalog.pg_policy policy_row
  where policy_row.polname = 'event_transfer_events_participant_select'
    and policy_row.polrelid = 'public.event_transfer_events'::regclass;

  if pg_catalog.strpos(coalesce(v_definition, ''), 'event_transfers') = 0
    or pg_catalog.strpos(coalesce(v_definition, ''), 'auth.uid()') = 0
    or pg_catalog.strpos(coalesce(v_definition, ''), 'provider_id') = 0
    or pg_catalog.strpos(coalesce(v_definition, ''), 'recipient_id') = 0
  then
    raise exception 'V1-05.4.5 contract failure: Event ledger RLS is not participant-bound.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_policy policy_row
    where policy_row.polrelid in (
      'public.event_proofs'::regclass,
      'public.event_transfer_mutation_receipts'::regclass
    )
  ) then
    raise exception 'V1-05.4.5 contract failure: private proof or receipts must not have Data API policies.';
  end if;

  foreach v_expected in array array[
    'public.event_transfers',
    'public.event_transfer_events'
  ]
  loop
    if not pg_catalog.has_table_privilege('authenticated', v_expected, 'SELECT') then
      raise exception 'V1-05.4.5 contract failure: authenticated SELECT missing on %.', v_expected;
    end if;

    if pg_catalog.has_table_privilege('authenticated', v_expected, 'INSERT')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'UPDATE')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'DELETE')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'TRUNCATE')
      or pg_catalog.has_table_privilege('anon', v_expected, 'SELECT')
      or pg_catalog.has_table_privilege('anon', v_expected, 'INSERT')
      or pg_catalog.has_table_privilege('anon', v_expected, 'UPDATE')
      or pg_catalog.has_table_privilege('anon', v_expected, 'DELETE')
    then
      raise exception 'V1-05.4.5 contract failure: forbidden direct table privilege detected on %.', v_expected;
    end if;
  end loop;

  foreach v_expected in array array[
    'public.event_proofs',
    'public.event_transfer_mutation_receipts'
  ]
  loop
    if pg_catalog.has_table_privilege('authenticated', v_expected, 'SELECT')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'INSERT')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'UPDATE')
      or pg_catalog.has_table_privilege('authenticated', v_expected, 'DELETE')
      or pg_catalog.has_table_privilege('anon', v_expected, 'SELECT')
      or pg_catalog.has_table_privilege('anon', v_expected, 'INSERT')
      or pg_catalog.has_table_privilege('anon', v_expected, 'UPDATE')
      or pg_catalog.has_table_privilege('anon', v_expected, 'DELETE')
    then
      raise exception 'V1-05.4.5 contract failure: private table % is directly exposed.', v_expected;
    end if;
  end loop;

  -- -------------------------------------------------------------------------
  -- Function inventory and hardening
  -- -------------------------------------------------------------------------
  foreach v_expected in array array[
    'private.event_transfer_response_v1(uuid)',
    'public.get_event_transfers_v1(uuid)',
    'public.get_event_transfer_proof_v1(uuid,integer)',
    'private.validate_event_transfer_proof_v1(jsonb)',
    'private.release_event_transfer_capacity_v1(uuid,text,uuid)',
    'private.create_event_transfers_on_exchange_v1()',
    'private.event_transfer_completion_guard_v1()',
    'private.sync_event_transfers_from_swap_v1()',
    'private.resolve_event_transfers_from_dispute_v1()',
    'public.mutate_event_transfer_v1(uuid,text,bigint,jsonb,text)'
  ]
  loop
    if to_regprocedure(v_expected) is null then
      raise exception 'V1-05.4.5 contract failure: missing function %.', v_expected;
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
      raise exception 'V1-05.4.5 contract failure: hardened search_path missing on %.', v_expected;
    end if;
  end loop;

  foreach v_expected in array array[
    'private.event_transfer_response_v1(uuid)',
    'public.get_event_transfers_v1(uuid)',
    'public.get_event_transfer_proof_v1(uuid,integer)',
    'private.release_event_transfer_capacity_v1(uuid,text,uuid)',
    'private.create_event_transfers_on_exchange_v1()',
    'private.event_transfer_completion_guard_v1()',
    'private.sync_event_transfers_from_swap_v1()',
    'private.resolve_event_transfers_from_dispute_v1()',
    'public.mutate_event_transfer_v1(uuid,text,bigint,jsonb,text)'
  ]
  loop
    if not (
      select function_row.prosecdef
      from pg_catalog.pg_proc function_row
      where function_row.oid = to_regprocedure(v_expected)
    ) then
      raise exception 'V1-05.4.5 contract failure: SECURITY DEFINER missing on %.', v_expected;
    end if;
  end loop;

  if (
    select function_row.prosecdef
    from pg_catalog.pg_proc function_row
    where function_row.oid = to_regprocedure(
      'private.validate_event_transfer_proof_v1(jsonb)'
    )
  ) then
    raise exception 'V1-05.4.5 contract failure: pure proof validation must not be SECURITY DEFINER.';
  end if;

  if (
    select function_row.provolatile
    from pg_catalog.pg_proc function_row
    where function_row.oid = to_regprocedure(
      'private.validate_event_transfer_proof_v1(jsonb)'
    )
  ) <> 'i' then
    raise exception 'V1-05.4.5 contract failure: proof validator must remain IMMUTABLE.';
  end if;

  foreach v_expected in array array[
    'private.event_transfer_response_v1(uuid)',
    'public.get_event_transfer_proof_v1(uuid,integer)'
  ]
  loop
    if (
      select function_row.provolatile
      from pg_catalog.pg_proc function_row
      where function_row.oid = to_regprocedure(v_expected)
    ) <> 's' then
      raise exception 'V1-05.4.5 contract failure: read function % must remain STABLE.', v_expected;
    end if;
  end loop;

  foreach v_expected in array array[
    'public.get_event_transfers_v1(uuid)',
    'public.get_event_transfer_proof_v1(uuid,integer)',
    'public.mutate_event_transfer_v1(uuid,text,bigint,jsonb,text)'
  ]
  loop
    if not pg_catalog.has_function_privilege('authenticated', v_expected, 'EXECUTE') then
      raise exception 'V1-05.4.5 contract failure: authenticated EXECUTE missing on %.', v_expected;
    end if;

    if pg_catalog.has_function_privilege('anon', v_expected, 'EXECUTE') then
      raise exception 'V1-05.4.5 contract failure: anon EXECUTE is forbidden on %.', v_expected;
    end if;
  end loop;

  foreach v_expected in array array[
    'private.event_transfer_response_v1(uuid)',
    'private.validate_event_transfer_proof_v1(jsonb)',
    'private.release_event_transfer_capacity_v1(uuid,text,uuid)',
    'private.create_event_transfers_on_exchange_v1()',
    'private.event_transfer_completion_guard_v1()',
    'private.sync_event_transfers_from_swap_v1()',
    'private.resolve_event_transfers_from_dispute_v1()'
  ]
  loop
    if pg_catalog.has_function_privilege('authenticated', v_expected, 'EXECUTE')
      or pg_catalog.has_function_privilege('anon', v_expected, 'EXECUTE')
      or pg_catalog.has_function_privilege('service_role', v_expected, 'EXECUTE')
    then
      raise exception 'V1-05.4.5 contract failure: private function % is externally executable.', v_expected;
    end if;
  end loop;

  -- -------------------------------------------------------------------------
  -- Trigger inventory
  -- -------------------------------------------------------------------------
  foreach v_expected in array array[
    'aaa_create_event_transfers_v1',
    'aaa_event_transfer_completion_guard_v1',
    'sync_event_transfers_from_swap_v1',
    'resolve_event_transfers_from_dispute_v1'
  ]
  loop
    select pg_catalog.pg_get_triggerdef(trigger_row.oid, true)
    into v_trigger_definition
    from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgname = v_expected
      and not trigger_row.tgisinternal;

    if v_trigger_definition is null then
      raise exception 'V1-05.4.5 contract failure: missing trigger %.', v_expected;
    end if;
  end loop;

  select pg_catalog.pg_get_triggerdef(trigger_row.oid, true)
  into v_trigger_definition
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgname = 'aaa_create_event_transfers_v1'
    and trigger_row.tgrelid = 'public.swaps'::regclass;

  if pg_catalog.strpos(lower(v_trigger_definition), 'after insert') = 0 then
    raise exception 'V1-05.4.5 contract failure: Event transfer creation trigger timing changed.';
  end if;

  select pg_catalog.pg_get_triggerdef(trigger_row.oid, true)
  into v_trigger_definition
  from pg_catalog.pg_trigger trigger_row
  where trigger_row.tgname = 'aaa_event_transfer_completion_guard_v1'
    and trigger_row.tgrelid = 'public.swaps'::regclass;

  if pg_catalog.strpos(lower(v_trigger_definition), 'before update of status') = 0 then
    raise exception 'V1-05.4.5 contract failure: completion guard timing changed.';
  end if;

  -- -------------------------------------------------------------------------
  -- Authority tokens and privacy boundary
  -- -------------------------------------------------------------------------
  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('private.create_event_transfers_on_exchange_v1()')
  ));

  foreach v_expected in array array[
    'domain_aware_match_agreement',
    'agreement_hash',
    'event-transfer-capacity:',
    'pg_advisory_xact_lock',
    'capacity_available',
    'issuer_rule_source',
    'transfer_rule_confirmed',
    'every event in the exchange requires one transfer contract',
    'duplicate event transfer terms are not allowed'
  ]
  loop
    if pg_catalog.strpos(v_definition, v_expected) = 0 then
      raise exception 'V1-05.4.5 contract failure: creation authority is missing token %.', v_expected;
    end if;
  end loop;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('private.event_transfer_response_v1(uuid)')
  ));

  if pg_catalog.strpos(v_definition, '''proof_summary''') = 0
    or pg_catalog.strpos(v_definition, 'proof_count') = 0
    or pg_catalog.strpos(v_definition, '''proof'',') > 0
  then
    raise exception 'V1-05.4.5 contract failure: participant projection leaks raw proof or lacks summary.';
  end if;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('public.get_event_transfer_proof_v1(uuid,integer)')
  ));

  foreach v_expected in array array[
    'event proof access denied',
    'event proof revision is unavailable or stale',
    '''proof'', v_proof.payload',
    'provider_id',
    'recipient_id'
  ]
  loop
    if pg_catalog.strpos(v_definition, v_expected) = 0 then
      raise exception 'V1-05.4.5 contract failure: private proof RPC is missing token %.', v_expected;
    end if;
  end loop;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('public.mutate_event_transfer_v1(uuid,text,bigint,jsonb,text)')
  ));

  foreach v_expected in array array[
    'event-transfer-receipt:',
    'stale event transfer revision',
    'only the event provider may submit transfer proof',
    'only the event recipient may request another transfer proof',
    'only the event recipient may confirm transfer',
    'only the event recipient may report transfer failure',
    'idempotency key already used with another event transfer request',
    'open_swap_dispute_v1',
    'issuer_rejected',
    'fraud_suspected'
  ]
  loop
    if pg_catalog.strpos(v_definition, v_expected) = 0 then
      raise exception 'V1-05.4.5 contract failure: mutation authority is missing token %.', v_expected;
    end if;
  end loop;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('private.event_transfer_completion_guard_v1()')
  ));

  if pg_catalog.strpos(
    v_definition,
    'every event transfer must be confirmed before exchange completion'
  ) = 0 then
    raise exception 'V1-05.4.5 contract failure: Exchange completion gate is absent.';
  end if;

  v_definition := lower(pg_catalog.pg_get_functiondef(
    to_regprocedure('private.release_event_transfer_capacity_v1(uuid,text,uuid)')
  ));

  if pg_catalog.strpos(v_definition, 'confirmed_at is not null') = 0
    or pg_catalog.strpos(v_definition, 'capacity_released_at is not null') = 0
    or pg_catalog.strpos(v_definition, 'capacity_released') = 0
  then
    raise exception 'V1-05.4.5 contract failure: capacity release is not idempotent or preserves no confirmed consumption.';
  end if;
end;
$contract$;

select jsonb_build_object(
  'contract', 'V1-05.4.5 Event Transfer Authority',
  'catalog', 'PASS',
  'rollback', true
) as v1_05_4_5_contract_result;

rollback;
