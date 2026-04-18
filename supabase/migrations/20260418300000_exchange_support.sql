-- PR 8: Exchange page support
-- Extends swaps table + creates swap_support_services

ALTER TABLE swaps
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations(id),
  ADD COLUMN IF NOT EXISTS exchange_data   jsonb          DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pdf_url         text,
  ADD COLUMN IF NOT EXISTS confirmed_by    uuid[]         DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed_at    timestamptz;

CREATE TABLE IF NOT EXISTS swap_support_services (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  swap_id      uuid REFERENCES swaps(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid REFERENCES profiles(user_id)           NOT NULL,
  service_type text NOT NULL CHECK (service_type IN (
    'escrow', 'packaging', 'transport', 'accommodation',
    'restaurant', 'insurance', 'legal', 'ai_valuation'
  )),
  is_bilateral boolean DEFAULT false,
  provider     text,
  details      jsonb  DEFAULT '{}',
  cost_eur     numeric(10,2),
  status       text   DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'completed', 'cancelled'
  )),
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS swap_support_services_swap_idx  ON swap_support_services(swap_id);
CREATE INDEX IF NOT EXISTS swap_support_services_user_idx  ON swap_support_services(user_id);

ALTER TABLE swap_support_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants can manage their own services"
  ON swap_support_services FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "participants can read partner services"
  ON swap_support_services FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM swaps s
      WHERE s.id = swap_id
        AND (s.requester_id = auth.uid() OR s.responder_id = auth.uid())
    )
  );
