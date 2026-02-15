-- ============================================================
-- HOTFIX: Fix "Database error querying schema" on login
-- Problem 1: seed.sql created auth.users but NOT auth.identities
-- Problem 2: GoTrue Go SQL scanner cannot handle NULL in string
--   columns (confirmation_token, recovery_token, etc.)
--   Error: "Scan error on column index 3, name confirmation_token:
--           converting NULL to string is unsupported"
--
-- Run this in Supabase SQL Editor (as postgres).
-- ============================================================

-- 1) Fix encrypted_password with valid bcrypt for "DemoSwap2025!"
UPDATE auth.users
SET encrypted_password = crypt('DemoSwap2025!', gen_salt('bf', 10))
WHERE email LIKE '%@swaply.test';

-- 2) Fix NULL token columns → empty strings (GoTrue requirement)
UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  raw_user_meta_data = json_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  )::jsonb
WHERE email LIKE '%@swaply.test';

-- 3) Create missing auth.identities entries
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid() AS id,
  u.id AS user_id,
  json_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  )::jsonb AS identity_data,
  'email' AS provider,
  u.id::text AS provider_id,
  NOW() AS last_sign_in_at,
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.email LIKE '%@swaply.test'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'email'
  );

-- Verify: should show 100 rows
SELECT COUNT(*) AS identities_created
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email LIKE '%@swaply.test';
