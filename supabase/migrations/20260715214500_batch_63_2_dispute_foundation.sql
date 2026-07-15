begin;
-- Batch 63.2: canonical participant dispute authority.
-- A global Swap becomes terminal `disputed`; dispute investigation and outcome
-- remain local to the canonical disputes table.

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  initiator_id uuid not null references auth.users(id) on delete restrict,
  respondent_id uuid not null references auth.users(id) on delete restrict,
  opened_from_status text not null,
  reason text not null,
  description text not null,
  status text not null default 'open',
  resolution_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reconcile the historical repository-only dispute foundation when this
-- migration is applied to an environment where that table already exists.
alter table public.disputes add column if not exists opened_from_status text;
alter table public.disputes add column if not exists updated_at timestamptz default now();
update public.disputes
   set opened_from_status = coalesce(opened_from_status, 'accepted'),
       description = coalesce(description, reason, 'Legacy dispute'),
       updated_at = coalesce(updated_at, created_at, now())
 where opened_from_status is null
    or description is null
    or updated_at is null;
alter table public.disputes alter column swap_id set not null;
alter table public.disputes alter column initiator_id set not null;
alter table public.disputes alter column respondent_id set not null;
alter table public.disputes alter column opened_from_status set not null;
alter table public.disputes alter column description set not null;
alter table public.disputes alter column status set not null;
alter table public.disputes alter column created_at set not null;
alter table public.disputes alter column updated_at set not null;

alter table public.disputes drop constraint if exists disputes_status_check;
alter table public.disputes drop constraint if exists disputes_opened_from_status_check;
alter table public.disputes drop constraint if exists disputes_reason_check;
alter table public.disputes drop constraint if exists disputes_description_check;
alter table public.disputes drop constraint if exists disputes_resolution_notes_check;
alter table public.disputes add constraint disputes_status_check check (
  status in (
    'open',
    'waiting_evidence',
    'under_review',
    'resolved_requester',
    'resolved_responder',
    'resolved_split',
    'rejected'
  )
);
alter table public.disputes add constraint disputes_opened_from_status_check
  check (opened_from_status in ('accepted', 'in_progress'));
alter table public.disputes add constraint disputes_reason_check check (
  reason in (
    'item_not_received',
    'wrong_item',
    'damaged',
    'condition_mismatch',
    'no_show',
    'other'
  )
);
alter table public.disputes add constraint disputes_description_check
  check (char_length(description) between 10 and 2000);
alter table public.disputes add constraint disputes_resolution_notes_check
  check (resolution_notes is null or char_length(resolution_notes) between 3 and 2000);

create unique index if not exists disputes_swap_unique_idx
  on public.disputes (swap_id);
create index if not exists disputes_participants_created_idx
  on public.disputes (initiator_id, respondent_id, created_at desc);
create index if not exists disputes_status_created_idx
  on public.disputes (status, created_at desc);

