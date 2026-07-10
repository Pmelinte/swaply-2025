-- SECURITY GUARD: the former demo seed created 100 confirmed Auth users
-- with one password committed to Git history. That made the demo identities
-- usable as real authenticated accounts in production.
--
-- Batch 48 intentionally disables that seed until a replacement can create
-- non-login demo ownership records without shared credentials.
-- Existing production demo profiles and items are preserved by the Batch 48
-- migration; only their Auth login capability is quarantined.
--
-- Do not reintroduce deterministic or shared passwords for demo users.

DO $$
BEGIN
  RAISE NOTICE 'Swaply demo seed is disabled by Batch 48 security quarantine.';
END
$$;
