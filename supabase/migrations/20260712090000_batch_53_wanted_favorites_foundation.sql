-- Batch 53 — Favorites and Wants foundation
-- Safe, idempotent schema/RLS foundation. This migration is committed only;
-- it must be reviewed before being applied to any production database.

begin;

create table if not exists public.wanted_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text,
  category text,
  city text,
  offer_description text,
  offer_item_ids uuid[] not null default '{}',
  status text not null default 'active'
    check (status in ('active', 'fulfilled', 'expired', 'cancelled')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wanted_requests
  add column if not exists updated_at timestamptz not null default now();

alter table public.wanted_requests
  alter column user_id set not null,
  alter column status set not null,
  alter column status set default 'active',
  alter column expires_at set not null,
  alter column expires_at set default (now() + interval '30 days'),
  alter column offer_item_ids set default '{}';

update public.wanted_requests
set offer_item_ids = '{}'
where offer_item_ids is null;

alter table public.wanted_requests
  alter column offer_item_ids set not null;

create index if not exists idx_wanted_requests_user_created
  on public.wanted_requests (user_id, created_at desc);

create index if not exists idx_wanted_requests_public_active
  on public.wanted_requests (status, expires_at desc)
  where status = 'active';

create index if not exists idx_wanted_requests_category
  on public.wanted_requests (category)
  where category is not null;

create index if not exists idx_wanted_requests_city
  on public.wanted_requests (city)
  where city is not null;

alter table public.wanted_requests enable row level security;

drop policy if exists "wanted_select_active" on public.wanted_requests;
drop policy if exists "wanted_insert" on public.wanted_requests;
drop policy if exists "wanted_update_own" on public.wanted_requests;
drop policy if exists "wanted_delete_own" on public.wanted_requests;
drop policy if exists "wanted_requests_select" on public.wanted_requests;
drop policy if exists "wanted_requests_insert" on public.wanted_requests;
drop policy if exists "wanted_requests_update" on public.wanted_requests;
drop policy if exists "wanted_requests_delete" on public.wanted_requests;

create policy "wanted_requests_select"
on public.wanted_requests
for select
to anon, authenticated
using (
  (status = 'active' and expires_at > now())
  or user_id = auth.uid()
);

create policy "wanted_requests_insert"
on public.wanted_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'active'
  and expires_at > now()
);

create policy "wanted_requests_update"
on public.wanted_requests
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "wanted_requests_delete"
on public.wanted_requests
for delete
to authenticated
using (user_id = auth.uid());

grant select on public.wanted_requests to anon;
grant select, insert, update, delete on public.wanted_requests to authenticated;
revoke all on public.wanted_requests from public;

-- Reconcile favorites ownership policies without changing the public contract.
do $$
begin
  if to_regclass('public.user_favorites') is not null then
    execute 'alter table public.user_favorites enable row level security';

    execute 'drop policy if exists "own favorites only" on public.user_favorites';
    execute 'drop policy if exists "favorites_select_own" on public.user_favorites';
    execute 'drop policy if exists "favorites_insert_own" on public.user_favorites';
    execute 'drop policy if exists "favorites_delete_own" on public.user_favorites';

    execute 'create policy "favorites_select_own" on public.user_favorites for select to authenticated using (user_id = auth.uid())';
    execute 'create policy "favorites_insert_own" on public.user_favorites for insert to authenticated with check (user_id = auth.uid())';
    execute 'create policy "favorites_delete_own" on public.user_favorites for delete to authenticated using (user_id = auth.uid())';
  end if;
end
$$;

commit;
