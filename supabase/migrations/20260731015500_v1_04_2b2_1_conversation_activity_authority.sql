BEGIN;

CREATE OR REPLACE FUNCTION public.touch_conversation_activity_from_message_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_conversation_id uuid := coalesce(NEW.conversation_id, NEW.struct_conv_id);
BEGIN
  IF v_conversation_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = v_conversation_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_conversation_activity_from_message_v1() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_conversation_activity_from_message_v1() FROM anon;
REVOKE ALL ON FUNCTION public.touch_conversation_activity_from_message_v1() FROM authenticated;

DROP TRIGGER IF EXISTS touch_conversation_activity_from_message_v1 ON public.messages;

CREATE TRIGGER touch_conversation_activity_from_message_v1
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_conversation_activity_from_message_v1();

COMMENT ON FUNCTION public.touch_conversation_activity_from_message_v1() IS
  'Canonical server-side authority for conversations.updated_at after message creation. Conversation identity is derived from the inserted message.';

COMMIT;
