-- P0 emergency hardening. Safe to apply before the application rollout.
-- 1. Removes client EXECUTE from privileged functions.
-- 2. Makes Swapleni awards server-owned and idempotent.
-- 3. Prevents authenticated clients from changing privileged profile fields.
-- 4. Introduces server-owned roles and a sanitized public profile projection.

begin;

-- Prevent future functions created by the migration owner from becoming public RPCs.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

-- Make every existing SECURITY DEFINER function use an explicit, trusted search path,
-- and remove direct execution from client roles. Trigger functions continue to work.
do $hardening$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format(
      'alter function %s set search_path = pg_catalog, public',
      fn.signature
    );
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      fn.signature
    );
  end loop;
end
$hardening$;

-- Read-only public rating lookup remains intentionally callable.
grant execute on function public.get_user_rating(uuid) to anon, authenticated;

-- Swapleni awards are server-owned. Validate the input even for trusted callers.
create or replace function public.award_tokens(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id uuid default null
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if p_user_id is null then
    raise exception 'user_id is required' using errcode = '22023';
  end if;

  if p_amount is null or p_amount = 0 or abs(p_amount) > 1000 then
    raise exception 'invalid token amount' using errcode = '22023';
  end if;

  if p_reason is null or btrim(p_reason) = '' or length(p_reason) > 80 then
    raise exception 'invalid token reason' using errcode = '22023';
  end if;

  insert into public.user_tokens (user_id, amount, reason, reference_id)
  values (p_user_id, p_amount, btrim(p_reason), p_reference_id)
  on conflict do nothing;

  if found then
    update public.profiles
    set stats = jsonb_set(
      coalesce(stats, '{}'::jsonb),
      '{tokens}',
      to_jsonb(coalesce((stats ->> 'tokens')::integer, 0) + p_amount)
    )
    where user_id = p_user_id;
  end if;
end;
$function$;

revoke execute on function public.award_tokens(uuid, integer, text, uuid)
  from public, anon, authenticated;
grant execute on function public.award_tokens(uuid, integer, text, uuid)
  to service_role;

create unique index if not exists user_tokens_reference_once
  on public.user_tokens (user_id, reason, reference_id)
  where reference_id is not null;

create unique index if not exists user_tokens_onboarding_once
  on public.user_tokens (user_id, reason)
  where reference_id is null and reason like 'onboarding_%';

-- Keep the existing RPC signature for the current client, but bind it to auth.uid().
create or replace function public.complete_onboarding_step(
  p_user_id uuid,
  p_step text
) returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if (select auth.uid()) is null or (select auth.uid()) <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_step not in ('profile', 'first_item', 'first_match', 'first_swap') then
    raise exception 'invalid onboarding step' using errcode = '22023';
  end if;

  case p_step
    when 'profile' then
      update public.onboarding_progress
      set step_profile = true,
          current_step = 'first_item',
          updated_at = now()
      where user_id = p_user_id and step_profile = false;
    when 'first_item' then
      update public.onboarding_progress
      set step_first_item = true,
          current_step = 'first_match',
          updated_at = now()
      where user_id = p_user_id and step_first_item = false;
    when 'first_match' then
      update public.onboarding_progress
      set step_first_match = true,
          current_step = 'first_swap',
          updated_at = now()
      where user_id = p_user_id and step_first_match = false;
    when 'first_swap' then
      update public.onboarding_progress
      set step_first_swap = true,
          current_step = 'completed',
          completed_at = coalesce(completed_at, now()),
          updated_at = now()
      where user_id = p_user_id and step_first_swap = false;
  end case;
end;
$function$;

revoke execute on function public.complete_onboarding_step(uuid, text)
  from public, anon;
grant execute on function public.complete_onboarding_step(uuid, text)
  to authenticated;

-- Server-owned authorization source. Profile badges remain presentation tiers.
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
revoke all on table public.user_roles from anon, authenticated;
grant select on table public.user_roles to authenticated;
grant all on table public.user_roles to service_role;

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own
  on public.user_roles for select to authenticated
  using ((select auth.uid()) = user_id);

insert into public.user_roles (user_id, role)
select user_id, role
from public.profiles
where role in ('moderator', 'admin')
on conflict (user_id) do update
set role = excluded.role, updated_at = now();

-- Stop client-side privilege escalation without changing normal profile writes.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.badge := 'free';
      new.role := 'user';
      new.onboarding_completed := false;
      new.is_suspended := false;
      new.suspended_until := null;
      new.suspension_reason := null;
      new.is_banned := false;
      new.ban_reason := null;
      new.report_count := 0;
      new.event_badges := '{}'::text[];
      new.stripe_customer_id := null;
      new.paypal_payer_id := null;
      new.id_verified := false;
      new.id_verified_at := null;
      new.id_verified_method := null;
      new.phone_verified := false;
      new.phone_verified_at := null;
      new.address_verified := false;
      new.trust_level := 'new';
      new.trust_score := 0;
      new.swaps_completed := 0;
      new.swaps_cancelled := 0;
      new.swaps_disputed := 0;
      new.response_time_avg_h := null;
      new.response_rate_pct := 0;
      new.subscription_plan := 'free';
      new.subscription_until := null;
      new.token_balance := 0;
      new.lifetime_tokens := 0;
      new.api_key_hash := null;
      new.stats := '{}'::jsonb;
    else
      new.badge := old.badge;
      new.role := old.role;
      new.onboarding_completed := old.onboarding_completed;
      new.is_suspended := old.is_suspended;
      new.suspended_until := old.suspended_until;
      new.suspension_reason := old.suspension_reason;
      new.is_banned := old.is_banned;
      new.ban_reason := old.ban_reason;
      new.report_count := old.report_count;
      new.event_badges := old.event_badges;
      new.stripe_customer_id := old.stripe_customer_id;
      new.paypal_payer_id := old.paypal_payer_id;
      new.id_verified := old.id_verified;
      new.id_verified_at := old.id_verified_at;
      new.id_verified_method := old.id_verified_method;
      new.phone_verified := old.phone_verified;
      new.phone_verified_at := old.phone_verified_at;
      new.address_verified := old.address_verified;
      new.trust_level := old.trust_level;
      new.trust_score := old.trust_score;
      new.swaps_completed := old.swaps_completed;
      new.swaps_cancelled := old.swaps_cancelled;
      new.swaps_disputed := old.swaps_disputed;
      new.response_time_avg_h := old.response_time_avg_h;
      new.response_rate_pct := old.response_rate_pct;
      new.subscription_plan := old.subscription_plan;
      new.subscription_until := old.subscription_until;
      new.token_balance := old.token_balance;
      new.lifetime_tokens := old.lifetime_tokens;
      new.api_key_hash := old.api_key_hash;
      new.stats := old.stats;
    end if;

    new.preferences := coalesce(new.preferences, '{}'::jsonb) - 'role';
  end if;

  return new;
end;
$function$;

revoke execute on function public.protect_profile_privileged_fields()
  from public, anon, authenticated;

drop trigger if exists protect_profile_privileged_fields_trigger on public.profiles;
create trigger protect_profile_privileged_fields_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

-- Replace the SECURITY DEFINER view with a server-maintained public table.
drop view if exists public.public_profiles;

create table if not exists public.public_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  location_text text,
  location jsonb not null default '{}'::jsonb,
  badge text,
  languages text[],
  rating numeric,
  rating_count integer,
  trust_level text,
  trust_score integer,
  id_verified boolean,
  phone_verified boolean,
  swaps_completed integer,
  response_time_avg_h numeric,
  response_rate_pct integer,
  last_active_at timestamptz,
  swap_intent text,
  swap_context text[],
  swap_geo_range text,
  open_to_types text[],
  affinity_groups text[],
  interests text[],
  occupation text,
  website_url text,
  social_links jsonb,
  profile_completeness integer,
  event_badges text[],
  created_at timestamptz
);

