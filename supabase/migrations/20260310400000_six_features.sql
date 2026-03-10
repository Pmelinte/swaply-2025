-- Migration: 6 new features
-- 1) Reviews/ratings table (public post-swap feedback)
-- 2) Swap chains (multi-party circular swaps)
-- 3) Identity verification table
-- 4) Enhanced full-text search with ts_rank
-- 5) Image gallery metadata
-- 6) Real-time swap_intents for live notifications

-- ============================================================
-- 1) Reviews — public post-swap ratings & comments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  swap_id TEXT NOT NULL REFERENCES public.swap_intents(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],  -- e.g. 'punctual', 'honest', 'communicative'
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  response TEXT DEFAULT NULL,  -- reviewed user can respond
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(swap_id, reviewer_id)  -- one review per swap per reviewer
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews (public reputation)
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

-- Authenticated users can create reviews for their swaps
CREATE POLICY "reviews_insert_participant" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Reviewed user can add a response
CREATE POLICY "reviews_update_response" ON public.reviews
  FOR UPDATE TO authenticated
  USING (reviewed_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT ON public.reviews TO authenticated, anon;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON public.reviews(reviewed_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_swap ON public.reviews(swap_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at DESC);

-- RPC: get_user_rating — average rating and count for a user
CREATE OR REPLACE FUNCTION public.get_user_rating(target_user_id TEXT)
RETURNS TABLE(avg_rating NUMERIC, review_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(AVG(rating)::NUMERIC, 0), COUNT(*)
  FROM public.reviews
  WHERE reviewed_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2) Swap chains — multi-party circular swaps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.swap_chains (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL DEFAULT 'Lanț de schimb',
  status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  initiator_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_chains ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.swap_chain_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  chain_id TEXT NOT NULL REFERENCES public.swap_chains(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,  -- order in the chain
  giver_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chain_id, position)
);

ALTER TABLE public.swap_chain_links ENABLE ROW LEVEL SECURITY;

-- Participants can view chains they're part of
CREATE POLICY "chains_select_participant" ON public.swap_chains
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT chain_id FROM public.swap_chain_links
      WHERE giver_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR receiver_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR initiator_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "chains_insert_auth" ON public.swap_chains
  FOR INSERT TO authenticated
  WITH CHECK (initiator_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "chains_update_participant" ON public.swap_chains
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT chain_id FROM public.swap_chain_links
      WHERE giver_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR receiver_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR initiator_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "chain_links_select_participant" ON public.swap_chain_links
  FOR SELECT TO authenticated
  USING (
    giver_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR receiver_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR chain_id IN (
      SELECT chain_id FROM public.swap_chain_links
      WHERE giver_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR receiver_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "chain_links_insert_auth" ON public.swap_chain_links
  FOR INSERT TO authenticated
  WITH CHECK (
    chain_id IN (
      SELECT id FROM public.swap_chains
      WHERE initiator_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
    OR giver_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "chain_links_update_own" ON public.swap_chain_links
  FOR UPDATE TO authenticated
  USING (
    giver_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR receiver_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

GRANT SELECT, INSERT, UPDATE ON public.swap_chains TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.swap_chain_links TO authenticated;

CREATE INDEX IF NOT EXISTS idx_chain_links_chain ON public.swap_chain_links(chain_id, position);
CREATE INDEX IF NOT EXISTS idx_chain_links_giver ON public.swap_chain_links(giver_id);
CREATE INDEX IF NOT EXISTS idx_chain_links_receiver ON public.swap_chain_links(receiver_id);

-- ============================================================
-- 3) Identity verification
-- ============================================================
CREATE TABLE IF NOT EXISTS public.verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'id_document', 'selfie', 'address')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_at TIMESTAMPTZ DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,  -- phone number, document type, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verifications_select_own" ON public.verifications
  FOR SELECT TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "verifications_insert_own" ON public.verifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "verifications_update_own" ON public.verifications
  FOR UPDATE TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT, UPDATE ON public.verifications TO authenticated;

CREATE INDEX IF NOT EXISTS idx_verifications_user ON public.verifications(user_id, type);

-- Add verification counts to profiles for fast badge display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_badges TEXT[] DEFAULT ARRAY[]::TEXT[];

-- RPC: count verified checks for badge computation
CREATE OR REPLACE FUNCTION public.get_verification_count(target_user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.verifications WHERE user_id = target_user_id AND status = 'verified')::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4) Enhanced full-text search RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_items(
  query TEXT,
  category_filter TEXT DEFAULT NULL,
  condition_filter TEXT DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  max_results INTEGER DEFAULT 50,
  offset_val INTEGER DEFAULT 0
)
RETURNS TABLE(
  id TEXT, title TEXT, category TEXT, condition TEXT, description TEXT,
  location TEXT, photos TEXT[], owner_id TEXT, status TEXT,
  created_at TIMESTAMPTZ, relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id, i.title, i.category, i.condition, i.description,
    i.location, i.photos, i.owner_id, i.status,
    i.created_at,
    ts_rank(i.search_vector, plainto_tsquery('simple', query))::REAL AS relevance
  FROM public.items i
  WHERE i.is_active = true
    AND i.deleted_at IS NULL
    AND i.status = 'active'
    AND (query = '' OR i.search_vector @@ plainto_tsquery('simple', query) OR i.title ILIKE '%' || query || '%')
    AND (category_filter IS NULL OR i.category = category_filter)
    AND (condition_filter IS NULL OR i.condition = condition_filter)
    AND (location_filter IS NULL OR i.location ILIKE '%' || location_filter || '%')
  ORDER BY
    CASE WHEN query = '' THEN 0 ELSE ts_rank(i.search_vector, plainto_tsquery('simple', query)) END DESC,
    i.created_at DESC
  LIMIT max_results OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5) Image gallery metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS public.item_images (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  caption TEXT DEFAULT '',
  width INTEGER DEFAULT NULL,
  height INTEGER DEFAULT NULL,
  size_bytes INTEGER DEFAULT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images of active items
CREATE POLICY "images_select_active" ON public.item_images
  FOR SELECT USING (
    item_id IN (SELECT id FROM public.items WHERE is_active = true AND deleted_at IS NULL)
  );

CREATE POLICY "images_insert_own" ON public.item_images
  FOR INSERT TO authenticated
  WITH CHECK (
    item_id IN (
      SELECT id FROM public.items
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "images_delete_own" ON public.item_images
  FOR DELETE TO authenticated
  USING (
    item_id IN (
      SELECT id FROM public.items
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "images_update_own" ON public.item_images
  FOR UPDATE TO authenticated
  USING (
    item_id IN (
      SELECT id FROM public.items
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

GRANT SELECT ON public.item_images TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.item_images TO authenticated;

CREATE INDEX IF NOT EXISTS idx_item_images_item ON public.item_images(item_id, position);

-- ============================================================
-- 6) Enable Realtime on swap_intents for live swap notifications
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'swap_intents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_intents;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  END IF;
END $$;
