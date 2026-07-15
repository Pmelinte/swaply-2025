-- Batch 62.1: bound Review payloads at the database layer.

do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_comment_length_check'
  ) then
    alter table public.reviews
      add constraint reviews_comment_length_check
      check (char_length(comment) <= 1000);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_tags_count_check'
  ) then
    alter table public.reviews
      add constraint reviews_tags_count_check
      check (pg_catalog.cardinality(coalesce(tags, '{}'::text[])) <= 5);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_photos_count_check'
  ) then
    alter table public.reviews
      add constraint reviews_photos_count_check
      check (pg_catalog.cardinality(coalesce(photos, '{}'::text[])) <= 3);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_distinct_participants_check'
  ) then
    alter table public.reviews
      add constraint reviews_distinct_participants_check
      check (reviewer_id <> reviewed_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.reviews'::regclass
      and conname = 'reviews_idempotency_key_length_check'
  ) then
    alter table public.reviews
      add constraint reviews_idempotency_key_length_check
      check (idempotency_key is null or char_length(idempotency_key) between 8 and 200);
  end if;
end
$constraints$;