alter table public.public_profiles enable row level security;
revoke all on table public.public_profiles from anon, authenticated;
grant select on table public.public_profiles to anon, authenticated;
grant all on table public.public_profiles to service_role;

drop policy if exists public_profiles_read on public.public_profiles;
create policy public_profiles_read
  on public.public_profiles for select to anon, authenticated
  using (true);

create or replace function public.sync_public_profile()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if tg_op = 'DELETE' then
    delete from public.public_profiles where user_id = old.user_id;
    return old;
  end if;

  if new.is_banned or (new.is_suspended and coalesce(new.suspended_until, 'infinity') >= now()) then
    delete from public.public_profiles where user_id = new.user_id;
    return new;
  end if;

  insert into public.public_profiles (
    user_id, username, display_name, avatar_url, bio, location_text, location,
    badge, languages, rating, rating_count, trust_level, trust_score,
    id_verified, phone_verified, swaps_completed, response_time_avg_h,
    response_rate_pct, last_active_at, swap_intent, swap_context,
    swap_geo_range, open_to_types, affinity_groups, interests, occupation,
    website_url, social_links, profile_completeness, event_badges, created_at
  ) values (
    new.user_id, new.username, new.display_name, new.avatar_url, new.bio,
    new.location_text,
    jsonb_strip_nulls(jsonb_build_object(
      'city', new.location ->> 'city',
      'country', new.location ->> 'country'
    )),
    new.badge, new.languages, new.rating, new.rating_count, new.trust_level,
    new.trust_score, new.id_verified, new.phone_verified,
    new.swaps_completed, new.response_time_avg_h, new.response_rate_pct,
    new.last_active_at, new.swap_intent, new.swap_context, new.swap_geo_range,
    new.open_to_types, new.affinity_groups, new.interests, new.occupation,
    new.website_url, new.social_links, new.profile_completeness,
    new.event_badges, new.created_at
  )
  on conflict (user_id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio,
    location_text = excluded.location_text,
    location = excluded.location,
    badge = excluded.badge,
    languages = excluded.languages,
    rating = excluded.rating,
    rating_count = excluded.rating_count,
    trust_level = excluded.trust_level,
    trust_score = excluded.trust_score,
    id_verified = excluded.id_verified,
    phone_verified = excluded.phone_verified,
    swaps_completed = excluded.swaps_completed,
    response_time_avg_h = excluded.response_time_avg_h,
    response_rate_pct = excluded.response_rate_pct,
    last_active_at = excluded.last_active_at,
    swap_intent = excluded.swap_intent,
    swap_context = excluded.swap_context,
    swap_geo_range = excluded.swap_geo_range,
    open_to_types = excluded.open_to_types,
    affinity_groups = excluded.affinity_groups,
    interests = excluded.interests,
    occupation = excluded.occupation,
    website_url = excluded.website_url,
    social_links = excluded.social_links,
    profile_completeness = excluded.profile_completeness,
    event_badges = excluded.event_badges;

  return new;
end;
$function$;

revoke execute on function public.sync_public_profile()
  from public, anon, authenticated;

drop trigger if exists sync_public_profile_trigger on public.profiles;
create trigger sync_public_profile_trigger
after insert or update or delete on public.profiles
for each row execute function public.sync_public_profile();

insert into public.public_profiles (
  user_id, username, display_name, avatar_url, bio, location_text, location,
  badge, languages, rating, rating_count, trust_level, trust_score,
  id_verified, phone_verified, swaps_completed, response_time_avg_h,
  response_rate_pct, last_active_at, swap_intent, swap_context,
  swap_geo_range, open_to_types, affinity_groups, interests, occupation,
  website_url, social_links, profile_completeness, event_badges, created_at
)
select
  user_id, username, display_name, avatar_url, bio, location_text,
  jsonb_strip_nulls(jsonb_build_object(
    'city', location ->> 'city',
    'country', location ->> 'country'
  )),
  badge, languages, rating, rating_count, trust_level, trust_score,
  id_verified, phone_verified, swaps_completed, response_time_avg_h,
  response_rate_pct, last_active_at, swap_intent, swap_context,
  swap_geo_range, open_to_types, affinity_groups, interests, occupation,
  website_url, social_links, profile_completeness, event_badges, created_at
from public.profiles
where not is_banned
  and (not is_suspended or suspended_until < now())
on conflict (user_id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  location_text = excluded.location_text,
  location = excluded.location,
  badge = excluded.badge,
  languages = excluded.languages,
  rating = excluded.rating,
  rating_count = excluded.rating_count,
  trust_level = excluded.trust_level,
  trust_score = excluded.trust_score,
  id_verified = excluded.id_verified,
  phone_verified = excluded.phone_verified,
  swaps_completed = excluded.swaps_completed,
  response_time_avg_h = excluded.response_time_avg_h,
  response_rate_pct = excluded.response_rate_pct,
  last_active_at = excluded.last_active_at,
  swap_intent = excluded.swap_intent,
  swap_context = excluded.swap_context,
  swap_geo_range = excluded.swap_geo_range,
  open_to_types = excluded.open_to_types,
  affinity_groups = excluded.affinity_groups,
  interests = excluded.interests,
  occupation = excluded.occupation,
  website_url = excluded.website_url,
  social_links = excluded.social_links,
  profile_completeness = excluded.profile_completeness,
  event_badges = excluded.event_badges;

commit;
