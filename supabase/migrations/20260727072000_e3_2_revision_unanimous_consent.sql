begin;

create or replace function public.revise_swap_agreement(
  target_swap_id uuid,
  expected_revision integer,
  revision_metadata jsonb default '{}'::jsonb
)
returns table (swap_id uuid, agreement_revision integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  actor_id uuid := auth.uid();
  current_swap public.swaps%rowtype;
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

  if current_swap.status <> 'pending' then
    raise exception 'Agreement can only be revised while pending' using errcode = '23514';
  end if;

  if current_swap.agreement_revision <> expected_revision then
    raise exception 'Stale agreement revision' using errcode = '40001';
  end if;

  if actor_id <> current_swap.requester_id
     and not exists (
       select 1
       from public.swap_participants participant
       where participant.swap_id = target_swap_id
         and participant.user_id = actor_id
         and participant.role = 'proposer'
         and participant.state = 'active'
     ) then
    raise exception 'Only the active proposer can revise the agreement' using errcode = '42501';
  end if;

  update public.swaps
  set agreement_revision = agreement_revision + 1,
      swap_metadata = coalesce(swap_metadata, '{}'::jsonb)
        || jsonb_build_object(
          'last_revision_metadata', coalesce(revision_metadata, '{}'::jsonb),
          'last_revised_by', actor_id,
          'last_revised_at', now()
        ),
      updated_at = now()
  where id = target_swap_id
    and agreement_revision = expected_revision
  returning id, swaps.agreement_revision
  into swap_id, agreement_revision;

  if swap_id is null then
    raise exception 'Stale agreement revision' using errcode = '40001';
  end if;

  return next;
end;
$function$;

create or replace function public.accept_swap_revision(
  target_swap_id uuid,
  expected_revision integer,
  acceptance_metadata jsonb default '{}'::jsonb
)
returns table (
  swap_id uuid,
  agreement_revision integer,
  accepted_count integer,
  required_count integer,
  unanimous boolean,
  swap_status text
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  actor_id uuid := auth.uid();
  current_swap public.swaps%rowtype;
  actor_participant_id uuid;
  accepted_total integer;
  required_total integer;
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

  if current_swap.status not in ('pending', 'accepted') then
    raise exception 'Agreement cannot be accepted in current status' using errcode = '23514';
  end if;

  if current_swap.agreement_revision <> expected_revision then
    raise exception 'Stale agreement revision' using errcode = '40001';
  end if;

  select participant.id into actor_participant_id
  from public.swap_participants participant
  where participant.swap_id = target_swap_id
    and participant.user_id = actor_id
    and participant.state = 'active'
    and participant.role <> 'observer';

  if actor_participant_id is null then
    raise exception 'Only an active participant can accept' using errcode = '42501';
  end if;

  insert into public.swap_revision_acceptances (
    swap_id,
    participant_id,
    revision,
    acceptance_metadata
  ) values (
    target_swap_id,
    actor_participant_id,
    expected_revision,
    coalesce(acceptance_metadata, '{}'::jsonb)
  )
  on conflict (swap_id, participant_id, revision) do nothing;

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

  if required_total >= 2 and accepted_total = required_total and current_swap.status = 'pending' then
    update public.swaps
    set status = 'accepted',
        updated_at = now()
    where id = target_swap_id
      and agreement_revision = expected_revision
      and status = 'pending';
    current_swap.status := 'accepted';
  end if;

  swap_id := target_swap_id;
  agreement_revision := expected_revision;
  accepted_count := accepted_total;
  required_count := required_total;
  unanimous := required_total >= 2 and accepted_total = required_total;
  swap_status := current_swap.status;
  return next;
end;
$function$;

revoke all on function public.revise_swap_agreement(uuid, integer, jsonb) from public;
revoke all on function public.accept_swap_revision(uuid, integer, jsonb) from public;
grant execute on function public.revise_swap_agreement(uuid, integer, jsonb) to authenticated;
grant execute on function public.accept_swap_revision(uuid, integer, jsonb) to authenticated;

comment on function public.revise_swap_agreement(uuid, integer, jsonb) is
  'E3.2 proposer-only CAS revision. Previous acceptances remain immutable but cannot satisfy the new revision.';
comment on function public.accept_swap_revision(uuid, integer, jsonb) is
  'E3.2 participant-only idempotent acceptance. Pending becomes accepted only after unanimous current-revision consent.';

commit;
