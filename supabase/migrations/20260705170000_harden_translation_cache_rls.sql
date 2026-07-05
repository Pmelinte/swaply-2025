-- Swaply production hardening: translation cache must not be exposed through anon/authenticated clients.
-- Runtime server code should access this table with SUPABASE_SERVICE_ROLE_KEY only.

alter table public.translation_cache enable row level security;

revoke all on table public.translation_cache from anon;
revoke all on table public.translation_cache from authenticated;

grant all on table public.translation_cache to service_role;
