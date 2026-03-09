-- Production-ready migration: soft delete, token ledger, conversations, enhanced chat, indexes
-- 20260219000000_production_ready.sql

-- ============================================================
-- 1) Soft Delete: Add deleted_at to items
-- ============================================================
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update items policy to exclude soft-deleted rows
DROP POLICY IF EXISTS "items_select_active" ON public.items;
CREATE POLICY "items_select_active" ON public.items
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      is_active = true
      OR owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ============================================================
-- 2) Conversations table for proper chat management
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  participant_a TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_b TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message TEXT DEFAULT '',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(participant_a, participant_b)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    participant_a = current_setting('request.jwt.claims', true)::json->>'sub'
    OR participant_b = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "conversations_insert_participant" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    participant_a = current_setting('request.jwt.claims', true)::json->>'sub'
    OR participant_b = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    participant_a = current_setting('request.jwt.claims', true)::json->>'sub'
    OR participant_b = current_setting('request.jwt.claims', true)::json->>'sub'
  );

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;

-- ============================================================
-- 3) Token Ledger for monetization
-- ============================================================
CREATE TABLE IF NOT EXISTS public.token_ledger (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'signup_bonus', 'swap_completed', 'referral', 'purchase',
    'boost_spent', 'monthly_grant', 'admin_grant'
  )),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.token_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "token_ledger_select_own" ON public.token_ledger
  FOR SELECT TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "token_ledger_insert_own" ON public.token_ledger
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT ON public.token_ledger TO authenticated;

-- ============================================================
-- 4) Enhanced messages: typing, reactions, read receipts
-- ============================================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'
  CHECK (message_type IN ('text', 'location', 'image', 'system'));
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS location_data JSONB DEFAULT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_by TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ DEFAULT NULL;

-- Allow message updates (for reactions, read receipts, edits)
CREATE POLICY "messages_update_participant" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    conversation_id LIKE '%' || current_setting('request.jwt.claims', true)::json->>'sub' || '%'
  );

GRANT UPDATE ON public.messages TO authenticated;

-- ============================================================
-- 5) Swap intents enhancements
-- ============================================================
ALTER TABLE public.swap_intents ADD COLUMN IF NOT EXISTS swap_type TEXT DEFAULT 'object'
  CHECK (swap_type IN ('object', 'service', 'property'));
ALTER TABLE public.swap_intents ADD COLUMN IF NOT EXISTS cancel_reason TEXT DEFAULT NULL;
ALTER TABLE public.swap_intents ADD COLUMN IF NOT EXISTS requester_bundle_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.swap_intents ADD COLUMN IF NOT EXISTS responder_bundle_ids TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ============================================================
-- 6) Profile enhancements
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'
  CHECK (account_status IN ('active', 'paused', 'deleted'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS house_profile JSONB DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_profiles JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_history JSONB DEFAULT '[]'::JSONB;

-- ============================================================
-- 7) Typing indicators (ephemeral, for Supabase Realtime)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "typing_select_participant" ON public.typing_indicators
  FOR SELECT TO authenticated
  USING (
    conversation_id LIKE '%' || current_setting('request.jwt.claims', true)::json->>'sub' || '%'
  );

CREATE POLICY "typing_upsert_own" ON public.typing_indicators
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "typing_update_own" ON public.typing_indicators
  FOR UPDATE TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT, UPDATE ON public.typing_indicators TO authenticated;

-- ============================================================
-- 8) Rate limit entries for persistent rate limiting
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — only accessed server-side via service role
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Auto-cleanup index for stale entries
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.rate_limit_entries(window_start);

-- ============================================================
-- 9) Additional performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON public.items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swap_intents_status ON public.swap_intents(status);
CREATE INDEX IF NOT EXISTS idx_swap_intents_updated ON public.swap_intents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_token_ledger_user ON public.token_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_a ON public.conversations(participant_a);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_b ON public.conversations(participant_b);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status) WHERE account_status = 'active';

-- ============================================================
-- 10) Enable Realtime on key tables for live features
-- ============================================================
DO $$
BEGIN
  -- Enable realtime on messages for live chat
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  -- Enable realtime on typing_indicators
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'typing_indicators'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
  END IF;

  -- Enable realtime on notifications for push
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============================================================
-- 11) RPC: append_read_by — atomically add a reader to a message
-- ============================================================
CREATE OR REPLACE FUNCTION public.append_read_by(msg_id TEXT, reader_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages
  SET read_by = array_append(read_by, reader_id)
  WHERE id = msg_id
    AND NOT (read_by @> ARRAY[reader_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
