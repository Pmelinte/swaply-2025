-- Add translations JSONB column to items table for caching auto-translated content
-- Structure: { "en": { "title": "...", "description": "..." }, "de": {...} }
ALTER TABLE items
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- Index for checking if a specific locale translation exists
CREATE INDEX IF NOT EXISTS idx_items_translations_gin ON items USING GIN (translations);
