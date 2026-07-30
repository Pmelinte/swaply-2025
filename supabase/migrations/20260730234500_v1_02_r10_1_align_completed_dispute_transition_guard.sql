-- V1-02-R10.1 — align the legacy transition trigger with completed -> disputed.
-- Forward-only. Production application requires explicit owner authorisation.

begin;

create or replace function public.validate_swap_status_transition()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public'
as $function$
begin
  if old.status = new.status then
    return new;
  end if;

  if new.status = 'cancelled'
     and coalesce(current_setting('swaply.cancel_authority', true), '') <> 'cancel_swap_v1' then
    raise exception 'Cancellation requires cancel_swap_v1'
      using errcode = '42501';
  end if;

  if new.status = 'disputed'
     and coalesce(current_setting('swaply.dispute_authority', true), '') <> 'open_swap_dispute_v1' then
    raise exception 'Dispute opening requires open_swap_dispute_v1'
      using errcode = '42501';
  end if;

  if coalesce(current_setting('swaply.transition_authority', true), '') <> 'apply_swap_transition_v1' then
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

  if old.status = 'completed'
     and new.status <> 'disputed' then
    raise exception 'Terminal swap status cannot transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  if old.status in ('rejected', 'cancelled', 'expired', 'disputed') then
    raise exception 'Terminal swap status cannot transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

comment on function public.validate_swap_status_transition() is
  'Canonical transition guard. V1-02-R10.1 permits only completed -> disputed when invoked through the canonical dispute and transition authorities; all other terminal transitions remain denied.';

commit;
