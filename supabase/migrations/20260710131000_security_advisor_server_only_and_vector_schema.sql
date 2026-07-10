-- Batch 46 — Supabase Security Advisor hardening
--
-- Goals:
--   1. Keep contact_messages and translation_cache strictly server-only.
--   2. Make that intent explicit through restrictive deny-all client policies.
--   3. Relocate pgvector from public to the existing extensions schema.
--
-- Runtime contract:
--   - API routes use SUPABASE_SERVICE_ROLE_KEY for both tables.
--   - service_role bypasses RLS and retains full table privileges.
--   - anon and authenticated must never access these tables directly.

-- ---------------------------------------------------------------------------
-- Server-only table: contact_messages
-- ---------------------------------------------------------------------------

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from public;
revoke all on table public.contact_messages from anon;
revoke all on table public.contact_messages from authenticated;

grant all on table public.contact_messages to service_role;

drop policy if exists contact_messages_deny_client_access
  on public.contact_messages;

create policy contact_messages_deny_client_access
  on public.contact_messages
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on policy contact_messages_deny_client_access
  on public.contact_messages
  is 'Server-only table. Direct anon/authenticated access is always denied; the contact API uses service_role.';

-- ---------------------------------------------------------------------------
-- Server-only table: translation_cache
-- ---------------------------------------------------------------------------

alter table public.translation_cache enable row level security;

revoke all on table public.translation_cache from public;
revoke all on table public.translation_cache from anon;
revoke all on table public.translation_cache from authenticated;

grant all on table public.translation_cache to service_role;

drop policy if exists translation_cache_deny_client_access
  on public.translation_cache;

create policy translation_cache_deny_client_access
  on public.translation_cache
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on policy translation_cache_deny_client_access
  on public.translation_cache
  is 'Server-only cache. Direct anon/authenticated access is always denied; translation routes prefer service_role.';

-- ---------------------------------------------------------------------------
-- Extension schema hardening: pgvector
-- ---------------------------------------------------------------------------

create schema if not exists extensions;

do $migration$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'vector'
      and n.nspname = 'public'
  ) then
    execute 'alter extension vector set schema extensions';
  end if;
end
$migration$;
