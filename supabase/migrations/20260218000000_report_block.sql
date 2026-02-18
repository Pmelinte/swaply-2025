-- Report & Block tables for user safety
-- Creates blocked_users and abuse_reports tables

-- ============================================================
-- blocked_users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  blocker_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_users_select_own" ON public.blocked_users
  FOR SELECT TO authenticated
  USING (blocker_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "blocked_users_insert_own" ON public.blocked_users
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "blocked_users_delete_own" ON public.blocked_users
  FOR DELETE TO authenticated
  USING (blocker_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;

-- ============================================================
-- abuse_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  reporter_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'prohibited_item', 'other')),
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "abuse_reports_select_own" ON public.abuse_reports
  FOR SELECT TO authenticated
  USING (reporter_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "abuse_reports_insert_own" ON public.abuse_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT ON public.abuse_reports TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_reporter ON public.abuse_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_status ON public.abuse_reports(status) WHERE status = 'pending';
