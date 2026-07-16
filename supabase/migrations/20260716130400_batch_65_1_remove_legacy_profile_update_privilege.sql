-- Batch 65.1 — the application bootstrap now uses ensure_own_profile_v1.
-- Direct authenticated UPDATE remains unavailable and cannot bypass CAS.

begin;

revoke update on table public.profiles from authenticated;

drop policy if exists update_own_profile on public.profiles;

comment on function public.ensure_own_profile_v1(text) is
  'Canonical owner bootstrap authority. Replaces the legacy browser profile upsert path.';

commit;
