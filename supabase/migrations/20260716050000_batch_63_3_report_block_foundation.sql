begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- Reconcile the unused historical table when it exists, then remove the
-- parallel source of truth. Production currently has no abuse_reports table.
do $legacy$
begin
  if to_regclass('public.abuse_reports') is not null then
    execute $sql$
      insert into public.reports (
        id,
        reporter_id,
        entity_type,
        entity_id,
        reason,
        description,
        status,
        created_at
      )
      select
        case
          when id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then id::uuid
          else gen_random_uuid()
        end,
        reporter_id::uuid,
        case when reported_item_id is not null then 'item' else 'profile' end,
        coalesce(reported_item_id, reported_user_id)::uuid,
        case reason
          when 'inappropriate' then 'inappropriate'
          else reason
        end,
        coalesce(description, ''),
        case status
          when 'pending' then 'open'
          when 'reviewed' then 'investigating'
          else status
        end,
        created_at
      from public.abuse_reports
      where reporter_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        and coalesce(reported_item_id, reported_user_id)
          ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      on conflict (id) do nothing
    $sql$;

    execute 'drop table public.abuse_reports';
  end if;
end
$legacy$;

-- Unverified reports must never suspend users or alter counters.
drop trigger if exists check_report_rate_limit_trigger on public.reports;
drop trigger if exists on_report_update_counts on public.reports;
drop function if exists public.check_report_rate_limit();
drop function if exists public.handle_report_count_update();

alter table public.reports
  add column if not exists reported_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists reported_item_id uuid references public.items(id) on delete set null,
  add column if not exists resolution text,
  add column if not exists updated_at timestamptz not null default now();

update public.reports
set reported_user_id = entity_id
where reported_user_id is null
  and entity_type = 'profile';

update public.reports report
set reported_item_id = report.entity_id,
    reported_user_id = item.owner_id
from public.items item
where report.reported_user_id is null
  and report.entity_type = 'item'
  and item.id = report.entity_id;

alter table public.reports drop constraint if exists reports_entity_type_check;
alter table public.reports drop constraint if exists reports_reason_check;
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports drop constraint if exists reports_resolution_check;
alter table public.reports drop constraint if exists reports_description_length_check;
alter table public.reports drop constraint if exists reports_evidence_shape_check;
alter table public.reports drop constraint if exists reports_target_shape_check;

update public.reports set status = 'open' where status = 'pending';
update public.reports set status = 'investigating' where status = 'reviewed';
update public.reports set reason = 'inappropriate' where reason = 'inappropriate_content';

alter table public.reports
  add constraint reports_entity_type_check
    check (entity_type in ('profile', 'item')),
  add constraint reports_reason_check
    check (reason in (
      'spam',
      'harassment',
      'inappropriate',
      'scam',
      'prohibited_item',
      'other'
    )),
  add constraint reports_status_check
    check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  add constraint reports_resolution_check
    check (
      resolution is null
      or resolution in (
        'dismissed',
        'warning_issued',
        'item_hidden',
        'user_suspended'
      )
    ),
  add constraint reports_description_length_check
    check (char_length(coalesce(description, '')) <= 2000),
  add constraint reports_evidence_shape_check
    check (
      evidence is null
      or (
        jsonb_typeof(evidence) = 'array'
        and jsonb_array_length(evidence) <= 10
      )
    ),
  add constraint reports_target_shape_check
    check (
      reported_user_id is not null
      and (
        (
          entity_type = 'profile'
          and reported_item_id is null
          and entity_id = reported_user_id
        )
        or (
          entity_type = 'item'
          and reported_item_id is not null
          and entity_id = reported_item_id
        )
      )
    );

alter table public.blocked_users drop constraint if exists blocked_users_no_self_check;
alter table public.blocked_users
  add constraint blocked_users_no_self_check check (blocker_id <> blocked_id);

create unique index if not exists reports_one_active_per_target_idx
  on public.reports (reporter_id, entity_type, entity_id)
  where status in ('open', 'investigating');

create index if not exists reports_reported_user_idx
  on public.reports (reported_user_id, created_at desc);

create index if not exists reports_reported_item_idx
  on public.reports (reported_item_id, created_at desc)
  where reported_item_id is not null;

create index if not exists blocked_users_blocked_idx
  on public.blocked_users (blocked_id, blocker_id);

create table if not exists public.safety_command_requests (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  command text not null check (command in ('report', 'block', 'resolve_report')),
  idempotency_key text not null,
  request_hash text not null,
  subject_id uuid,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (actor_id, command, idempotency_key)
);

