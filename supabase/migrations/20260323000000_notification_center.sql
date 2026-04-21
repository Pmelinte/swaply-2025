-- ============================================================
-- Notification Center: extend notifications + add preferences
-- ============================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

DO $$ BEGIN
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_priority_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_priority_check
  CHECK (priority IN ('low','normal','high','urgent','info','warning','success'));

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, read)
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_type
  ON public.notifications (user_id, type);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_delete_own'
  ) THEN
    CREATE POLICY "notifications_delete_own" ON public.notifications
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- Notification Preferences table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  match_new_inapp BOOLEAN DEFAULT true,
  match_new_email BOOLEAN DEFAULT true,
  match_new_push BOOLEAN DEFAULT false,
  message_inapp BOOLEAN DEFAULT true,
  message_email BOOLEAN DEFAULT false,
  message_push BOOLEAN DEFAULT true,
  swap_proposed_inapp BOOLEAN DEFAULT true,
  swap_proposed_email BOOLEAN DEFAULT true,
  swap_proposed_push BOOLEAN DEFAULT true,
  swap_accepted_inapp BOOLEAN DEFAULT true,
  swap_accepted_email BOOLEAN DEFAULT true,
  swap_accepted_push BOOLEAN DEFAULT true,
  logistics_updated_inapp BOOLEAN DEFAULT true,
  logistics_updated_email BOOLEAN DEFAULT false,
  logistics_updated_push BOOLEAN DEFAULT false,
  meeting_reminder_inapp BOOLEAN DEFAULT true,
  meeting_reminder_email BOOLEAN DEFAULT true,
  meeting_reminder_push BOOLEAN DEFAULT true,
  dispute_update_inapp BOOLEAN DEFAULT true,
  dispute_update_email BOOLEAN DEFAULT true,
  dispute_update_push BOOLEAN DEFAULT true,
  favorite_updated_inapp BOOLEAN DEFAULT true,
  favorite_updated_email BOOLEAN DEFAULT false,
  favorite_updated_push BOOLEAN DEFAULT false,
  saved_search_result_inapp BOOLEAN DEFAULT true,
  saved_search_result_email BOOLEAN DEFAULT true,
  saved_search_result_push BOOLEAN DEFAULT false,
  feedback_requested_inapp BOOLEAN DEFAULT true,
  feedback_requested_email BOOLEAN DEFAULT true,
  feedback_requested_push BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notification_preferences_select_own'
  ) THEN
    CREATE POLICY "notification_preferences_select_own" ON public.notification_preferences
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notification_preferences_upsert_own'
  ) THEN
    CREATE POLICY "notification_preferences_upsert_own" ON public.notification_preferences
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
