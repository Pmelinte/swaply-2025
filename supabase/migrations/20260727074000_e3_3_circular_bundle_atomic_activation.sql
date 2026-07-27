begin;

create table if not exists public.swap_item_reservations (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  leg_id uuid not null references public.swap_legs(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  revision integer not null check (revision >= 1),
  state text not null default 'active' check (state in ('active', 'released', 'consumed')),
  created_at timestamptz not null default now(),
  released_at timestamptz,
  unique (swap_id, leg_id, revision)
);

create unique index if not exists swap_item_reservations_one_active_item_idx
  on public.swap_item_reservations (item_id)
  where state = 'active';

alter table public.swap_item_reservations enable row level security;

drop policy if exists swap_item_reservations_participant_select on public.swap_item_reservations;
create policy swap_item_reservations_participant_select
on public.swap_item_reservations
for select
to authenticated
using (public.is_swap_participant(swap_id));

create or replace function public.activate_atomic_exchange(
  target_swap_id uuid,
  expected_revision integer
)
returns table (
  swap_id uuid,
  agreement_revision integer,
  reserved_leg_count integer,
  reserved_item_count integer,
  swap_status text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  actor_id uuid := auth.uid();
  current_swap public.swaps%rowtype;
  required_total integer;
  accepted_total integer;
  active_participant_total integer;
  leg_total integer;
  distinct_item_total integer;
  involved_participant_total integer;
  circular_invalid boolean := false;
  reservation_total integer;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
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

  if current_swap.status = 'in_progress' then
    select count(*)::integer into reservation_total
    from public.swap_item_reservations reservation
    where reservation.swap_id = target_swap_id
      and reservation.revision = expected_revision
      and reservation.state = 'active';

    swap_id := target_swap_id;
    agreement_revision := expected_revision;
    reserved_leg_count := reservation_total;
    reserved_item_count := reservation_total;
    swap_status := current_swap.status;
    return next;
    return;
  end if;

  if current_swap.status <> 'accepted' then
    raise exception 'Exchange must have unanimous accepted status before activation' using errcode = '23514';
  end if;

  if actor_id <> current_swap.requester_id
     and not exists (
       select 1
       from public.swap_participants participant
       where participant.swap_id = target_swap_id
         and participant.user_id = actor_id
         and participant.state = 'active'
         and participant.role = 'proposer'
     ) then
    raise exception 'Only the active proposer can activate the exchange' using errcode = '42501';
  end if;

  select count(*)::integer into required_total
  from public.swap_participants participant
  where participant.swap_id = target_swap_id
    and participant.state = 'active'
    and participant.role <> 'observer';

  select count(distinct acceptance.participant_id)::integer into accepted_total
  from public.swap_revision_acceptances acceptance
  join public.swap_participants participant
    on participant.id = acceptance.participant_id
   and participant.swap_id = acceptance.swap_id
  where acceptance.swap_id = target_swap_id
    and acceptance.revision = expected_revision
    and participant.state = 'active'
    and participant.role <> 'observer';

  if required_total < 2 or accepted_total <> required_total then
    raise exception 'Current revision does not have unanimous consent' using errcode = '23514';
  end if;

  select count(*)::integer into active_participant_total
  from public.swap_participants participant
  where participant.swap_id = target_swap_id
    and participant.state = 'active'
    and participant.role <> 'observer';

  select
    count(*)::integer,
    count(distinct leg.item_id)::integer,
    count(distinct involved.participant_id)::integer
  into leg_total, distinct_item_total, involved_participant_total
  from public.swap_legs leg
  cross join lateral (
    values (leg.from_participant_id), (leg.to_participant_id)
  ) involved(participant_id)
  where leg.swap_id = target_swap_id
    and leg.state = 'draft';

  if leg_total = 0 then
    raise exception 'Exchange requires at least one draft leg' using errcode = '23514';
  end if;

  if distinct_item_total <> leg_total then
    raise exception 'Every leg requires one unique item' using errcode = '23514';
  end if;

  if involved_participant_total <> active_participant_total then
    raise exception 'Every active participant must be involved in the exchange' using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.swap_legs leg
    join public.swap_participants source_participant on source_participant.id = leg.from_participant_id
    join public.swap_participants target_participant on target_participant.id = leg.to_participant_id
    left join public.items item on item.id = leg.item_id
    where leg.swap_id = target_swap_id
      and (
        leg.state <> 'draft'
        or leg.item_id is null
        or source_participant.swap_id <> target_swap_id
        or target_participant.swap_id <> target_swap_id
        or source_participant.state <> 'active'
        or target_participant.state <> 'active'
        or source_participant.role = 'observer'
        or target_participant.role = 'observer'
        or source_participant.id = target_participant.id
        or item.id is null
        or item.owner_id <> source_participant.user_id
        or item.is_active is not true
      )
  ) then
    raise exception 'Exchange legs or items are not activation-safe' using errcode = '23514';
  end if;

  if current_swap.exchange_kind = 'circular' then
    select exists (
      select 1
      from public.swap_participants participant
      where participant.swap_id = target_swap_id
        and participant.state = 'active'
        and participant.role <> 'observer'
        and (
          (select count(*) from public.swap_legs leg where leg.swap_id = target_swap_id and leg.from_participant_id = participant.id) <> 1
          or
          (select count(*) from public.swap_legs leg where leg.swap_id = target_swap_id and leg.to_participant_id = participant.id) <> 1
        )
    ) into circular_invalid;

    if circular_invalid or leg_total <> active_participant_total then
      raise exception 'Circular exchange must form one closed participant cycle' using errcode = '23514';
    end if;
  end if;

  insert into public.swap_item_reservations (swap_id, leg_id, item_id, revision)
  select target_swap_id, leg.id, leg.item_id, expected_revision
  from public.swap_legs leg
  where leg.swap_id = target_swap_id
    and leg.state = 'draft'
  on conflict (swap_id, leg_id, revision) do nothing;

  get diagnostics reservation_total = row_count;

  if reservation_total <> leg_total then
    raise exception 'Atomic reservation could not reserve every exchange leg' using errcode = '23505';
  end if;

  update public.swap_legs
  set state = 'reserved', updated_at = now()
  where swap_legs.swap_id = target_swap_id
    and state = 'draft';

  update public.swaps
  set status = 'in_progress',
      swap_metadata = coalesce(swap_metadata, '{}'::jsonb)
        || jsonb_build_object(
          'atomic_activation_revision', expected_revision,
          'atomic_activated_by', actor_id,
          'atomic_activated_at', now()
        ),
      updated_at = now()
  where id = target_swap_id
    and agreement_revision = expected_revision
    and status = 'accepted';

  swap_id := target_swap_id;
  agreement_revision := expected_revision;
  reserved_leg_count := leg_total;
  reserved_item_count := reservation_total;
  swap_status := 'in_progress';
  return next;
end;
$function$;

revoke all on function public.activate_atomic_exchange(uuid, integer) from public;
grant execute on function public.activate_atomic_exchange(uuid, integer) to authenticated;

comment on table public.swap_item_reservations is
  'E3.3 atomic item reservation evidence for circular and bundle exchanges.';
comment on function public.activate_atomic_exchange(uuid, integer) is
  'E3.3 proposer-only atomic activation. All current-revision consents, legs and items validate and reserve together or the transaction rolls back.';

commit;
