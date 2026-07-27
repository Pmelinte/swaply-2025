begin;

create table if not exists public.swap_participants (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'participant'
    check (role in ('proposer', 'participant', 'observer')),
  state text not null default 'invited'
    check (state in ('invited', 'active', 'withdrawn', 'removed')),
  position integer not null check (position >= 0),
  joined_revision integer check (joined_revision is null or joined_revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swap_id, user_id),
  unique (swap_id, position)
);

create table if not exists public.swap_legs (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  from_participant_id uuid not null references public.swap_participants(id) on delete cascade,
  to_participant_id uuid not null references public.swap_participants(id) on delete cascade,
  item_id uuid references public.items(id) on delete restrict,
  position integer not null check (position >= 0),
  state text not null default 'draft'
    check (state in ('draft', 'reserved', 'fulfilled', 'cancelled', 'disputed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swap_id, position),
  check (from_participant_id <> to_participant_id)
);

create table if not exists public.swap_revision_acceptances (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  participant_id uuid not null references public.swap_participants(id) on delete cascade,
  revision integer not null check (revision >= 1),
  accepted_at timestamptz not null default now(),
  acceptance_metadata jsonb not null default '{}'::jsonb,
  unique (swap_id, participant_id, revision)
);

alter table public.swaps
  add column if not exists exchange_kind text not null default 'bilateral'
    check (exchange_kind in ('bilateral', 'circular', 'bundle')),
  add column if not exists agreement_revision integer not null default 1
    check (agreement_revision >= 1);

create index if not exists swap_participants_user_swap_idx
  on public.swap_participants (user_id, swap_id);
create index if not exists swap_legs_swap_idx
  on public.swap_legs (swap_id, position);
create index if not exists swap_revision_acceptances_lookup_idx
  on public.swap_revision_acceptances (swap_id, revision, participant_id);

create or replace function public.is_swap_participant(target_swap_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from public.swap_participants participant
    where participant.swap_id = target_swap_id
      and participant.user_id = auth.uid()
      and participant.state in ('invited', 'active')
  )
  or exists (
    select 1
    from public.swaps swap
    where swap.id = target_swap_id
      and auth.uid() in (swap.requester_id, swap.responder_id)
  );
$function$;

revoke all on function public.is_swap_participant(uuid) from public;
grant execute on function public.is_swap_participant(uuid) to authenticated;

alter table public.swap_participants enable row level security;
alter table public.swap_legs enable row level security;
alter table public.swap_revision_acceptances enable row level security;

-- E3.1 deliberately exposes read-only participant views. Creation and mutation
-- remain server/service-role operations until E3.2 adds revision-safe write RPCs.
drop policy if exists swap_participants_participant_select on public.swap_participants;
create policy swap_participants_participant_select
on public.swap_participants
for select
to authenticated
using (public.is_swap_participant(swap_id));

drop policy if exists swap_legs_participant_select on public.swap_legs;
create policy swap_legs_participant_select
on public.swap_legs
for select
to authenticated
using (public.is_swap_participant(swap_id));

drop policy if exists swap_revision_acceptances_participant_select on public.swap_revision_acceptances;
create policy swap_revision_acceptances_participant_select
on public.swap_revision_acceptances
for select
to authenticated
using (public.is_swap_participant(swap_id));

comment on table public.swap_participants is
  'E3.1 additive participant model for bilateral, circular and bundle exchanges.';
comment on table public.swap_legs is
  'E3.1 directed obligations between participants; no automatic reservation or fulfilment.';
comment on table public.swap_revision_acceptances is
  'E3.1 immutable acceptance evidence per participant and agreement revision.';
comment on function public.is_swap_participant(uuid) is
  'Participant-only visibility guard supporting legacy bilateral swaps and E3 multi-user participants.';

commit;
