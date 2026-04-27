-- Fix seed titles: replace sale/selling language with swap language
-- Run manually in Supabase SQL editor or via the fix-titles workflow

-- Replace "for Sale" / "for sale" / "For Sale" variants in titles
UPDATE items SET title = REPLACE(title, 'for Sale', 'for Swap') WHERE title ILIKE '%for Sale%';
UPDATE items SET title = REPLACE(title, 'for sale', 'for swap') WHERE title ILIKE '%for sale%';
UPDATE items SET title = REPLACE(title, 'For Sale', 'for Swap') WHERE title ILIKE '%For Sale%';

-- Replace sale/selling language in descriptions
UPDATE items SET description = REPLACE(description, 'for sale', 'for swap') WHERE description ILIKE '%for sale%';
UPDATE items SET description = REPLACE(description, 'For Sale', 'for Swap') WHERE description ILIKE '%For Sale%';
UPDATE items SET description = REPLACE(description, 'selling', 'trading') WHERE description ILIKE '%selling%';
UPDATE items SET description = REPLACE(description, 'Selling', 'Trading') WHERE description ILIKE '%Selling%';

-- Remove exact duplicates per owner (keep the oldest row by created_at)
DELETE FROM items
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY LOWER(title), owner_id
        ORDER BY created_at ASC
      ) AS rn
    FROM items
  ) ranked
  WHERE rn > 1
);
