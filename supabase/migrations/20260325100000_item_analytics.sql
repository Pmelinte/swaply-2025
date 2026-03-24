-- Item-level analytics tracking table
CREATE TABLE IF NOT EXISTS item_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'view', 'favorite', 'unfavorite', 'inquiry', 'match',
    'swap_proposed', 'swap_accepted', 'swap_completed'
  )),
  visitor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_item_analytics_item_id ON item_analytics(item_id);
CREATE INDEX IF NOT EXISTS idx_item_analytics_visitor_id ON item_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_item_analytics_event_type ON item_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_item_analytics_created_at ON item_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_analytics_item_event ON item_analytics(item_id, event_type);

-- RLS policies
ALTER TABLE item_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (including anonymous visitors)
CREATE POLICY "Anyone can insert item analytics"
  ON item_analytics FOR INSERT
  WITH CHECK (true);

-- Users can read analytics for their own items
CREATE POLICY "Owners can read their item analytics"
  ON item_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM items
      WHERE items.id = item_analytics.item_id
        AND items.owner_id = auth.uid()
    )
  );
