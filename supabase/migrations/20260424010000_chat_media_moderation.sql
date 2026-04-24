-- PR 7 follow-up: chat media moderation alignment.
--
-- Idempotently ensures the columns and publications required by the chat
-- spec are in place. The original conversations/messages structural
-- migration landed as 20260418200000_structured_conversations.sql and used
-- `struct_conv_id` to avoid a conflict with the pre-existing
-- `messages.conversation_id TEXT`. This migration only fills in the small
-- gaps needed by the PR 7 chat page and is safe to re-run.

-- ── Extra message columns (idempotent) ──

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type      text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url         text,
  ADD COLUMN IF NOT EXISTS media_type        text,
  ADD COLUMN IF NOT EXISTS translation_cache jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS read_by           uuid[] DEFAULT '{}'::uuid[];

-- ── message_type CHECK (drop + re-add so new values land on existing rows) ──

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_message_type_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages DROP CONSTRAINT messages_message_type_check;
  END IF;
END $$;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN (
    'text', 'image', 'audio', 'video', 'system', 'agenda_update', 'summary'
  ));

-- ── Realtime publication (no-op when already present) ──

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ── append_read_by RPC (used by markConversationRead) ──

CREATE OR REPLACE FUNCTION public.append_read_by(
  p_conversation_id uuid,
  p_user_id         uuid
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.messages
  SET read_by = array_append(
    COALESCE(read_by, '{}'::uuid[]), p_user_id
  )
  WHERE struct_conv_id = p_conversation_id
    AND NOT (p_user_id = ANY(COALESCE(read_by, '{}'::uuid[])));
$$;

GRANT EXECUTE ON FUNCTION public.append_read_by(uuid, uuid) TO authenticated;
