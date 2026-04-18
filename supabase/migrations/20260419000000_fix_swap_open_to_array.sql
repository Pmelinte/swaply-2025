-- PR audit (P2 #4): items.swap_open_to was defined as TEXT but is used
-- semantically as a list of categories the item is open to swap with.
-- Convert the column to TEXT[] and backfill existing rows by splitting
-- on the comma separator that was used by eventWizardSubmit / serviceWizardSubmit.
--
-- Safe re-run: guarded on current column type. If the column is already
-- TEXT[] this migration is a no-op.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'items'
      AND column_name  = 'swap_open_to'
      AND data_type    = 'text'
  ) THEN
    ALTER TABLE public.items
      ALTER COLUMN swap_open_to TYPE text[]
      USING CASE
        WHEN swap_open_to IS NULL OR swap_open_to = '' THEN NULL
        ELSE string_to_array(swap_open_to, ',')
      END;
  END IF;
END $$;

COMMENT ON COLUMN public.items.swap_open_to IS
  'Array of category slugs this item is open to swap with';
