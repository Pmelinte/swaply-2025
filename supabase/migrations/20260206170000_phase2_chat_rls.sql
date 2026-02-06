-- Phase 2: Chat persistence (messages)
-- Conversation IDs are deterministic and contain both participant user IDs:
--   dm:<userA>:<userB>
--
-- This enables participants to read the full conversation, not only their own sent messages.

DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_auth" ON public.messages;

CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (
    conversation_id LIKE '%' || auth.uid()::text || '%'
  );

CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()::text
    AND conversation_id LIKE '%' || auth.uid()::text || '%'
  );

