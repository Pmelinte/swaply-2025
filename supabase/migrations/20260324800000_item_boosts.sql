-- =============================================================================
-- Item boosts — Stripe-paid visibility promotion for items
-- =============================================================================
-- Tracks boost purchases, durations, payment status, and active periods.
-- Used by the listing sort to surface boosted items first.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.item_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  duration_hours INTEGER NOT NULL CHECK (duration_hours IN (24, 72, 168)),
  price_ron DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (stripe_payment_status IN ('pending', 'succeeded', 'failed', 'canceled')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.item_boosts ENABLE ROW LEVEL SECURITY;

-- Anyone can see active boosts (needed for badge display)
CREATE POLICY "item_boosts_select_all" ON public.item_boosts
  FOR SELECT USING (true);

-- Users can insert their own boosts
CREATE POLICY "item_boosts_insert_own" ON public.item_boosts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Service role can update (webhook sets status)
CREATE POLICY "item_boosts_service_update" ON public.item_boosts
  FOR UPDATE USING (true);

GRANT SELECT ON public.item_boosts TO anon;
GRANT SELECT, INSERT ON public.item_boosts TO authenticated;

-- Fast lookup: active boosts for a given item
CREATE INDEX IF NOT EXISTS idx_item_boosts_active
  ON public.item_boosts (item_id, expires_at)
  WHERE stripe_payment_status = 'succeeded';

-- Fast lookup: by payment intent (webhook)
CREATE INDEX IF NOT EXISTS idx_item_boosts_intent
  ON public.item_boosts (stripe_payment_intent_id);
