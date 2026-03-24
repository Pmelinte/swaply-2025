-- Swap shipments — courier tracking and delivery confirmation
-- 20260324000000_swap_shipments.sql

CREATE TABLE IF NOT EXISTS public.swap_shipments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  swap_id TEXT NOT NULL REFERENCES public.swap_intents(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('a_to_b', 'b_to_a')),
  courier TEXT, -- FanCourier, Sameday, Cargus, DHL, etc.
  awb TEXT,
  tracking_url TEXT,
  estimated_cost DECIMAL(10,2),
  paid_by TEXT CHECK (paid_by IN ('sender', 'receiver', 'split')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'picked_up', 'in_transit', 'delivered', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_shipments ENABLE ROW LEVEL SECURITY;

-- Both swap participants can view shipments for their swaps
CREATE POLICY "shipment_select_participants" ON public.swap_shipments
  FOR SELECT TO authenticated
  USING (
    swap_id IN (
      SELECT id FROM public.swap_intents
      WHERE requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR responder_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Only swap participants can create shipments
CREATE POLICY "shipment_insert_participants" ON public.swap_shipments
  FOR INSERT TO authenticated
  WITH CHECK (
    swap_id IN (
      SELECT id FROM public.swap_intents
      WHERE requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR responder_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Only swap participants can update shipments
CREATE POLICY "shipment_update_participants" ON public.swap_shipments
  FOR UPDATE TO authenticated
  USING (
    swap_id IN (
      SELECT id FROM public.swap_intents
      WHERE requester_id = current_setting('request.jwt.claims', true)::json->>'sub'
         OR responder_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.swap_shipments TO authenticated;

CREATE INDEX IF NOT EXISTS idx_swap_shipments_swap ON public.swap_shipments(swap_id);
CREATE INDEX IF NOT EXISTS idx_swap_shipments_status ON public.swap_shipments(status)
  WHERE status IN ('pending', 'picked_up', 'in_transit');
CREATE INDEX IF NOT EXISTS idx_swap_shipments_awb ON public.swap_shipments(awb)
  WHERE awb IS NOT NULL;
