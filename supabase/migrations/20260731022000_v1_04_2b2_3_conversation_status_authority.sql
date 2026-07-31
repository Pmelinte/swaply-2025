-- V1-04.2B.2.3: Conversation Status Authority
-- Keep conversation status synchronized with the canonical swap lifecycle.

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_conversation_status_from_swap_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_conversation_status text;
BEGIN
  IF NEW.conversation_id IS NULL OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  v_conversation_status := CASE NEW.status
    WHEN 'accepted' THEN 'accepted'
    WHEN 'rejected' THEN 'rejected'
    ELSE NULL
  END;

  IF v_conversation_status IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.conversations
  SET
    status = v_conversation_status,
    updated_at = now()
  WHERE id = NEW.conversation_id
    AND status IS DISTINCT FROM v_conversation_status;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_conversation_status_from_swap_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_conversation_status_from_swap_v1() FROM anon;
REVOKE ALL ON FUNCTION public.sync_conversation_status_from_swap_v1() FROM authenticated;

DROP TRIGGER IF EXISTS sync_conversation_status_from_swap_v1 ON public.swaps;
CREATE TRIGGER sync_conversation_status_from_swap_v1
AFTER UPDATE OF status ON public.swaps
FOR EACH ROW
EXECUTE FUNCTION public.sync_conversation_status_from_swap_v1();

COMMENT ON FUNCTION public.sync_conversation_status_from_swap_v1() IS
  'Synchronizes accepted/rejected conversation status from the canonical swap lifecycle. Not directly executable by application roles.';

COMMIT;
