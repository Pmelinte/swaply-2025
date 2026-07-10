-- Batch 48 / Train C opening P0
-- Quarantine demo Auth identities whose former shared password was committed
-- to the repository. Preserve profiles, items and public demo content.

-- Revoke any existing refresh/access sessions before changing credentials.
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

-- Rotate every password independently to an unknown random value and ban
-- interactive login. Do not delete auth.users because demo profiles/items use
-- those UUIDs as ownership references.
UPDATE auth.users
SET
  encrypted_password = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf', 10)),
  banned_until = '2099-12-31 23:59:59+00'::timestamptz,
  updated_at = now()
WHERE email ~ '^demo[0-9]+@swaply\.test$';

-- Fail the migration if the repository-known password still validates for any
-- demo identity after rotation.
DO $$
DECLARE
  remaining_known_passwords integer;
BEGIN
  SELECT count(*)
  INTO remaining_known_passwords
  FROM auth.users
  WHERE email ~ '^demo[0-9]+@swaply\.test$'
    AND encrypted_password = crypt('DemoSwap2025!', encrypted_password);

  IF remaining_known_passwords <> 0 THEN
    RAISE EXCEPTION 'Demo Auth quarantine failed: % known passwords remain valid', remaining_known_passwords;
  END IF;
END
$$;
