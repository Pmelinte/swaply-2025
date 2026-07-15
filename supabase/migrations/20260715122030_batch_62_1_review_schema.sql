-- Batch 62.1: canonical Review schema and idempotency metadata.

alter table public.reviews
  add column if not exists idempotency_key text,
  add column if not exists request_hash text,
  add column if not exists updated_at timestamptz not null default now();

update public.reviews
set request_hash = pg_catalog.md5(
  pg_catalog.jsonb_build_object(
    'swap_id', swap_id,
    'reviewer_id', reviewer_id,
    'reviewed_id', reviewed_id,
    'rating', rating,
    'comment', coalesce(comment, ''),
    'tags', pg_catalog.to_jsonb(coalesce(tags, '{}'::text[])),
    'photos', pg_catalog.to_jsonb(coalesce(photos, '{}'::text[]))
  )::text
)
where request_hash is null;

alter table public.reviews alter column request_hash set not null;

create unique index if not exists reviews_reviewer_idempotency_key_unique
  on public.reviews(reviewer_id, idempotency_key)
  where idempotency_key is not null;
