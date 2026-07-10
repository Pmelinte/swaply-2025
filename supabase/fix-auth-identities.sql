-- ============================================================
-- SECURITY REPLACEMENT: quarantine demo Auth identities
-- ============================================================
--
-- The former version set every @swaply.test user to the same password,
-- which was committed to Git history. Never restore a deterministic or
-- shared password for demo accounts.
--
-- This script preserves auth.users rows, profiles, items and identities,
-- while preventing the demo identities from being used for login.
-- Run as postgres / through the Supabase SQL Editor only.

BEGIN;

-- Revoke active sessions first. auth.refresh_tokens.user_id is text in the
-- current GoTrue schema, while auth.sessions.user_id is uuid.
DELETE FROM auth.refresh_tokens
WHERE user_id IN (
  SELECT id::text
  FROM auth.users
  WHERE email ~ '^demo[0-9]+@swaply\.test$'
);

DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id
  FROM auth.users
  WHERE email ~ '^demo[0-9]+@swaply\.test$'
);

-- Give every demo identity an independent, unknown random password and ban
-- interactive login. Profiles and public demo listings remain untouched.
UPDATE auth.users
SET
  encrypted_password = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf', 10)),
  banned_until = '2099-12-31 23:59:59+00'::timestamptz,
  updated_at = now()
WHERE email ~ '^demo[0-9]+@swaply\.test$';

COMMIT;

-- Verification: public shared password must match zero users and every demo
-- account must be banned.
SELECT
  count(*)::int AS demo_users,
  count(*) FILTER (
    WHERE encrypted_password = crypt('DemoSwap2025!', encrypted_password)
  )::int AS public_password_still_valid,
  count(*) FILTER (
    WHERE banned_until IS NOT NULL AND banned_until > now()
  )::int AS banned_demo_users
FROM auth.users
WHERE email ~ '^demo[0-9]+@swaply\.test$';
