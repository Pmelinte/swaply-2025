-- ============================================================
-- Swaply Payments Migration
-- 10 monetization integrations: Stripe, PayPal, Courier, Ads, API
-- ============================================================

-- 1. Payment transactions (Stripe + PayPal)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  provider_id TEXT, -- Stripe session/intent ID or PayPal order ID
  type TEXT NOT NULL CHECK (type IN (
    'token_purchase', 'subscription', 'boost_24h', 'featured_48h',
    'super_boost_7d', 'swap_insurance', 'business_upgrade', 'api_subscription'
  )),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider, provider_id);

-- 2. Courier shipments (FanCourier, Sameday, Cargus)
CREATE TABLE IF NOT EXISTS courier_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID NOT NULL REFERENCES swap_intents(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('fancourier', 'sameday', 'cargus')),
  awb_number TEXT,
  sender_data JSONB NOT NULL DEFAULT '{}',
  receiver_data JSONB NOT NULL DEFAULT '{}',
  weight_kg NUMERIC(6,2) NOT NULL DEFAULT 1,
  base_cost_ron NUMERIC(10,2) NOT NULL DEFAULT 0,
  swaply_fee_ron NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost_ron NUMERIC(10,2) NOT NULL DEFAULT 0,
  tracking_url TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
    'created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned'
  )),
  estimated_delivery DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courier_shipments_swap ON courier_shipments(swap_id);
CREATE INDEX IF NOT EXISTS idx_courier_shipments_awb ON courier_shipments(awb_number);

-- 3. API keys for white-label / API access
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My App',
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (tier IN ('starter', 'business', 'enterprise')),
  monthly_limit INTEGER NOT NULL DEFAULT 10000,
  current_usage INTEGER NOT NULL DEFAULT 0,
  per_swap_fee NUMERIC(6,2) NOT NULL DEFAULT 0.50,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- 4. API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  status_code INTEGER NOT NULL DEFAULT 200,
  response_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(created_at);

-- 5. Ad impressions tracking (for revenue reporting)
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  placement TEXT NOT NULL,
  ad_provider TEXT NOT NULL DEFAULT 'internal',
  clicked BOOLEAN NOT NULL DEFAULT false,
  revenue_micro_usd INTEGER NOT NULL DEFAULT 0, -- in micro-dollars (1/1000000)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_date ON ad_impressions(created_at);

-- 6. Stripe customer mapping (for subscription management)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paypal_payer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 7. Revenue summary view
CREATE OR REPLACE VIEW revenue_daily AS
SELECT
  DATE(created_at) AS day,
  provider,
  type,
  COUNT(*) AS transaction_count,
  SUM(amount_cents) AS total_cents,
  SUM(CASE WHEN status = 'completed' THEN amount_cents ELSE 0 END) AS completed_cents
FROM payment_transactions
GROUP BY DATE(created_at), provider, type
ORDER BY day DESC;

-- 8. Courier revenue view
CREATE OR REPLACE VIEW courier_revenue_daily AS
SELECT
  DATE(created_at) AS day,
  provider,
  COUNT(*) AS shipment_count,
  SUM(swaply_fee_ron) AS total_fee_ron,
  SUM(total_cost_ron) AS total_cost_ron
FROM courier_shipments
WHERE status != 'returned'
GROUP BY DATE(created_at), provider
ORDER BY day DESC;

-- 9. RLS policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

-- Users can see their own payment transactions
CREATE POLICY payment_transactions_own ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can see courier shipments for their swaps
CREATE POLICY courier_shipments_own ON courier_shipments
  FOR SELECT USING (
    swap_id IN (
      SELECT id FROM swap_intents
      WHERE requester_id = auth.uid() OR responder_id = auth.uid()
    )
  );

-- Users can manage their own API keys
CREATE POLICY api_keys_own ON api_keys
  FOR ALL USING (auth.uid() = owner_id);

-- Users can see their own API usage
CREATE POLICY api_usage_own ON api_usage
  FOR SELECT USING (
    api_key_id IN (SELECT id FROM api_keys WHERE owner_id = auth.uid())
  );

-- 10. Reset API usage monthly (cron job helper)
CREATE OR REPLACE FUNCTION reset_api_usage_monthly()
RETURNS void AS $$
BEGIN
  UPDATE api_keys SET current_usage = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
