-- =============================================================================
-- SEO content for programmatic landing pages
-- =============================================================================
-- Stores AI-generated, unique content for category+city intersection pages.
-- Supports page_type variants: 'category_city', 'category', 'city', etc.
-- =============================================================================

CREATE TABLE IF NOT EXISTS seo_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN ('category', 'city', 'category_city', 'category_city_lang')),
  category_slug TEXT,
  city_slug TEXT,
  lang TEXT NOT NULL DEFAULT 'en',
  h1 TEXT NOT NULL,
  intro_paragraph TEXT NOT NULL,
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_type, category_slug, city_slug, lang)
);

-- Index for fast lookups by page type + slugs
CREATE INDEX IF NOT EXISTS seo_content_lookup_idx
  ON seo_content (page_type, category_slug, city_slug, lang);

-- RLS: public read, service-role write
ALTER TABLE seo_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_content_public_read" ON seo_content
  FOR SELECT USING (true);

CREATE POLICY "seo_content_service_write" ON seo_content
  FOR ALL USING (auth.role() = 'service_role');

-- Grant read access
GRANT SELECT ON seo_content TO authenticated;
GRANT SELECT ON seo_content TO anon;
