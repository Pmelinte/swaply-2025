-- Fix RLS policies for swaps and notifications tables

-- ============================================================
-- Fix swaps: restrict to participants only (was: any authenticated)
-- ============================================================
DROP POLICY IF EXISTS "swaps_select_auth" ON public.swaps;

CREATE POLICY "swaps_select_participant" ON public.swaps
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.swap_intents si
      WHERE si.id = swaps.intent_id
      AND (
        si.requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR si.responder_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- ============================================================
-- Fix notifications: restrict INSERT to own user_id only
-- ============================================================
DROP POLICY IF EXISTS "notifications_insert_service" ON public.notifications;

CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- Fix messages: allow both sender AND receiver to read
-- (Currently only sender can read their own messages)
-- ============================================================
DROP POLICY IF EXISTS "messages_select_own" ON public.messages;

CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (
    conversation_id LIKE '%' || current_setting('request.jwt.claims', true)::json->>'sub' || '%'
  );
