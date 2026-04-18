-- Property Wizard: extend items table with property-specific and shared wizard columns
-- Uses IF NOT EXISTS so this is safe to run on any env where object-wizard columns already exist.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS item_type         TEXT    DEFAULT 'object',
  ADD COLUMN IF NOT EXISTS wizard_type       TEXT,
  ADD COLUMN IF NOT EXISTS wizard_step       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category_l1       TEXT,
  ADD COLUMN IF NOT EXISTS category_l2       TEXT,
  ADD COLUMN IF NOT EXISTS category_l3       TEXT,
  ADD COLUMN IF NOT EXISTS condition_details TEXT,
  ADD COLUMN IF NOT EXISTS perceived_value_tier TEXT,
  ADD COLUMN IF NOT EXISTS age_years         INTEGER,
  ADD COLUMN IF NOT EXISTS original_packaging BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags              TEXT[],
  ADD COLUMN IF NOT EXISTS swap_open_to      TEXT,
  ADD COLUMN IF NOT EXISTS swap_wants_description TEXT,
  ADD COLUMN IF NOT EXISTS swap_value_match  TEXT,
  ADD COLUMN IF NOT EXISTS swap_flexibility  TEXT,
  -- Referred to as "chain_swap_allowed" in wizard form state / product docs.
  -- The DB column keeps the "swap_" prefix for consistency with sibling columns.
  ADD COLUMN IF NOT EXISTS swap_chain_allowed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS swap_geo_preference TEXT,
  ADD COLUMN IF NOT EXISTS cross_category_swap BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS swap_partial_allowed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS swap_partial_topup_eur NUMERIC,
  ADD COLUMN IF NOT EXISTS property_data     JSONB;

CREATE INDEX IF NOT EXISTS idx_items_item_type ON public.items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_property_data ON public.items USING gin(property_data)
  WHERE item_type = 'property';
