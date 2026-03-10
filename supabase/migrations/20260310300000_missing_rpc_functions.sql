-- Migration: Add missing RPC functions called by the application
-- Functions: log_action, is_item_available, complete_onboarding_step

-- ============================================================
-- 1. audit_log table + log_action RPC
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write audit logs
CREATE POLICY "service_role_all" ON public.audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_action(
  p_user_id TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_old_data TEXT DEFAULT NULL,
  p_new_data TEXT DEFAULT NULL,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, old_data, new_data, ip, user_agent)
  VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    CASE WHEN p_old_data IS NOT NULL THEN p_old_data::JSONB ELSE NULL END,
    CASE WHEN p_new_data IS NOT NULL THEN p_new_data::JSONB ELSE NULL END,
    p_ip,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. is_item_available RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_item_available(item_uuid TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.items
    WHERE id = item_uuid
      AND status = 'active'
      AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- 3. complete_onboarding_step RPC
-- ============================================================

-- Ensure onboarding_steps column exists on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_steps JSONB DEFAULT '{}'::JSONB;

CREATE OR REPLACE FUNCTION public.complete_onboarding_step(
  p_user_id TEXT,
  p_step TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    onboarding_steps = COALESCE(onboarding_steps, '{}'::JSONB) || jsonb_build_object(p_step, true),
    onboarding_completed = (
      -- Mark fully completed when all core steps are done
      (COALESCE(onboarding_steps, '{}'::JSONB) || jsonb_build_object(p_step, true)) ?& ARRAY['profile']
    )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
