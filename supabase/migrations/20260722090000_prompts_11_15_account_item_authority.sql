-- Prompts 11-15 — account/privacy, notification preferences, GDPR requests,
-- object creation and object media owner-only authority hardening.

create table if not exists public.gdpr_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('export', 'delete')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint gdpr_requests_pending_once unique nulls not distinct (user_id, type, status)
);

alter table public.gdpr_requests enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gdpr_requests' and policyname = 'gdpr_requests_select_own'
  ) then
    create policy gdpr_requests_select_own
      on public.gdpr_requests for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gdpr_requests' and policyname = 'gdpr_requests_insert_own'
  ) then
    create policy gdpr_requests_insert_own
      on public.gdpr_requests for insert to authenticated
      with check (user_id = auth.uid() and status = 'pending');
  end if;
end $$;

create index if not exists gdpr_requests_user_requested_idx
  on public.gdpr_requests(user_id, requested_at desc);

grant select, insert on public.gdpr_requests to authenticated;
revoke update, delete on public.gdpr_requests from authenticated;

alter table public.notification_preferences enable row level security;
grant select, insert, update on public.notification_preferences to authenticated;

create or replace function public.touch_notification_preferences_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists notification_preferences_touch_updated_at on public.notification_preferences;
create trigger notification_preferences_touch_updated_at
before update on public.notification_preferences
for each row execute function public.touch_notification_preferences_updated_at();

alter table public.items
  add column if not exists media_order integer[] not null default '{}'::integer[];

create index if not exists items_owner_created_idx
  on public.items(owner_id, created_at desc);
