-- V1-05.4.4 isolated current-contract fixture.
--
-- This file is test-only. It models only the existing Production contracts that
-- the exact V1-05.4.4 migration depends on. It does not replace repository
-- migration history and it is never applied to Supabase Production.

create schema if not exists extensions;
create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null default 'user'
    check (role in ('user', 'admin', 'moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  condition text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'reserved', 'traded', 'archived')),
  is_active boolean not null default true,
  item_type text not null default 'object'
    check (item_type in ('object', 'property', 'service', 'event')),
  moderation_status text not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services_listings (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null unique references public.items(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'archived')),
  max_concurrent_jobs integer not null default 1
    check (max_concurrent_jobs between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default extensions.gen_random_uuid(),
  participant_ids uuid[] not null,
  item_ids uuid[] not null default '{}'::uuid[],
  status text not null default 'active',
  agenda_state jsonb not null default '{}'::jsonb,
  swap_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.swaps (
  id uuid primary key default extensions.gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete restrict,
  responder_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'accepted'
    check (status in (
      'pending', 'accepted', 'in_progress', 'completed', 'cancelled',
      'rejected', 'expired', 'disputed', 'resolved'
    )),
  conversation_id uuid not null unique
    references public.conversations(id) on delete restrict,
  offered_item_id uuid not null references public.items(id) on delete restrict,
  requested_item_id uuid not null references public.items(id) on delete restrict,
  exchange_kind text not null default 'bilateral'
    check (exchange_kind in ('bilateral', 'multi_user')),
  swap_metadata jsonb not null default '{}'::jsonb,
  agreement_revision integer not null default 1,
  exchange_data jsonb not null default '{}'::jsonb,
  requester_confirmed boolean not null default false,
  responder_confirmed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> responder_id)
);

alter table public.conversations
  add constraint conversations_swap_id_fkey
  foreign key (swap_id) references public.swaps(id) on delete set null;

create table public.swap_events (
  id uuid primary key default extensions.gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  from_status text,
  to_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.disputes (
  id uuid primary key default extensions.gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  initiator_id uuid not null references auth.users(id) on delete restrict,
  reason text not null,
  description text not null,
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'open'
    check (status in (
      'open', 'waiting_evidence', 'under_review',
      'resolved_requester', 'resolved_responder', 'resolved_split', 'rejected'
    )),
  idempotency_key text not null unique,
  resolution_notes text,
  resolution_idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.apply_swap_transition_v1(
  p_swap_id uuid,
  p_expected_status text,
  p_to_status text,
  p_actor_id uuid,
  p_source text,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_swap public.swaps%rowtype;
  v_allowed boolean;
begin
  select s.*
  into v_swap
  from public.swaps s
  where s.id = p_swap_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Swap not found';
  end if;

  if v_swap.status is distinct from p_expected_status then
    raise exception using errcode = '40001', message = format(
      'Stale swap status: expected %s, current %s',
      p_expected_status,
      v_swap.status
    );
  end if;

  if p_actor_id is null
    or p_actor_id not in (v_swap.requester_id, v_swap.responder_id)
  then
    raise exception using errcode = '42501', message = 'Actor is not a swap participant';
  end if;

  v_allowed := case p_expected_status
    when 'pending' then p_to_status in ('accepted', 'rejected', 'cancelled', 'expired')
    when 'accepted' then p_to_status in ('in_progress', 'completed', 'cancelled', 'disputed')
    when 'in_progress' then p_to_status in ('completed', 'cancelled', 'disputed')
    when 'completed' then p_to_status = 'disputed'
    else false
  end;

  if not v_allowed then
    raise exception using errcode = '23514', message = format(
      'Invalid swap transition: %s -> %s',
      p_expected_status,
      p_to_status
    );
  end if;

  update public.swaps
  set status = p_to_status,
      completed_at = case
        when p_to_status = 'completed' then coalesce(completed_at, clock_timestamp())
        else completed_at
      end,
      updated_at = clock_timestamp()
  where id = p_swap_id
  returning * into v_swap;

  insert into public.swap_events (
    swap_id,
    actor_id,
    action,
    from_status,
    to_status,
    metadata
  ) values (
    p_swap_id,
    p_actor_id,
    'status_transition',
    p_expected_status,
    p_to_status,
    jsonb_build_object(
      'authority', 'apply_swap_transition_v1',
      'source', p_source,
      'idempotency_key', p_idempotency_key
    )
  );

  return jsonb_build_object(
    'swap', to_jsonb(v_swap),
    'replayed', false,
    'idempotency_key', p_idempotency_key
  );
end;
$function$;

create or replace function public.open_swap_dispute_v1(
  p_swap_id uuid,
  p_expected_status text,
  p_reason text,
  p_description text,
  p_evidence jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_dispute public.disputes%rowtype;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select d.*
  into v_dispute
  from public.disputes d
  where d.idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object('dispute', to_jsonb(v_dispute), 'replayed', true);
  end if;

  select s.*
  into v_swap
  from public.swaps s
  where s.id = p_swap_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Swap not found.';
  end if;

  if v_actor not in (v_swap.requester_id, v_swap.responder_id) then
    raise exception using errcode = '42501', message = 'Dispute access denied.';
  end if;

  if v_swap.status is distinct from p_expected_status then
    raise exception using errcode = '40001', message = 'Stale swap status.';
  end if;

  if jsonb_typeof(coalesce(p_evidence, '[]'::jsonb)) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'Dispute evidence must be an array.';
  end if;

  insert into public.disputes (
    swap_id,
    initiator_id,
    reason,
    description,
    evidence,
    idempotency_key
  ) values (
    p_swap_id,
    v_actor,
    p_reason,
    p_description,
    coalesce(p_evidence, '[]'::jsonb),
    p_idempotency_key
  )
  returning * into v_dispute;

  perform public.apply_swap_transition_v1(
    p_swap_id,
    p_expected_status,
    'disputed',
    v_actor,
    'open_swap_dispute_v1',
    p_idempotency_key || ':transition'
  );

  return jsonb_build_object(
    'dispute', to_jsonb(v_dispute),
    'replayed', false
  );
end;
$function$;

create or replace function public.resolve_swap_dispute_v1(
  p_dispute_id uuid,
  p_resolution text,
  p_resolution_notes text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_dispute public.disputes%rowtype;
begin
  if v_actor is null
    or not exists (
      select 1
      from public.profiles p
      where p.user_id = v_actor
        and p.role in ('admin', 'moderator')
    )
  then
    raise exception using errcode = '42501', message = 'Moderator access required.';
  end if;

  if p_resolution not in (
    'resolved_requester', 'resolved_responder', 'resolved_split', 'rejected'
  ) then
    raise exception using errcode = '22023', message = 'Invalid dispute resolution.';
  end if;

  select d.*
  into v_dispute
  from public.disputes d
  where d.id = p_dispute_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Dispute not found.';
  end if;

  if v_dispute.resolution_idempotency_key = p_idempotency_key
    and v_dispute.status = p_resolution
  then
    return jsonb_build_object('dispute', to_jsonb(v_dispute), 'replayed', true);
  end if;

  if v_dispute.status not in ('open', 'waiting_evidence', 'under_review') then
    raise exception using errcode = '23514', message = 'Dispute is already terminal.';
  end if;

  update public.disputes
  set status = p_resolution,
      resolution_notes = p_resolution_notes,
      resolution_idempotency_key = p_idempotency_key,
      updated_at = clock_timestamp()
  where id = p_dispute_id
  returning * into v_dispute;

  return jsonb_build_object(
    'dispute', to_jsonb(v_dispute),
    'replayed', false
  );
end;
$function$;

revoke all on function public.apply_swap_transition_v1(uuid, text, text, uuid, text, text)
  from public, anon;
revoke all on function public.open_swap_dispute_v1(uuid, text, text, text, jsonb, text)
  from public, anon;
revoke all on function public.resolve_swap_dispute_v1(uuid, text, text, text)
  from public, anon;

grant execute on function public.apply_swap_transition_v1(uuid, text, text, uuid, text, text)
  to authenticated;
grant execute on function public.open_swap_dispute_v1(uuid, text, text, text, jsonb, text)
  to authenticated;
grant execute on function public.resolve_swap_dispute_v1(uuid, text, text, text)
  to authenticated;
