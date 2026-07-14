begin;

-- A parallel Batch 61.2 migration was applied while PR #462 was being
-- validated. Reconcile Production to one authority without data changes.

-- Remove the disabled/redundant guard and the service-role-only function that
-- targets a different idempotency schema and the absent swap_bundles table.
drop trigger if exists aaa_require_swap_transition_authority on public.swaps;
drop function if exists public.require_swap_transition_authority();
drop function if exists public.transition_swap_status_authoritative(
  uuid,
  uuid,
  text,
  text,
  text
);
drop table if exists public.swap_transition_authority_config;

-- Keep the useful identity boundary explicitly as part of the final contract.
create or replace function public.require_swap_identity_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if old.requester_id is distinct from new.requester_id
     or old.responder_id is distinct from new.responder_id
     or old.offered_item_id is distinct from new.offered_item_id
     or old.requested_item_id is distinct from new.requested_item_id then
    raise exception 'Swap participant and item identity is immutable'
      using
        errcode = '42501',
        detail = 'SWAP_IDENTITY_IMMUTABLE';
  end if;

  return new;
end;
$function$;

revoke execute on function public.require_swap_identity_immutable()
  from public, anon, authenticated;

drop trigger if exists aab_require_swap_identity_immutable on public.swaps;
create trigger aab_require_swap_identity_immutable
  before update of requester_id, responder_id, offered_item_id, requested_item_id
  on public.swaps
  for each row
  execute function public.require_swap_identity_immutable();

-- Preserve the safe proposal-entry invariant explicitly.
drop policy if exists insert_own_swaps on public.swaps;
create policy insert_own_swaps on public.swaps
  for insert to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
  );

comment on table public.swap_transition_requests is
  'Batch 61.2 private idempotency registry for transition_swap_v1.';
comment on function public.require_swap_identity_immutable() is
  'Batch 61.2 guard freezing requester, responder and item identity after Swap creation.';

commit;
