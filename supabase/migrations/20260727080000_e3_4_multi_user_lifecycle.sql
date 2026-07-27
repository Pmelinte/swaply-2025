begin;

alter table public.swap_legs
  drop constraint if exists swap_legs_state_check;

alter table public.swap_legs
  add constraint swap_legs_state_check
  check (state in (
    'draft',
    'reserved',
    'sender_confirmed',
    'receiver_confirmed',
    'fulfilled',
    'cancelled',
    'disputed'
  ));

create or replace function public.confirm_swap_leg_progress(
  target_swap_id uuid,
  target_leg_id uuid,
  expected_revision integer,
  confirmation_kind text
)
returns table (
  swap_id uuid,
  leg_id uuid,
  leg_state text,
  fulfilled_leg_count integer,
  total_leg_count integer,
  swap_status text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  actor_id uuid := auth.uid();
  current_swap public.swaps%rowtype;
  current_leg public.swap_legs%rowtype;
  source_user_id uuid;
  target_user_id uuid;
  fulfilled_total integer;
  leg_total integer;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if confirmation_kind not in ('sender_confirm', 'receiver_confirm') then
    raise exception 'Unsupported confirmation kind' using errcode = '22023';
  end if;

  select * into current_swap
  from public.swaps
  where id = target_swap_id
  for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if current_swap.agreement_revision <> expected_revision then
    raise exception 'Stale agreement revision' using errcode = '40001';
  end if;

  if current_swap.status <> 'in_progress' then
    raise exception 'Exchange lifecycle is not active' using errcode = '23514';
  end if;

  select leg.*,
         source_participant.user_id,
         target_participant.user_id
  into current_leg, source_user_id, target_user_id
  from public.swap_legs leg
  join public.swap_participants source_participant on source_participant.id = leg.from_participant_id
  join public.swap_participants target_participant on target_participant.id = leg.to_participant_id
  where leg.id = target_leg_id
    and leg.swap_id = target_swap_id
  for update of leg;

  if not found then
    raise exception 'Swap leg not found' using errcode = 'P0002';
  end if;

  if current_leg.state in ('disputed', 'cancelled') then
    raise exception 'Blocked leg cannot progress' using errcode = '23514';
  end if;

  if confirmation_kind = 'sender_confirm' then
    if actor_id <> source_user_id then
      raise exception 'Only the sending participant can confirm dispatch' using errcode = '42501';
    end if;

    if current_leg.state = 'reserved' then
      update public.swap_legs
      set state = 'sender_confirmed', updated_at = now()
      where id = target_leg_id;
      current_leg.state := 'sender_confirmed';
    elsif current_leg.state not in ('sender_confirmed', 'receiver_confirmed', 'fulfilled') then
      raise exception 'Leg is not ready for sender confirmation' using errcode = '23514';
    end if;
  else
    if actor_id <> target_user_id then
      raise exception 'Only the receiving participant can confirm receipt' using errcode = '42501';
    end if;

    if current_leg.state = 'sender_confirmed' then
      update public.swap_legs
      set state = 'fulfilled', updated_at = now()
      where id = target_leg_id;
      current_leg.state := 'fulfilled';

      update public.swap_item_reservations
      set state = 'consumed'
      where swap_item_reservations.swap_id = target_swap_id
        and leg_id = target_leg_id
        and revision = expected_revision
        and state = 'active';
    elsif current_leg.state <> 'fulfilled' then
      raise exception 'Leg is not ready for receiver confirmation' using errcode = '23514';
    end if;
  end if;

  select count(*)::integer,
         count(*) filter (where state = 'fulfilled')::integer
  into leg_total, fulfilled_total
  from public.swap_legs
  where swap_legs.swap_id = target_swap_id;

  if leg_total > 0
     and fulfilled_total = leg_total
     and not exists (
       select 1
       from public.swap_legs leg
       where leg.swap_id = target_swap_id
         and leg.state in ('disputed', 'cancelled')
     ) then
    update public.swaps
    set status = 'completed',
        swap_metadata = coalesce(swap_metadata, '{}'::jsonb)
          || jsonb_build_object(
            'multi_user_completed_revision', expected_revision,
            'multi_user_completed_at', now()
          ),
        completed_at = coalesce(completed_at, now()),
        updated_at = now()
    where id = target_swap_id
      and agreement_revision = expected_revision
      and status = 'in_progress';
    current_swap.status := 'completed';
  end if;

  swap_id := target_swap_id;
  leg_id := target_leg_id;
  leg_state := current_leg.state;
  fulfilled_leg_count := fulfilled_total;
  total_leg_count := leg_total;
  swap_status := current_swap.status;
  return next;
end;
$function$;

revoke all on function public.confirm_swap_leg_progress(uuid, uuid, integer, text) from public;
grant execute on function public.confirm_swap_leg_progress(uuid, uuid, integer, text) to authenticated;

comment on function public.confirm_swap_leg_progress(uuid, uuid, integer, text) is
  'E3.4 participant-scoped, revision-safe lifecycle progression. A swap completes only after every leg is fulfilled and none is blocked.';

commit;
