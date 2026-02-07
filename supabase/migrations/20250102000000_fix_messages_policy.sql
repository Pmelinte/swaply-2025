-- Fix messages RLS: participants of a conversation should see ALL messages
-- in that conversation, not just their own sent messages.

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;

-- Allow users to read messages from conversations they participate in.
-- A conversation_id follows the pattern "dm:userId1:userId2" where IDs are sorted.
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (
    conversation_id LIKE '%' || current_setting('request.jwt.claims', true)::json->>'sub' || '%'
  );

-- Allow users to delete their own messages (for moderation self-service)
CREATE POLICY "messages_delete_own" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT DELETE ON public.messages TO authenticated;
