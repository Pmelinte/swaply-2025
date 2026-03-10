-- Reload PostgREST schema cache to fix "Could not find the 'id' column of 'profiles' in the schema cache"
-- This happens when PostgREST's cached schema becomes stale after migrations.
NOTIFY pgrst, 'reload schema';
