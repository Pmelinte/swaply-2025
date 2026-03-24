-- =============================================================================
-- pgvector semantic embeddings for items
-- =============================================================================
-- Adds vector embedding column to items table for semantic matching.
-- Uses all-MiniLM-L6-v2 (384 dimensions) via Hugging Face Inference API.
-- =============================================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 3. Create IVFFlat index for fast cosine similarity search
-- Note: IVFFlat requires at least (lists * rows_per_list) rows to build.
-- With lists=100, this works well for 1k-100k items. For <100 items during
-- early stage, queries still work but fall back to sequential scan.
CREATE INDEX IF NOT EXISTS items_embedding_idx
  ON items USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. RPC function: find semantically similar items
CREATE OR REPLACE FUNCTION match_objects(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  filter_city text DEFAULT NULL,
  filter_category text DEFAULT NULL,
  exclude_owner_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  category text,
  owner_id uuid,
  location text,
  match_score float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.category,
    i.owner_id,
    i.location,
    (1 - (i.embedding <=> query_embedding))::float AS match_score
  FROM items i
  WHERE
    i.embedding IS NOT NULL
    AND i.status = 'active'
    AND (exclude_owner_id IS NULL OR i.owner_id != exclude_owner_id)
    AND (filter_city IS NULL OR i.location ILIKE '%' || filter_city || '%')
    AND (filter_category IS NULL OR i.category = filter_category)
    AND (1 - (i.embedding <=> query_embedding)) > match_threshold
  ORDER BY match_score DESC
  LIMIT match_count;
END;
$$;

-- 5. Grant execute to authenticated and anon roles
GRANT EXECUTE ON FUNCTION match_objects TO authenticated;
GRANT EXECUTE ON FUNCTION match_objects TO anon;
