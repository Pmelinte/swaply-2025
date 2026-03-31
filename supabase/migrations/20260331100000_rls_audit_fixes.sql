-- RLS policy audit fixes
-- Addresses missing WITH CHECK clauses, overly permissive roles,
-- and a missing DELETE policy on notifications.
-- No existing correct policies are removed.

BEGIN;

-- ============================================================
-- 1. swaps — update policy is missing WITH CHECK.
--    Without it a participant could change requester_id or
--    responder_id to hijack the swap row.
-- ============================================================
DROP POLICY IF EXISTS "update_own_swaps" ON public.swaps;

-- Swap participants can update their own swaps but cannot
-- reassign the requester_id or responder_id columns.
CREATE POLICY "update_own_swaps" ON public.swaps
  FOR UPDATE TO authenticated
  USING (
    (requester_id = auth.uid()) OR (responder_id = auth.uid())
  )
  WITH CHECK (
    (requester_id = auth.uid()) OR (responder_id = auth.uid())
  );

-- ============================================================
-- 2. messages — update policy is missing WITH CHECK.
--    Without it the sender could change sender_id to impersonate
--    another user.
-- ============================================================
DROP POLICY IF EXISTS "update_own_messages" ON public.messages;

-- Message authors can update their own messages but cannot
-- change the sender_id column.
CREATE POLICY "update_own_messages" ON public.messages
  FOR UPDATE TO authenticated
  USING  (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- 3. notifications — missing DELETE policy.
--    Users cannot dismiss / clear their own notifications.
-- ============================================================

-- Allow users to delete (dismiss) their own notifications.
CREATE POLICY "delete_own_notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 4. user_favorites — uses the public role (includes anon) and
--    user_id is nullable.  Restrict to authenticated only.
-- ============================================================
DROP POLICY IF EXISTS "own favorites only" ON public.user_favorites;

-- Authenticated users can manage only their own favorites.
CREATE POLICY "favorites_select_own" ON public.user_favorites
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own" ON public.user_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_update_own" ON public.user_favorites
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own" ON public.user_favorites
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5. saved_searches — same issue as user_favorites: public role
--    + nullable user_id.  Restrict to authenticated only.
-- ============================================================
DROP POLICY IF EXISTS "Users can manage their own saved searches"
  ON public.saved_searches;

-- Authenticated users can manage only their own saved searches.
CREATE POLICY "saved_searches_select_own" ON public.saved_searches
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "saved_searches_insert_own" ON public.saved_searches
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_searches_update_own" ON public.saved_searches
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_searches_delete_own" ON public.saved_searches
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

COMMIT;
