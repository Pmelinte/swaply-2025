-- Monetization tables migration
-- 20260219100000_monetization.sql

-- ============================================================
-- 1) Subscriptions — track user plan state
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'premium', 'platinum')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, UPDATE ON public.subscriptions TO authenticated;

-- ============================================================
-- 2) Referrals — track referral program
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  referrer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_email TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'first_swap')),
  tokens_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_own" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "referrals_insert_own" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (referrer_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT ON public.referrals TO authenticated;

CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- ============================================================
-- 3) Login streaks — daily reward tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.login_streaks (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  today_claimed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.login_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select_own" ON public.login_streaks
  FOR SELECT TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "streaks_upsert_own" ON public.login_streaks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "streaks_update_own" ON public.login_streaks
  FOR UPDATE TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT, UPDATE ON public.login_streaks TO authenticated;

-- ============================================================
-- 4) Featured listings — promoted items on homepage
-- ============================================================
CREATE TABLE IF NOT EXISTS public.featured_listings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_select_all" ON public.featured_listings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "featured_insert_own" ON public.featured_listings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT ON public.featured_listings TO authenticated;

CREATE INDEX IF NOT EXISTS idx_featured_expires ON public.featured_listings(expires_at)
  WHERE expires_at > now();

-- ============================================================
-- 5) Swap insurance policies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.swap_insurance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  swap_id TEXT NOT NULL REFERENCES public.swap_intents(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cost INTEGER NOT NULL,
  coverage_amount TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insurance_select_own" ON public.swap_insurance
  FOR SELECT TO authenticated
  USING (buyer_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "insurance_insert_own" ON public.swap_insurance
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT ON public.swap_insurance TO authenticated;

-- ============================================================
-- 6) Token gifts — peer-to-peer token transfers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.token_gifts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 5 AND amount <= 1000),
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.token_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gifts_select_own" ON public.token_gifts
  FOR SELECT TO authenticated
  USING (
    sender_id = current_setting('request.jwt.claims', true)::json->>'sub'
    OR recipient_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

CREATE POLICY "gifts_insert_sender" ON public.token_gifts
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT ON public.token_gifts TO authenticated;

-- ============================================================
-- 7) Seasonal promotions — admin-managed time-limited offers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seasonal_promotions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  promo_type TEXT NOT NULL CHECK (promo_type IN ('token_multiplier', 'shop_discount', 'bonus_tokens', 'free_boost')),
  multiplier DECIMAL,
  discount_percent INTEGER,
  bonus_tokens INTEGER,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seasonal_promotions ENABLE ROW LEVEL SECURITY;

-- Everyone can view promotions
CREATE POLICY "promotions_select_all" ON public.seasonal_promotions
  FOR SELECT USING (true);

GRANT SELECT ON public.seasonal_promotions TO authenticated, anon;

CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.seasonal_promotions(starts_at, ends_at)
  WHERE active = true;

-- ============================================================
-- 8) Item auctions — bidding on items (platinum feature)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.item_auctions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ends_at TIMESTAMPTZ NOT NULL,
  min_bid_tokens INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id)
);

ALTER TABLE public.item_auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auctions_select_all" ON public.item_auctions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auctions_insert_own" ON public.item_auctions
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "auctions_update_own" ON public.item_auctions
  FOR UPDATE TO authenticated
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT, UPDATE ON public.item_auctions TO authenticated;

CREATE TABLE IF NOT EXISTS public.auction_bids (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  auction_id TEXT NOT NULL REFERENCES public.item_auctions(id) ON DELETE CASCADE,
  bidder_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offered_item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
  offered_item_title TEXT NOT NULL DEFAULT '',
  token_bid INTEGER NOT NULL DEFAULT 0,
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bids_select_auction" ON public.auction_bids
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "bids_insert_own" ON public.auction_bids
  FOR INSERT TO authenticated
  WITH CHECK (bidder_id = current_setting('request.jwt.claims', true)::json->>'sub');

GRANT SELECT, INSERT ON public.auction_bids TO authenticated;

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction ON public.auction_bids(auction_id, created_at DESC);

-- ============================================================
-- 9) Profile purchased themes tracking
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS purchased_themes TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_theme TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claimed_milestones INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claimed_loyalty INTEGER[] DEFAULT ARRAY[]::INTEGER[];

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;

-- ============================================================
-- 10) Item analytics — view/match/inquiry counters
-- ============================================================
CREATE TABLE IF NOT EXISTS public.item_analytics (
  item_id TEXT PRIMARY KEY REFERENCES public.items(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  matches INTEGER NOT NULL DEFAULT 0,
  inquiries INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.item_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_select_own" ON public.item_analytics
  FOR SELECT TO authenticated
  USING (
    item_id IN (
      SELECT id FROM public.items
      WHERE owner_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

GRANT SELECT ON public.item_analytics TO authenticated;

-- RPC to increment view count (called from API)
CREATE OR REPLACE FUNCTION public.increment_item_view(target_item_id TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.item_analytics (item_id, views, updated_at)
  VALUES (target_item_id, 1, now())
  ON CONFLICT (item_id) DO UPDATE
  SET views = item_analytics.views + 1, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
