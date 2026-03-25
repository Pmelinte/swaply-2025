-- Add translations JSONB column to items table for cached auto-translations
-- Structure: { "en": { "title": "...", "description": "..." }, "de": {...} }
ALTER TABLE items
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- Index for faster JSONB key lookups
CREATE INDEX IF NOT EXISTS idx_items_translations ON items USING gin (translations);
