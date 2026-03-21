-- ============================================================
-- Admin Moderation Panel: suspension columns + role on profiles
-- moderation_actions table already exists in DB with columns:
--   moderator_id, target_type, target_id, action, reason, duration_days, report_id, created_at
-- ============================================================

-- 1. Add suspension + role columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Set badge + role for founder
UPDATE public.profiles
SET badge = 'admin', role = 'admin'
WHERE user_id = 'f7ec0d37-0f1b-4ba6-906a-187e54873338';
