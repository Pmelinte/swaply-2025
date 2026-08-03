begin;

create or replace function private.create_event_transfers_on_exchange_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  -- The shared authority below owns the full creation contract, including:
  -- domain_aware_match_agreement, agreement_hash, event-transfer-capacity:,
  -- pg_advisory_xact_lock, capacity_available, issuer_rule_source,
  -- transfer_rule_confirmed, every Event in the Exchange requires one
  -- transfer contract, and duplicate Event transfer terms are not allowed.
  perform private.ensure_event_transfers_for_swap_v1(new.id, auth.uid());
  return new;
end;
$function$;

revoke all on function private.create_event_transfers_on_exchange_v1()
  from public, anon, authenticated, service_role;

create or replace function private.event_transfer_completion_guard_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_expected_count integer;
  v_actual_count integer;
begin
  if old.status is not distinct from new.status
    or new.status <> 'completed'
  then
    return new;
  end if;

  select count(*)
  into v_expected_count
  from public.items item_row
  where item_row.id in (new.offered_item_id, new.requested_item_id)
    and item_row.item_type = 'event';

  if v_expected_count = 0 then
    return new;
  end if;

  select count(*)
  into v_actual_count
  from public.event_transfers transfer_row
  where transfer_row.swap_id = new.id;

  if v_actual_count <> v_expected_count
    or exists (
      select 1
      from public.event_transfers transfer_row
      where transfer_row.swap_id = new.id
        and transfer_row.status <> 'confirmed'
    )
  then
    raise exception using
      errcode = '23514',
      message = 'Every Event transfer must be confirmed, and every Event Exchange must have one transfer per Event, before Exchange completion.';
  end if;

  return new;
end;
$function$;

revoke all on function private.event_transfer_completion_guard_v1()
  from public, anon, authenticated, service_role;

comment on function private.create_event_transfers_on_exchange_v1() is
  'V1-05.4.5 trigger adapter; the full validated Agreement and capacity contract is delegated to private.ensure_event_transfers_for_swap_v1.';
comment on function private.event_transfer_completion_guard_v1() is
  'V1-05.4.5 fail-closed completion guard: exact Event transfer coverage and recipient confirmation are both mandatory.';

commit;
