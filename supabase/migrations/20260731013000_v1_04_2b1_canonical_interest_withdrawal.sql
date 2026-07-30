-- V1-04.2B.1: canonical server-side withdrawal for matching interests.

BEGIN;

CREATE OR REPLACE FUNCTION public.withdraw_matching_interest_v1(
  p_interest_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_interest public.matching_interests%ROWTYPE;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  SELECT interest.*
    INTO v_interest
  FROM public.matching_interests AS interest
  WHERE interest.id = p_interest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'INTEREST_NOT_FOUND';
  END IF;

  IF v_interest.from_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'INTEREST_INITIATOR_REQUIRED';
  END IF;

  IF v_interest.status = 'refused' THEN
    RETURN true;
  END IF;

  IF v_interest.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'INTEREST_NOT_PENDING';
  END IF;

  UPDATE public.matching_interests
  SET status = 'refused'
  WHERE id = v_interest.id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_matching_interest_v1(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.withdraw_matching_interest_v1(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.withdraw_matching_interest_v1(uuid) TO authenticated;

COMMENT ON FUNCTION public.withdraw_matching_interest_v1(uuid) IS
  'Canonical idempotent interest withdrawal. The initiator is derived from auth.uid(); accepted or otherwise non-pending interests cannot be withdrawn.';

REVOKE INSERT, UPDATE, DELETE ON TABLE public.matching_interests FROM authenticated;

DROP POLICY IF EXISTS matching_interests_insert_initiator ON public.matching_interests;
DROP POLICY IF EXISTS matching_interests_update_initiator ON public.matching_interests;
DROP POLICY IF EXISTS matching_interests_delete_initiator ON public.matching_interests;

COMMIT;
