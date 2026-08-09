-- V1-12.1a — align repository schema with the verified Production contract.
-- Production uses `feature_flags.key`; older bootstrap migrations used `id`.
-- This migration is idempotent for both states and keeps provider-backed
-- capabilities implemented but disabled until separate owner authorisation.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feature_flags'
      AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feature_flags'
      AND column_name = 'key'
  ) THEN
    ALTER TABLE public.feature_flags RENAME COLUMN id TO key;
  END IF;
END
$$;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

REVOKE SELECT ON TABLE public.feature_flags FROM anon;
GRANT SELECT ON TABLE public.feature_flags TO authenticated;

DROP POLICY IF EXISTS feature_flags_read ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_select_all ON public.feature_flags;

CREATE POLICY feature_flags_select_all
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

UPDATE public.feature_flags
SET enabled = false,
    rollout_percent = 0,
    updated_at = now()
WHERE key IN (
  'stripe_payments',
  'paypal_payments',
  'boost_listings',
  'courier_integration',
  'swap_insurance',
  'travel_integrations',
  'ads_banner',
  'api_access'
);

COMMENT ON COLUMN public.feature_flags.key IS
  'Canonical feature identifier. Provider-backed capabilities require both this flag and an explicit Production authorisation switch.';
