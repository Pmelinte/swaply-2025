-- Meeting sessions with confirmation codes + no-show reports
-- 20260323100000_meeting_sessions.sql

-- ============================================================
-- 1) Meeting sessions — scheduled meetings between swap parties
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meeting_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  swap_id TEXT NOT NULL REFERENCES public.swap_intents(id) ON DELETE CASCADE,
  proposer_id TEXT NOT NULL REFERENCES public.profiles(id),
  location_name TEXT NOT NULL,
  location_address TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  confirmation_code TEXT NOT NULL DEFAULT upper(substring(md5(random()::text), 1, 6)),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed_a','confirmed_b','completed','no_show')),
  a_checked_in_at TIMESTAMPTZ,
  b_checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;

-- Both swap participants can view meetings for their swaps
CREATE POLICY "meeting_select_participants" ON public.meeting_sessions
  FOR SELECT TO authenticated
  USING (
    swap_id IN (
      SELECT id FROM public.swap_intents
      WHERE requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR responder_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "meeting_insert_participants" ON public.meeting_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    proposer_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "meeting_update_participants" ON public.meeting_sessions
  FOR UPDATE TO authenticated
  USING (
    swap_id IN (
      SELECT id FROM public.swap_intents
      WHERE requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR responder_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.meeting_sessions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_meeting_sessions_swap ON public.meeting_sessions(swap_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_status ON public.meeting_sessions(status)
  WHERE status IN ('scheduled', 'confirmed_a', 'confirmed_b');

-- ============================================================
-- 2) No-show reports — filed after a missed meeting
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meeting_no_show_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  meeting_id TEXT NOT NULL REFERENCES public.meeting_sessions(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES public.profiles(id),
  reported_user_id TEXT NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, reporter_id)
);

ALTER TABLE public.meeting_no_show_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "noshow_select_own" ON public.meeting_no_show_reports
  FOR SELECT TO authenticated
  USING (
    reporter_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR reported_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "noshow_insert_own" ON public.meeting_no_show_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

GRANT SELECT, INSERT ON public.meeting_no_show_reports TO authenticated;

CREATE INDEX IF NOT EXISTS idx_noshow_reports_reported ON public.meeting_no_show_reports(reported_user_id);
