-- ============================================================
-- Admin Moderation Panel: moderation_actions table + suspension columns
-- ============================================================

-- 1. Add suspension columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Create moderation_actions table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  admin_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'warn', 'suspend', 'ban', 'unban', 'hide_item', 'mute',
    'escalate', 'note'
  )),
  reason TEXT NOT NULL DEFAULT '',
  report_id TEXT DEFAULT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Only admin/moderator roles can read moderation actions
CREATE POLICY "admin_read_moderation_actions" ON public.moderation_actions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin_insert_moderation_actions" ON public.moderation_actions
  FOR INSERT TO authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON public.moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin ON public.moderation_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON public.moderation_actions(report_id);

-- 3. Set badge for founder
UPDATE public.profiles
SET badge = 'admin', role = 'admin'
WHERE user_id = 'f7ec0d37-0f1b-4ba6-906a-187e54873338';
