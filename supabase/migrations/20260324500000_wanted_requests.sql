-- Wanted requests: users post what they're looking for
CREATE TABLE IF NOT EXISTS wanted_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  city TEXT,
  offer_description TEXT,
  offer_item_ids UUID[],
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','fulfilled','expired','cancelled')),
  expires_at TIMESTAMPTZ DEFAULT now() + interval '30 days',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wanted_requests_user ON wanted_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wanted_requests_status ON wanted_requests(status);
CREATE INDEX IF NOT EXISTS idx_wanted_requests_category ON wanted_requests(category);

-- RLS
ALTER TABLE wanted_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view active requests
CREATE POLICY "wanted_select_active" ON wanted_requests FOR SELECT USING (
  status = 'active' OR user_id = auth.uid()
);

-- Authenticated users can create
CREATE POLICY "wanted_insert" ON wanted_requests FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Owners can update their own
CREATE POLICY "wanted_update_own" ON wanted_requests FOR UPDATE USING (
  user_id = auth.uid()
);

-- Owners can delete their own
CREATE POLICY "wanted_delete_own" ON wanted_requests FOR DELETE USING (
  user_id = auth.uid()
);
