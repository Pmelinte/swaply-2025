-- Batch 62.1 follow-up: browser roles may only read Reviews.

revoke all on table public.reviews from public, anon, authenticated;
grant select on table public.reviews to anon, authenticated;