create table if not exists public.dispute_evidence (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  evidence_type text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.dispute_evidence alter column dispute_id set not null;
alter table public.dispute_evidence alter column submitted_by set not null;
alter table public.dispute_evidence alter column evidence_type set not null;
alter table public.dispute_evidence alter column content set not null;
alter table public.dispute_evidence alter column created_at set not null;
alter table public.dispute_evidence drop constraint if exists dispute_evidence_evidence_type_check;
alter table public.dispute_evidence drop constraint if exists dispute_evidence_content_check;
alter table public.dispute_evidence add constraint dispute_evidence_evidence_type_check check (
  evidence_type in (
    'photo',
    'chat_screenshot',
    'tracking',
    'meeting_code',
    'location_proof',
    'note'
  )
);
alter table public.dispute_evidence add constraint dispute_evidence_content_check
  check (char_length(content) between 1 and 2000);
create index if not exists dispute_evidence_dispute_created_idx
  on public.dispute_evidence (dispute_id, created_at);

create table if not exists public.swap_dispute_requests (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references public.swaps(id) on delete cascade,
  dispute_id uuid references public.disputes(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  command text not null,
  idempotency_key text not null,
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  constraint swap_dispute_requests_actor_key_unique
    unique (actor_id, idempotency_key),
  constraint swap_dispute_requests_command_check
    check (command in ('open', 'evidence', 'resolve')),
  constraint swap_dispute_requests_key_length
    check (char_length(idempotency_key) between 8 and 240)
);
create index if not exists swap_dispute_requests_swap_created_idx
  on public.swap_dispute_requests (swap_id, created_at desc);

create table if not exists public.swap_dispute_effects (
  swap_id uuid primary key references public.swaps(id) on delete cascade,
  dispute_id uuid not null unique references public.disputes(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete restrict,
  from_status text not null check (from_status in ('accepted', 'in_progress')),
  evidence_count integer not null default 0 check (evidence_count between 0 and 10),
  idempotency_key text not null,
  applied_at timestamptz not null default now()
);

create table if not exists public.swap_dispute_resolution_effects (
  dispute_id uuid primary key references public.disputes(id) on delete cascade,
  swap_id uuid not null unique references public.swaps(id) on delete cascade,
  resolved_by uuid not null references auth.users(id) on delete restrict,
  resolution text not null check (
    resolution in (
      'resolved_requester',
      'resolved_responder',
      'resolved_split',
      'rejected'
    )
  ),
  penalized_user_id uuid references auth.users(id) on delete restrict,
  penalty_counted boolean not null default false,
  reactivated_item_count integer not null default 0
    check (reactivated_item_count between 0 and 2),
  idempotency_key text not null,
  applied_at timestamptz not null default now()
);

alter table public.disputes enable row level security;
alter table public.dispute_evidence enable row level security;
alter table public.swap_dispute_requests enable row level security;
alter table public.swap_dispute_effects enable row level security;
alter table public.swap_dispute_resolution_effects enable row level security;

drop policy if exists disputes_select on public.disputes;
drop policy if exists disputes_insert on public.disputes;
drop policy if exists disputes_update on public.disputes;
drop policy if exists disputes_select_participants on public.disputes;
create policy disputes_select_participants on public.disputes
  for select to authenticated
  using (
    (select auth.uid()) in (initiator_id, respondent_id)
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('admin', 'moderator')
    )
  );

drop policy if exists evidence_select on public.dispute_evidence;
drop policy if exists evidence_insert on public.dispute_evidence;
drop policy if exists dispute_evidence_select_participants on public.dispute_evidence;
create policy dispute_evidence_select_participants on public.dispute_evidence
  for select to authenticated
  using (
    exists (
      select 1
      from public.disputes d
      where d.id = dispute_id
        and (
          (select auth.uid()) in (d.initiator_id, d.respondent_id)
          or exists (
            select 1
            from public.profiles p
            where p.user_id = (select auth.uid())
              and p.role in ('admin', 'moderator')
          )
        )
    )
  );

revoke all on table public.disputes from public, anon, authenticated;
revoke all on table public.dispute_evidence from public, anon, authenticated;
grant select on table public.disputes to authenticated;
grant select on table public.dispute_evidence to authenticated;
grant all on table public.disputes to service_role;
grant all on table public.dispute_evidence to service_role;

revoke all on table public.swap_dispute_requests
  from public, anon, authenticated;
revoke all on table public.swap_dispute_effects
  from public, anon, authenticated;
revoke all on table public.swap_dispute_resolution_effects
  from public, anon, authenticated;
grant all on table public.swap_dispute_requests to service_role;
grant all on table public.swap_dispute_effects to service_role;
grant all on table public.swap_dispute_resolution_effects to service_role;

create or replace function public.require_dispute_row_authority()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if tg_op = 'INSERT'
     and coalesce(current_setting('swaply.dispute_authority', true), '')
       <> 'open_swap_dispute_v1' then
    raise exception 'Direct dispute creation is forbidden'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE'
     and coalesce(current_setting('swaply.dispute_authority', true), '')
       not in (
         'add_swap_dispute_evidence_v1',
         'resolve_swap_dispute_v1'
       ) then
    raise exception 'Direct dispute updates are forbidden'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;
revoke execute on function public.require_dispute_row_authority()
  from public, anon, authenticated;
drop trigger if exists require_dispute_row_authority_trigger on public.disputes;
create trigger require_dispute_row_authority_trigger
  before insert or update on public.disputes
  for each row execute function public.require_dispute_row_authority();

create or replace function public.require_dispute_evidence_authority()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if coalesce(current_setting('swaply.dispute_authority', true), '')
     not in ('open_swap_dispute_v1', 'add_swap_dispute_evidence_v1') then
    raise exception 'Direct dispute evidence writes are forbidden'
      using errcode = '42501';
  end if;
  return new;
end;
$function$;
revoke execute on function public.require_dispute_evidence_authority()
  from public, anon, authenticated;
drop trigger if exists require_dispute_evidence_authority_trigger
  on public.dispute_evidence;
create trigger require_dispute_evidence_authority_trigger
  before insert or update on public.dispute_evidence
  for each row execute function public.require_dispute_evidence_authority();

create or replace function public.require_swap_dispute_snapshot_authority()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if old.dispute is not distinct from new.dispute then
    return new;
  end if;

  if coalesce(current_setting('swaply.dispute_authority', true), '')
     not in (
       'open_swap_dispute_v1',
       'add_swap_dispute_evidence_v1',
       'resolve_swap_dispute_v1'
     ) then
    raise exception 'Direct Swap dispute snapshot updates are forbidden'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;
revoke execute on function public.require_swap_dispute_snapshot_authority()
  from public, anon, authenticated;
drop trigger if exists require_swap_dispute_snapshot_authority_trigger
  on public.swaps;
create trigger require_swap_dispute_snapshot_authority_trigger
  before update of dispute on public.swaps
  for each row execute function public.require_swap_dispute_snapshot_authority();

-- Completion confirmations may be cleared by bilateral completion, cancellation,
-- or the canonical dispute-opening command.
create or replace function public.require_swap_completion_authority()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if old.requester_confirmed is not distinct from new.requester_confirmed
     and old.responder_confirmed is not distinct from new.responder_confirmed
     and old.confirmed_by is not distinct from new.confirmed_by then
    return new;
  end if;

  if coalesce(current_setting('swaply.completion_authority', true), '')
     not in (
       'confirm_swap_completion_v1',
       'cancel_swap_v1',
       'open_swap_dispute_v1'
     ) then
    raise exception 'Direct completion confirmation updates are forbidden'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;
revoke execute on function public.require_swap_completion_authority()
  from public, anon, authenticated;

-- Reserve both terminal exception branches for their dedicated authorities.
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

  if new.status = 'cancelled'
     and coalesce(current_setting('swaply.cancel_authority', true), '')
       <> 'cancel_swap_v1' then
    raise exception 'Cancellation requires cancel_swap_v1'
      using errcode = '42501';
  end if;

  if new.status = 'disputed'
     and coalesce(current_setting('swaply.dispute_authority', true), '')
       <> 'open_swap_dispute_v1' then
    raise exception 'Dispute opening requires open_swap_dispute_v1'
      using errcode = '42501';
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
revoke execute on function public.validate_swap_status_transition()
  from public, anon, authenticated;
drop trigger if exists validate_swap_transition on public.swaps;
create trigger validate_swap_transition
  before update of status on public.swaps
  for each row execute function public.validate_swap_status_transition();

commit;
