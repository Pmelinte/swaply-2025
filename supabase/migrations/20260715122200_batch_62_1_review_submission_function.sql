-- Batch 62.1: canonical participant-only and idempotent Review submission.

create or replace function public.submit_swap_review_v1(
  p_swap_id uuid,
  p_rating integer,
  p_comment text default '',
  p_tags text[] default '{}'::text[],
  p_photos text[] default '{}'::text[],
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_review public.reviews%rowtype;
  v_key_review public.reviews%rowtype;
  v_reviewed_id uuid;
  v_comment text := coalesce(pg_catalog.btrim(p_comment), '');
  v_tags text[] := coalesce(p_tags, '{}'::text[]);
  v_photos text[] := coalesce(p_photos, '{}'::text[]);
  v_key text := pg_catalog.btrim(coalesce(p_idempotency_key, ''));
  v_hash text;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_swap_id is null or p_rating is null or p_rating not between 1 and 5
     or char_length(v_comment) > 1000
     or pg_catalog.cardinality(v_tags) > 5
     or pg_catalog.cardinality(v_photos) > 3
     or char_length(v_key) not between 8 and 200 then
    raise exception 'Invalid review input' using errcode = '22023';
  end if;

  select * into v_swap
  from public.swaps
  where id = p_swap_id
  for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if v_swap.status <> 'completed' then
    raise exception 'Reviews require a completed swap' using errcode = '23514';
  end if;

  if v_actor_id = v_swap.requester_id then
    v_reviewed_id := v_swap.responder_id;
  elsif v_actor_id = v_swap.responder_id then
    v_reviewed_id := v_swap.requester_id;
  else
    raise exception 'Actor is not a swap participant' using errcode = '42501';
  end if;

  v_hash := pg_catalog.md5(
    pg_catalog.jsonb_build_object(
      'swap_id', p_swap_id,
      'reviewer_id', v_actor_id,
      'reviewed_id', v_reviewed_id,
      'rating', p_rating,
      'comment', v_comment,
      'tags', pg_catalog.to_jsonb(v_tags),
      'photos', pg_catalog.to_jsonb(v_photos)
    )::text
  );

  select * into v_key_review
  from public.reviews
  where reviewer_id = v_actor_id and idempotency_key = v_key;

  if found then
    if v_key_review.swap_id <> p_swap_id or v_key_review.request_hash <> v_hash then
      raise exception 'Idempotency key conflict' using errcode = '22023';
    end if;

    return pg_catalog.jsonb_build_object(
      'review', pg_catalog.to_jsonb(v_key_review),
      'replayed', true,
      'idempotency_key', v_key
    );
  end if;

  select * into v_review
  from public.reviews
  where swap_id = p_swap_id and reviewer_id = v_actor_id
  for update;

  if found then
    if v_review.request_hash = v_hash then
      return pg_catalog.jsonb_build_object(
        'review', pg_catalog.to_jsonb(v_review),
        'replayed', true,
        'idempotency_key', coalesce(v_review.idempotency_key, v_key)
      );
    end if;

    raise exception 'Review already submitted with different content' using errcode = '23505';
  end if;

  perform pg_catalog.set_config('swaply.review_authority', 'submit_swap_review_v1', true);

  insert into public.reviews (
    swap_id, reviewer_id, reviewed_id, rating, comment, tags, photos,
    idempotency_key, request_hash, updated_at
  ) values (
    p_swap_id, v_actor_id, v_reviewed_id, p_rating, v_comment, v_tags, v_photos,
    v_key, v_hash, pg_catalog.clock_timestamp()
  )
  returning * into v_review;

  perform pg_catalog.set_config('swaply.review_authority', '', true);

  return pg_catalog.jsonb_build_object(
    'review', pg_catalog.to_jsonb(v_review),
    'replayed', false,
    'idempotency_key', v_key
  );
end;
$function$;
