-- ============================================================
-- HOTFIX: Fix "Database error querying schema" on login
-- Problem: seed.sql created auth.users but NOT auth.identities
-- GoTrue requires identity records for email sign-in.
-- Also: confirmed_at was NULL, encrypted_password may be invalid.
--
-- Run this in Supabase SQL Editor (as postgres).
-- ============================================================

-- 1) Fix confirmed_at (GoTrue checks this column)
UPDATE auth.users
SET confirmed_at = COALESCE(confirmed_at, email_confirmed_at, NOW())
WHERE email LIKE '%@swaply.test'
  AND confirmed_at IS NULL;

-- 2) Fix encrypted_password with valid bcrypt for "DemoSwap2025!"
UPDATE auth.users
SET encrypted_password = crypt('DemoSwap2025!', gen_salt('bf', 10))
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
