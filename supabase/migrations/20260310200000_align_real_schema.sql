-- Align migration files with the REAL Supabase schema.
-- These columns were added manually via Dashboard but never captured in migrations.
-- Using IF NOT EXISTS / ADD COLUMN IF NOT EXISTS so this is safe to run on existing DBs.

-- ============================================================
-- 1) Profiles: missing columns from real schema
-- ============================================================

-- The real DB uses user_id (UUID) as PK, not id (TEXT).
-- Since we can't safely change PK type in a migration on a live DB,
-- we add the missing columns that the seed and app depend on.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_text TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Set username from display_name for any existing rows that lack it
UPDATE public.profiles
SET username = lower(replace(display_name, ' ', '-'))
WHERE username IS NULL AND display_name IS NOT NULL;

-- Set a fallback for any remaining NULLs
UPDATE public.profiles
SET username = 'user-' || left(id::text, 8)
WHERE username IS NULL;

-- Now make username NOT NULL (matches real DB constraint)
-- Only if the column doesn't already have the constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
      AND column_name = 'username' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
  END IF;
END $$;

-- Unique index on username (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ============================================================
-- 2) Items: missing columns from real schema
-- ============================================================

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS approximate_value NUMERIC;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::JSONB;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS location_city TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS location_country TEXT;

-- ============================================================
-- 3) Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
