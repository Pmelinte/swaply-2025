-- Batch 62.1: reviewed participant can update only the public response.

create or replace function public.respond_to_swap_review_v1(
  p_review_id uuid,
  p_response text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_review public.reviews%rowtype;
  v_response text := coalesce(pg_catalog.btrim(p_response), '');
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_review_id is null or char_length(v_response) > 1000 then
    raise exception 'Invalid review response input' using errcode = '22023';
  end if;

  select * into v_review
  from public.reviews
  where id = p_review_id
  for update;

  if not found then
    raise exception 'Review not found' using errcode = 'P0002';
  end if;

  if v_review.reviewed_id <> v_actor_id then
    raise exception 'Only the reviewed participant may respond' using errcode = '42501';
  end if;

  if coalesce(v_review.response, '') = v_response then
    return pg_catalog.jsonb_build_object(
      'review', pg_catalog.to_jsonb(v_review),
      'replayed', true
    );
  end if;

  perform pg_catalog.set_config('swaply.review_authority', 'respond_to_swap_review_v1', true);

  update public.reviews
  set response = nullif(v_response, ''),
      updated_at = pg_catalog.clock_timestamp()
  where id = p_review_id
  returning * into v_review;

  perform pg_catalog.set_config('swaply.review_authority', '', true);

  return pg_catalog.jsonb_build_object(
    'review', pg_catalog.to_jsonb(v_review),
    'replayed', false
  );
end;
$function$;
