-- Swap chains: multi-party circular swaps (A→B→C→A)
CREATE TABLE IF NOT EXISTS swap_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  status TEXT DEFAULT 'forming'
    CHECK (status IN ('forming','locked','in_progress','completed','cancelled')),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swap_chain_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES swap_chains(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  giver_id UUID REFERENCES auth.users(id),
  receiver_id UUID REFERENCES auth.users(id),
  item_id UUID,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast chain lookups
CREATE INDEX IF NOT EXISTS idx_chain_links_chain_id ON swap_chain_links(chain_id);
CREATE INDEX IF NOT EXISTS idx_chain_links_giver ON swap_chain_links(giver_id);
CREATE INDEX IF NOT EXISTS idx_chain_links_receiver ON swap_chain_links(receiver_id);
CREATE INDEX IF NOT EXISTS idx_swap_chains_status ON swap_chains(status);

-- RLS
ALTER TABLE swap_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_chain_links ENABLE ROW LEVEL SECURITY;

-- Participants can view chains they're part of
CREATE POLICY "chain_participant_select" ON swap_chains FOR SELECT USING (
  created_by = auth.uid()
  OR id IN (
    SELECT chain_id FROM swap_chain_links
    WHERE giver_id = auth.uid() OR receiver_id = auth.uid()
  )
);

-- Any authenticated user can create a chain
CREATE POLICY "chain_insert" ON swap_chains FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- Only creator can update chain status
CREATE POLICY "chain_update" ON swap_chains FOR UPDATE USING (
  created_by = auth.uid()
);

-- Links: participants can view
CREATE POLICY "link_participant_select" ON swap_chain_links FOR SELECT USING (
  giver_id = auth.uid()
  OR receiver_id = auth.uid()
  OR chain_id IN (SELECT id FROM swap_chains WHERE created_by = auth.uid())
);

-- Creator can insert links
CREATE POLICY "link_insert" ON swap_chain_links FOR INSERT WITH CHECK (
  chain_id IN (SELECT id FROM swap_chains WHERE created_by = auth.uid())
);

-- Participants can confirm their own links
CREATE POLICY "link_confirm_update" ON swap_chain_links FOR UPDATE USING (
  giver_id = auth.uid() OR receiver_id = auth.uid()
);
