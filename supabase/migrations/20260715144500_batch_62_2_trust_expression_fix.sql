begin;

-- LEAST and GREATEST are PostgreSQL expressions, not schema-qualified
-- pg_catalog functions. Keep the touched-user trust calculation null-safe.
create or replace function public.calculate_trust_score(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_score integer := 0;
  v_level text;
  v_completed integer := 0;
  v_cancelled integer := 0;
  v_disputed integer := 0;
  v_id_verified boolean := false;
  v_phone_verified boolean := false;
  v_rating numeric := 0;
  v_response_rate integer := 0;
begin
  select
    coalesce(swaps_completed, 0),
    coalesce(swaps_cancelled, 0),
    coalesce(swaps_disputed, 0),
    coalesce(id_verified, false),
    coalesce(phone_verified, false),
    coalesce(rating, 0),
    coalesce(response_rate_pct, 0)
  into
    v_completed,
    v_cancelled,
    v_disputed,
    v_id_verified,
    v_phone_verified,
    v_rating,
    v_response_rate
  from public.profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  v_score := v_score + least(v_completed * 20, 400);
  v_score := v_score - (v_cancelled * 10);
  v_score := v_score - (v_disputed * 25);

  if v_id_verified then
    v_score := v_score + 150;
  end if;
  if v_phone_verified then
    v_score := v_score + 50;
  end if;
  if v_rating > 0 then
    v_score := v_score + (v_rating * 40)::integer;
  end if;
  v_score := v_score + v_response_rate;

  v_score := greatest(0, least(1000, v_score));
  v_level := case
    when v_score >= 800 then 'ambassador'
    when v_score >= 500 then 'trusted'
    when v_score >= 200 then 'verified'
    else 'starter'
  end;

  update public.profiles
     set trust_score = v_score,
         trust_level = v_level,
         stats = pg_catalog.jsonb_set(
           coalesce(stats, '{}'::jsonb),
           '{reputation}',
           pg_catalog.to_jsonb(v_level),
           true
         ),
         updated_at = pg_catalog.clock_timestamp()
   where user_id = p_user_id;
end;
$function$;

revoke execute on function public.calculate_trust_score(uuid)
  from public, anon, authenticated;

comment on function public.calculate_trust_score(uuid) is
  'Batch 62.2 null-safe touched-user trust calculation using PostgreSQL LEAST/GREATEST expressions.';

commit;
