-- PR 6: Matching sessions, interests, and saved searches
-- Safe on any env (IF NOT EXISTS + IF NOT EXISTS for policies).

-- ── Active matching sessions (2-slot state per user) ──

CREATE TABLE IF NOT EXISTS public.matching_sessions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  slot_1_item_id  uuid REFERENCES public.items(id) ON DELETE SET NULL,
  slot_2_item_id  uuid REFERENCES public.items(id) ON DELETE SET NULL,
  filters         jsonb DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matching_sessions_user ON public.matching_sessions(user_id);

-- ── Expressed interests (browsing / map / AI → selected profile) ──

CREATE TABLE IF NOT EXISTS public.matching_interests (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id    uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  to_user_id      uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  from_item_id    uuid REFERENCES public.items(id) ON DELETE CASCADE,
  to_item_id      uuid REFERENCES public.items(id) ON DELETE CASCADE,
  match_score     numeric(4,2),
  source          text CHECK (source IN ('browsing', 'map', 'ai')),
  status          text DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'refused', 'chat_started')),
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matching_interests_from ON public.matching_interests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_matching_interests_to   ON public.matching_interests(to_user_id);

-- ── Saved searches for notifications ──

CREATE TABLE IF NOT EXISTS public.saved_matching_searches (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  slot_1_item_id   uuid REFERENCES public.items(id) ON DELETE SET NULL,
  slot_2_item_id   uuid REFERENCES public.items(id) ON DELETE SET NULL,
  filters          jsonb,
  last_notified_at timestamptz,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON public.saved_matching_searches(user_id);

-- ── Row Level Security ──

ALTER TABLE public.matching_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_interests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_matching_searches  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'matching_sessions' AND policyname = 'matching_sessions_own'
  ) THEN
    CREATE POLICY matching_sessions_own ON public.matching_sessions
      FOR ALL USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'matching_interests' AND policyname = 'matching_interests_participants'
  ) THEN
    CREATE POLICY matching_interests_participants ON public.matching_interests
      FOR ALL USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'saved_matching_searches' AND policyname = 'saved_searches_own'
  ) THEN
    CREATE POLICY saved_searches_own ON public.saved_matching_searches
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Auto-update updated_at for matching_sessions ──

CREATE OR REPLACE FUNCTION public.set_matching_session_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matching_session_updated_at ON public.matching_sessions;
CREATE TRIGGER trg_matching_session_updated_at
  BEFORE UPDATE ON public.matching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_matching_session_updated_at();
