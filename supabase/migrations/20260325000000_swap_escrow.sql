-- Escrow guarantee system for courier-based swaps
-- Holds a small good-faith deposit (15 RON) via Stripe PaymentIntents (manual capture)
-- Released automatically when both parties confirm receipt

CREATE TABLE IF NOT EXISTS swap_escrow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES swaps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount_ron DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'held'
    CHECK (status IN ('held','released','refunded','disputed')),
  held_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup by swap
CREATE INDEX IF NOT EXISTS idx_swap_escrow_swap_id ON swap_escrow(swap_id);
CREATE INDEX IF NOT EXISTS idx_swap_escrow_user_id ON swap_escrow(user_id);
CREATE INDEX IF NOT EXISTS idx_swap_escrow_status ON swap_escrow(status);

-- RLS
ALTER TABLE swap_escrow ENABLE ROW LEVEL SECURITY;

-- Users can view their own escrow records
CREATE POLICY "Users can view own escrow"
  ON swap_escrow FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update (API routes use service key)
CREATE POLICY "Service can manage escrow"
  ON swap_escrow FOR ALL
  USING (true)
  WITH CHECK (true);
