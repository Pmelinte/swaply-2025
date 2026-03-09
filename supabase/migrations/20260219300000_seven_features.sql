-- Combined migration: RBAC, disputes, metrics, OG, referral enhancements
-- 20260219300000_seven_features.sql

-- ============================================================
-- 1) RBAC: Admin role on profiles
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'moderator'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role)
  WHERE role IN ('admin', 'moderator');

-- ============================================================
-- 2) Dispute system on swap_intents
-- ============================================================
-- Allow "disputed" status
ALTER TABLE public.swap_intents DROP CONSTRAINT IF EXISTS swap_intents_status_check;
ALTER TABLE public.swap_intents ADD CONSTRAINT swap_intents_status_check
  CHECK (status IN ('proposed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'disputed'));

-- Confirmation fields
ALTER TABLE public.swap_intents ADD COLUMN IF NOT EXISTS requester_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.swap_intents ADD COLUMN IF NOT EXISTS responder_confirmed BOOLEAN DEFAULT false;

-- Dispute details
ALTER TABLE public.swap_intents ADD COLUMN IF NOT EXISTS dispute JSONB DEFAULT NULL;

-- ============================================================
-- 3) Persistent daily funnel metrics
-- ============================================================
-- Already have metrics_daily table from trust_safety migration
-- Add specific funnel event types
INSERT INTO public.metrics_daily (id, metric_date, event_name, count) VALUES
  (gen_random_uuid()::TEXT, CURRENT_DATE, 'visitors', 0),
  (gen_random_uuid()::TEXT, CURRENT_DATE, 'signups', 0),
  (gen_random_uuid()::TEXT, CURRENT_DATE, 'items_listed', 0),
  (gen_random_uuid()::TEXT, CURRENT_DATE, 'chats_started', 0),
  (gen_random_uuid()::TEXT, CURRENT_DATE, 'swaps_proposed', 0),
  (gen_random_uuid()::TEXT, CURRENT_DATE, 'swaps_completed', 0)
ON CONFLICT (metric_date, event_name) DO NOTHING;

-- ============================================================
-- 4) Referral tracking enhancements
-- ============================================================
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS share_channel TEXT DEFAULT NULL
  CHECK (share_channel IS NULL OR share_channel IN ('email', 'whatsapp', 'copy_link', 'sms'));

-- ============================================================
-- 5) Notification preferences (re-engagement)
-- ============================================================
-- Already have notifications table and profiles.notifications JSONB
-- Add last_active_at for re-engagement triggers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 6) Search indexes for faster full-text search
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_items_title_trgm ON public.items USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_items_location ON public.items(location) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC) WHERE is_active = true;

-- Full-text search vector (for Romanian + English)
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.items_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple', coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, '') || ' ' || coalesce(NEW.category, '') || ' ' || coalesce(NEW.location, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_search_trigger ON public.items;
CREATE TRIGGER items_search_trigger BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.items_search_update();

CREATE INDEX IF NOT EXISTS idx_items_search ON public.items USING gin (search_vector);
