begin;

-- Temporary compatibility bridge: legacy authenticated clients that still issue
-- UPDATE swaps SET status=... are intercepted and routed through the same
-- atomic transition primitive. New code must call transition_swap_v1 directly.

create or replace function public.validate_swap_status_transition()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if old.status = new.status then
    return new;
  end if;

  if coalesce(current_setting('swaply.transition_authority', true), '')
     <> 'apply_swap_transition_v1' then
    if auth.uid() is null then
      raise exception 'Direct privileged swap status updates are forbidden'
        using errcode = '42501';
    end if;

    perform public.apply_swap_transition_v1(
      old.id,
      old.status,
      new.status,
      auth.uid(),
      'direct_update_compat',
      null
    );

    -- Do not let the original UPDATE write the row a second time. Reset the
    -- transaction-local marker so every row in a multi-row statement is routed.
    perform set_config('swaply.transition_authority', '', true);
    return null;
  end if;

  if old.status = 'pending'
     and new.status not in ('accepted', 'rejected', 'cancelled', 'expired') then
    raise exception 'Invalid swap transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  if old.status = 'accepted'
     and new.status not in ('in_progress', 'completed', 'cancelled', 'disputed') then
    raise exception 'Invalid swap transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  if old.status = 'in_progress'
     and new.status not in ('completed', 'cancelled', 'disputed') then
    raise exception 'Invalid swap transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  if old.status in ('completed', 'rejected', 'cancelled', 'expired', 'disputed') then
    raise exception 'Terminal swap status cannot transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

comment on function public.validate_swap_status_transition() is
  'Batch 61.2 guard: canonical RPC writes are allowed; legacy authenticated direct writes are routed through the same authority.';

commit;
