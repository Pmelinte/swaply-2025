-- Swaply Baseline Migration
-- Creates all canonical tables as defined in docs/db/DB_BASELINE.md
-- All tables have RLS enabled by default.

-- ============================================================
-- 1) Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "categories_select_all" ON public.categories
  FOR SELECT USING (true);

-- Only authenticated users can manage categories (admin use)
CREATE POLICY "categories_insert_auth" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- 2) Profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Utilizator Swaply',
  first_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  badge TEXT NOT NULL DEFAULT 'free' CHECK (badge IN ('free', 'premium', 'platinum')),
  languages TEXT[] NOT NULL DEFAULT ARRAY['ro']::TEXT[],
  location JSONB DEFAULT '{}'::JSONB,
  visibility JSONB NOT NULL DEFAULT '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true}'::JSONB,
  notifications JSONB NOT NULL DEFAULT '{"email":true,"push":true,"chat":true,"matches":true,"swapUpdates":true}'::JSONB,
  swap_preferences JSONB NOT NULL DEFAULT '{"logistics":"flexible","notes":""}'::JSONB,
  security JSONB NOT NULL DEFAULT '{"twoFactorEnabled":false,"method":null,"passkeysEnabled":false}'::JSONB,
  stats JSONB NOT NULL DEFAULT '{"tokens":0,"reputation":"starter","completedSwaps":0,"activeListings":0}'::JSONB,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read public profiles
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (
    (visibility->>'publicProfile')::boolean = true
    OR id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can insert their own profile (on first login)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- 3) Items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('new', 'good', 'used')),
  description TEXT NOT NULL DEFAULT '',
  wishlist TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'swapped')),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  location TEXT DEFAULT '',
  ai_suggested_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  user_final_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Anyone can read active items (or items from public profiles)
CREATE POLICY "items_select_active" ON public.items
  FOR SELECT USING (
    is_active = true
    OR owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Owners can insert their own items
CREATE POLICY "items_insert_own" ON public.items
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Owners can update their own items
CREATE POLICY "items_update_own" ON public.items
  FOR UPDATE TO authenticated
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Owners can delete their own items
CREATE POLICY "items_delete_own" ON public.items
  FOR DELETE TO authenticated
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- 4) Messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  translated BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::JSONB,
  moderated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants can read their own messages
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT TO authenticated
  USING (sender_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Authenticated users can send messages
CREATE POLICY "messages_insert_auth" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- 5) Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'success')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- System can insert notifications (via service role)
CREATE POLICY "notifications_insert_service" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can mark their own notifications as read
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================
-- 6) Swap Intents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.swap_intents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  requester_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  responder_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  responder_item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  logistics JSONB NOT NULL DEFAULT '{"locationType":"public_spot"}'::JSONB,
  notifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_intents ENABLE ROW LEVEL SECURITY;

-- Participants can read their own swap intents
CREATE POLICY "swap_intents_select_participant" ON public.swap_intents
  FOR SELECT TO authenticated
  USING (
    requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR responder_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Authenticated users can create swap intents
CREATE POLICY "swap_intents_insert_auth" ON public.swap_intents
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Participants can update swap intents
CREATE POLICY "swap_intents_update_participant" ON public.swap_intents
  FOR UPDATE TO authenticated
  USING (
    requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR responder_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- ============================================================
-- 7) Swaps (completed/legacy)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.swaps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  intent_id TEXT REFERENCES public.swap_intents(id),
  completed_at TIMESTAMPTZ,
  rating_requester INTEGER CHECK (rating_requester BETWEEN 1 AND 5),
  rating_responder INTEGER CHECK (rating_responder BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swaps_select_auth" ON public.swaps
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 8) Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_items_owner ON public.items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_swap_intents_requester ON public.swap_intents(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_intents_responder ON public.swap_intents(responder_id);

-- ============================================================
-- 9) Grants
-- ============================================================
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;
GRANT INSERT ON public.categories TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT SELECT ON public.items TO anon;

GRANT SELECT, INSERT ON public.messages TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.swap_intents TO authenticated;

GRANT SELECT ON public.swaps TO authenticated;
