-- Trust & Safety migration
-- 20260219200000_trust_safety.sql

-- ============================================================
-- 1) Trust scores — cached per user
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trust_scores (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL DEFAULT 'new' CHECK (level IN ('new', 'basic', 'trusted', 'verified', 'ambassador')),
  breakdown JSONB NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trust_select_own" ON public.trust_scores
  FOR SELECT TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT ON public.trust_scores TO authenticated;

-- ============================================================
-- 2) Abuse reports — enhanced with status tracking
-- ============================================================
-- abuse_reports table already exists, add resolution tracking
ALTER TABLE public.abuse_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.abuse_reports ADD COLUMN IF NOT EXISTS resolution TEXT DEFAULT NULL
  CHECK (resolution IS NULL OR resolution IN ('confirmed', 'dismissed', 'warning_issued', 'user_banned'));
ALTER TABLE public.abuse_reports ADD COLUMN IF NOT EXISTS auto_hold_triggered BOOLEAN DEFAULT false;

-- Index for counting active reports per user
CREATE INDEX IF NOT EXISTS idx_abuse_reports_user ON public.abuse_reports(reported_user_id, status)
  WHERE status = 'pending';

-- ============================================================
-- 3) User message counters — for adaptive friction
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_message_counts (
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  chats_opened INTEGER NOT NULL DEFAULT 0,
  swaps_proposed INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, count_date)
);

ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_counts_select_own" ON public.daily_message_counts
  FOR SELECT TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "msg_counts_upsert_own" ON public.daily_message_counts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "msg_counts_update_own" ON public.daily_message_counts
  FOR UPDATE TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT, UPDATE ON public.daily_message_counts TO authenticated;

-- ============================================================
-- 4) Scam detection log — for moderation review
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scam_detections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  message_preview TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  patterns TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scam_detections ENABLE ROW LEVEL SECURITY;

-- Only system/admin can view scam detections (no user policy)
CREATE INDEX IF NOT EXISTS idx_scam_detections_user ON public.scam_detections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scam_detections_severity ON public.scam_detections(severity)
  WHERE severity IN ('medium', 'high');

-- ============================================================
-- 5) Feature flags — admin-managed (read by all)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'core' CHECK (category IN ('core', 'ai', 'social', 'monetization', 'experimental')),
  rollout_percent INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
  allowed_countries TEXT[] DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags_select_all" ON public.feature_flags
  FOR SELECT USING (true);

GRANT SELECT ON public.feature_flags TO authenticated, anon;

-- ============================================================
-- 6) Metrics events — aggregated daily
-- ============================================================
CREATE TABLE IF NOT EXISTS public.metrics_daily (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_name TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(metric_date, event_name)
);

ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics_select_all" ON public.metrics_daily
  FOR SELECT USING (true);

GRANT SELECT ON public.metrics_daily TO authenticated;

-- RPC to increment a daily metric
CREATE OR REPLACE FUNCTION public.increment_daily_metric(target_event TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.metrics_daily (id, metric_date, event_name, count)
  VALUES (gen_random_uuid()::TEXT, CURRENT_DATE, target_event, 1)
  ON CONFLICT (metric_date, event_name) DO UPDATE
  SET count = metrics_daily.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7) Safe meeting confirmations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.safe_meeting_checks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  swap_id TEXT NOT NULL REFERENCES public.swap_intents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checklist_completed JSONB NOT NULL DEFAULT '[]',
  confirmed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(swap_id, user_id)
);

ALTER TABLE public.safe_meeting_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "safe_meeting_select_own" ON public.safe_meeting_checks
  FOR SELECT TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "safe_meeting_upsert_own" ON public.safe_meeting_checks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "safe_meeting_update_own" ON public.safe_meeting_checks
  FOR UPDATE TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT, UPDATE ON public.safe_meeting_checks TO authenticated;

-- ============================================================
-- 8) Profile additions for trust
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'new';