comment on table public.safety_command_requests is
  'Batch 63.3 private idempotency registry for canonical report, block and report-resolution commands.';

create table if not exists public.safety_report_resolution_effects (
  report_id uuid primary key references public.reports(id) on delete cascade,
  moderator_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  affected_user_id uuid references auth.users(id) on delete set null,
  affected_item_id uuid references public.items(id) on delete set null,
  report_counted boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.safety_report_resolution_effects is
  'Batch 63.3 exactly-once moderation effects for canonical safety reports.';

alter table public.safety_command_requests enable row level security;
alter table public.safety_report_resolution_effects enable row level security;

revoke all on table public.reports from public, anon, authenticated;
revoke all on table public.blocked_users from public, anon, authenticated;
revoke all on table public.safety_command_requests from public, anon, authenticated;
revoke all on table public.safety_report_resolution_effects from public, anon, authenticated;
revoke all on table public.moderation_actions from public, anon, authenticated;

grant select on table public.reports to authenticated;
grant select on table public.blocked_users to authenticated;
grant select on table public.moderation_actions to authenticated;
grant all on table public.reports to service_role;
grant all on table public.blocked_users to service_role;
grant all on table public.safety_command_requests to service_role;
grant all on table public.safety_report_resolution_effects to service_role;
grant all on table public.moderation_actions to service_role;

drop policy if exists reports_insert_own on public.reports;
drop policy if exists reports_select_own on public.reports;
drop policy if exists reports_select_own_or_moderator on public.reports;
create policy reports_select_own_or_moderator
  on public.reports
  for select
  to authenticated
  using (
    reporter_id = (select auth.uid())
    or exists (
      select 1
      from public.user_roles role_row
      where role_row.user_id = (select auth.uid())
        and role_row.role in ('admin', 'moderator')
    )
  );

drop policy if exists "Users can block others" on public.blocked_users;
drop policy if exists "Users can unblock others" on public.blocked_users;
drop policy if exists "Users can view own blocks" on public.blocked_users;
drop policy if exists blocked_users_select_own on public.blocked_users;
drop policy if exists blocked_users_insert_own on public.blocked_users;
drop policy if exists blocked_users_delete_own on public.blocked_users;
create policy blocked_users_select_own
  on public.blocked_users
  for select
  to authenticated
  using (blocker_id = (select auth.uid()));

drop policy if exists moderation_actions_admin_select on public.moderation_actions;
create policy moderation_actions_admin_select
  on public.moderation_actions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_roles role_row
      where role_row.user_id = (select auth.uid())
        and role_row.role in ('admin', 'moderator')
    )
  );

create or replace function private.is_blocked_pair_v1(
  p_user_a uuid,
  p_user_b uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select case
    when p_user_a is null or p_user_b is null then false
    else exists (
      select 1
      from public.blocked_users block_row
      where (block_row.blocker_id = p_user_a and block_row.blocked_id = p_user_b)
         or (block_row.blocker_id = p_user_b and block_row.blocked_id = p_user_a)
    )
  end;
$function$;

revoke execute on function private.is_blocked_pair_v1(uuid, uuid)
  from public, anon;
grant execute on function private.is_blocked_pair_v1(uuid, uuid)
  to authenticated, service_role;

create or replace function public.guard_canonical_report_writes_v1()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if coalesce(current_setting('swaply.safety_authority', true), '')
     not in ('submit_report_v1', 'resolve_report_v1') then
    raise exception 'Direct report writes are forbidden'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

revoke execute on function public.guard_canonical_report_writes_v1()
  from public, anon, authenticated;

drop trigger if exists guard_canonical_report_writes_v1 on public.reports;
create trigger guard_canonical_report_writes_v1
before insert or update or delete on public.reports
for each row execute function public.guard_canonical_report_writes_v1();

create or replace function public.guard_canonical_block_writes_v1()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if coalesce(current_setting('swaply.safety_authority', true), '')
     <> 'set_user_block_v1' then
    raise exception 'Direct block writes are forbidden'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

revoke execute on function public.guard_canonical_block_writes_v1()
  from public, anon, authenticated;

drop trigger if exists guard_canonical_block_writes_v1 on public.blocked_users;
create trigger guard_canonical_block_writes_v1
before insert or update or delete on public.blocked_users
for each row execute function public.guard_canonical_block_writes_v1();

commit;
