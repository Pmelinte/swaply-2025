begin;

create table if not exists public.swap_authority_events (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  leg_id uuid references public.swap_legs(id) on delete set null,
  participant_id uuid references public.swap_participants(id) on delete set null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  revision integer not null check (revision >= 1),
  action text not null check (action in (
    'cancel_exchange',
    'withdraw_participant',
    'open_leg_dispute',
    'open_exchange_dispute'
  )),
  reason text,
  event_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists swap_authority_events_idempotency_idx
  on public.swap_authority_events (
    swap_id,
    revision,
    actor_id,
    action,
    coalesce(leg_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(participant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

alter table public.swap_authority_events enable row level security;

drop policy if exists swap_authority_events_participant_select on public.swap_authority_events;
create policy swap_authority_events_participant_select
on public.swap_authority_events
for select
to authenticated
using (public.is_swap_participant(swap_id));

create or replace function public.apply_swap_authority_action(
  target_swap_id uuid,
  expected_revision integer,
  authority_action text,
  target_leg_id uuid default null,
  target_participant_id uuid default null,
  authority_reason text default null,
  authority_metadata jsonb default '{}'::jsonb
)
returns table (
  swap_id uuid,
  agreement_revision integer,
  swap_status text,
  released_reservation_count integer,
  affected_leg_count integer,
  affected_participant_count integer,
  idempotent boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  actor_id uuid := auth.uid();
  current_swap public.swaps%rowtype;
  actor_participant public.swap_participants%rowtype;
  target_participant public.swap_participants%rowtype;
  target_leg public.swap_legs%rowtype;
  event_inserted integer := 0;
  released_total integer := 0;
  leg_total integer := 0;
  participant_total integer := 0;
  remaining_participants integer := 0;
  next_status text;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if authority_action not in (
    'cancel_exchange',
    'withdraw_participant',
    'open_leg_dispute',
    'open_exchange_dispute'
  ) then
    raise exception 'Unsupported authority action' using errcode = '22023';
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

  select * into actor_participant
  from public.swap_participants participant
  where participant.swap_id = target_swap_id
    and participant.user_id = actor_id
    and participant.state = 'active'
    and participant.role <> 'observer'
  for update;

  if actor_participant.id is null then
    raise exception 'Only an active participant can use exchange authority' using errcode = '42501';
  end if;

  if current_swap.status = 'completed' then
    raise exception 'Completed exchange is terminal' using errcode = '23514';
  end if;

  if authority_action = 'cancel_exchange' then
    if current_swap.status = 'cancelled' then
      swap_id := target_swap_id;
      agreement_revision := expected_revision;
      swap_status := current_swap.status;
      released_reservation_count := 0;
      affected_leg_count := 0;
      affected_participant_count := 0;
      idempotent := true;
      return next;
      return;
    end if;

    if actor_id <> current_swap.requester_id
       and actor_participant.role <> 'proposer' then
      raise exception 'Only the proposer can cancel the exchange' using errcode = '42501';
    end if;

    if current_swap.status not in ('pending', 'accepted', 'in_progress') then
      raise exception 'Exchange cannot be cancelled in current status' using errcode = '23514';
    end if;

    update public.swap_item_reservations
    set state = 'released', released_at = coalesce(released_at, now())
    where swap_item_reservations.swap_id = target_swap_id
      and state = 'active';
    get diagnostics released_total = row_count;

    update public.swap_legs
    set state = 'cancelled', updated_at = now()
    where swap_legs.swap_id = target_swap_id
      and state not in ('fulfilled', 'cancelled', 'disputed');
    get diagnostics leg_total = row_count;

    next_status := 'cancelled';
  elsif authority_action = 'withdraw_participant' then
    if target_participant_id is null then
      target_participant_id := actor_participant.id;
    end if;

    select * into target_participant
    from public.swap_participants participant
    where participant.id = target_participant_id
      and participant.swap_id = target_swap_id
    for update;

    if target_participant.id is null then
      raise exception 'Participant not found' using errcode = 'P0002';
    end if;

    if target_participant.user_id <> actor_id then
      raise exception 'Participants may only withdraw themselves' using errcode = '42501';
    end if;

    if target_participant.state <> 'active' then
      swap_id := target_swap_id;
      agreement_revision := expected_revision;
      swap_status := current_swap.status;
      released_reservation_count := 0;
      affected_leg_count := 0;
      affected_participant_count := 0;
      idempotent := true;
      return next;
      return;
    end if;

    if current_swap.status not in ('pending', 'accepted') then
      raise exception 'Withdrawal is closed after atomic activation' using errcode = '23514';
    end if;

    update public.swap_participants
    set state = 'withdrawn', updated_at = now()
    where id = target_participant.id;
    participant_total := 1;

    update public.swap_legs
    set state = 'cancelled', updated_at = now()
    where swap_legs.swap_id = target_swap_id
      and state = 'draft'
      and (
        from_participant_id = target_participant.id
        or to_participant_id = target_participant.id
      );
    get diagnostics leg_total = row_count;

    delete from public.swap_revision_acceptances
    where swap_revision_acceptances.swap_id = target_swap_id
      and revision = expected_revision;

    select count(*)::integer into remaining_participants
    from public.swap_participants participant
    where participant.swap_id = target_swap_id
      and participant.state = 'active'
      and participant.role <> 'observer';

    if remaining_participants < 2 then
      next_status := 'cancelled';
    else
      next_status := 'pending';
    end if;

    update public.swaps
    set agreement_revision = agreement_revision + 1,
        updated_at = now()
    where id = target_swap_id
      and agreement_revision = expected_revision;
  elsif authority_action = 'open_leg_dispute' then
    if target_leg_id is null then
      raise exception 'Target leg is required' using errcode = '22023';
    end if;

    select * into target_leg
    from public.swap_legs leg
    where leg.id = target_leg_id
      and leg.swap_id = target_swap_id
    for update;

    if target_leg.id is null then
      raise exception 'Swap leg not found' using errcode = 'P0002';
    end if;

    if target_leg.state = 'disputed' and current_swap.status = 'disputed' then
      swap_id := target_swap_id;
      agreement_revision := expected_revision;
      swap_status := current_swap.status;
      released_reservation_count := 0;
      affected_leg_count := 0;
      affected_participant_count := 0;
      idempotent := true;
      return next;
      return;
    end if;

    if current_swap.status not in ('in_progress', 'disputed') then
      raise exception 'Leg dispute requires active exchange' using errcode = '23514';
    end if;

    if target_leg.state = 'fulfilled' then
      raise exception 'Fulfilled leg requires exchange-level review' using errcode = '23514';
    end if;

    if actor_participant.id not in (target_leg.from_participant_id, target_leg.to_participant_id)
       and actor_participant.role <> 'proposer' then
      raise exception 'Only involved participants or proposer may dispute a leg' using errcode = '42501';
    end if;

    update public.swap_legs
    set state = 'disputed', updated_at = now()
    where id = target_leg.id;
    leg_total := 1;
    next_status := 'disputed';
  else
    if current_swap.status = 'disputed' then
      swap_id := target_swap_id;
      agreement_revision := expected_revision;
      swap_status := current_swap.status;
      released_reservation_count := 0;
      affected_leg_count := 0;
      affected_participant_count := 0;
      idempotent := true;
      return next;
      return;
    end if;

    if current_swap.status not in ('accepted', 'in_progress') then
      raise exception 'Exchange dispute requires committed exchange' using errcode = '23514';
    end if;

    next_status := 'disputed';
  end if;

  insert into public.swap_authority_events (
    swap_id,
    leg_id,
    participant_id,
    actor_id,
    revision,
    action,
    reason,
    event_metadata
  ) values (
    target_swap_id,
    target_leg_id,
    target_participant_id,
    actor_id,
    expected_revision,
    authority_action,
    authority_reason,
    coalesce(authority_metadata, '{}'::jsonb)
  )
  on conflict do nothing;
  get diagnostics event_inserted = row_count;

  if event_inserted = 0 then
    swap_id := target_swap_id;
    agreement_revision := current_swap.agreement_revision;
    swap_status := current_swap.status;
    released_reservation_count := 0;
    affected_leg_count := 0;
    affected_participant_count := 0;
    idempotent := true;
    return next;
    return;
  end if;

  update public.swaps
  set status = next_status,
      swap_metadata = coalesce(swap_metadata, '{}'::jsonb)
        || jsonb_build_object(
          'last_authority_action', authority_action,
          'last_authority_actor', actor_id,
          'last_authority_reason', authority_reason,
          'last_authority_at', now()
        ),
      updated_at = now()
  where id = target_swap_id;

  swap_id := target_swap_id;
  agreement_revision := case
    when authority_action = 'withdraw_participant' then expected_revision + 1
    else expected_revision
  end;
  swap_status := next_status;
  released_reservation_count := released_total;
  affected_leg_count := leg_total;
  affected_participant_count := participant_total;
  idempotent := false;
  return next;
end;
$function$;

revoke all on function public.apply_swap_authority_action(uuid, integer, text, uuid, uuid, text, jsonb) from public;
grant execute on function public.apply_swap_authority_action(uuid, integer, text, uuid, uuid, text, jsonb) to authenticated;

comment on table public.swap_authority_events is
  'E3.5 immutable participant-visible audit trail for cancel, withdrawal and dispute authority.';
comment on function public.apply_swap_authority_action(uuid, integer, text, uuid, uuid, text, jsonb) is
  'E3.5 revision-safe server authority. Cancellation releases only active reservations; disputes freeze progression; withdrawal is self-only before activation.';

commit;
