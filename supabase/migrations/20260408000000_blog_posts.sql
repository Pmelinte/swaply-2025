-- Blog posts table for storing blog content in Supabase
-- Source: English .mdx files from src/content/blog/

CREATE TABLE IF NOT EXISTS blog_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL,
  locale      text NOT NULL DEFAULT 'en',
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  date        date NOT NULL,
  author      text NOT NULL DEFAULT 'Swaply Team',
  category    text NOT NULL DEFAULT '',
  tags        text[] NOT NULL DEFAULT '{}',
  cover_image text,
  seo_keyword text NOT NULL DEFAULT '',
  read_time   text NOT NULL DEFAULT '',
  content     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (slug, locale)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_locale ON blog_posts (locale);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts (locale, category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_date ON blog_posts (locale, date DESC);

-- Allow public read access (blog content is public)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog posts are publicly readable"
  ON blog_posts FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage blog posts"
  ON blog_posts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
