-- Bundle builder: track items bundled in a swap with value estimation and post-acceptance lock

CREATE TABLE IF NOT EXISTS swap_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES swaps(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('requester', 'responder')),
  item_ids UUID[] NOT NULL,
  notes TEXT,
  total_estimated_value DECIMAL(10,2),
  locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_swap_bundles_swap ON swap_bundles(swap_id);
CREATE INDEX IF NOT EXISTS idx_swap_bundles_locked ON swap_bundles(locked) WHERE locked = true;

-- RLS
ALTER TABLE swap_bundles ENABLE ROW LEVEL SECURITY;

-- Participants + admins can view
CREATE POLICY bundles_select ON swap_bundles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM swaps s
    WHERE s.id = swap_id
    AND (s.requester_id = auth.uid() OR s.responder_id = auth.uid())
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
);

-- Participants can insert (before lock)
CREATE POLICY bundles_insert ON swap_bundles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM swaps s
    WHERE s.id = swap_id
    AND (s.requester_id = auth.uid() OR s.responder_id = auth.uid())
    AND s.status = 'pending'
  )
);

-- Update only when not locked (for adding items or locking)
CREATE POLICY bundles_update ON swap_bundles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM swaps s
    WHERE s.id = swap_id
    AND (s.requester_id = auth.uid() OR s.responder_id = auth.uid())
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
);
