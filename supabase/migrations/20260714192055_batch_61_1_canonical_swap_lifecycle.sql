begin;

-- Batch 61.1 establishes one global status vocabulary for Swap/Exchange.
-- Logistics detail and dispute-resolution outcomes remain separate contracts.

alter table public.swaps
  drop constraint if exists swaps_status_check;

alter table public.swaps
  add constraint swaps_status_check
  check (
    status = any (
      array[
        'pending'::text,
        'accepted'::text,
        'in_progress'::text,
        'completed'::text,
        'rejected'::text,
        'cancelled'::text,
        'expired'::text,
        'disputed'::text
      ]
    )
  ) not valid;

alter table public.swaps
  validate constraint swaps_status_check;

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

comment on constraint swaps_status_check on public.swaps is
  'Batch 61.1 canonical global Swap/Exchange statuses.';

comment on function public.validate_swap_status_transition() is
  'Batch 61.1 canonical global Swap/Exchange transition guard.';

commit;
