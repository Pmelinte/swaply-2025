-- Batch 65.3 — activate the global-first, revisioned owner profile authority.
-- Production version: 20260718180005.
-- Additive and rollback-compatible: direct authenticated UPDATE remains available.

begin;

create or replace function public.normalize_swaply_locale(p_locale text)
returns text
language plpgsql
immutable
security invoker
set search_path = pg_catalog, public
as $function$
declare
  v_locale text;
  v_supported constant text[] := array[
    'en', 'ro', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'el',
    'hu', 'bg', 'cs', 'sk', 'hr', 'sl', 'sr', 'sv', 'da', 'fi',
    'no', 'lt', 'lv', 'et', 'ga', 'mt', 'ru', 'tr', 'ar', 'zh',
    'hi', 'bn', 'ja', 'ko', 'vi', 'th', 'id', 'ms', 'fil', 'fa',
    'mn', 'uk', 'yi'
  ];
begin
  v_locale := lower(replace(btrim(coalesce(p_locale, '')), '_', '-'));
  if v_locale = '' then return null; end if;
  if v_locale = any(v_supported) then return v_locale; end if;
  v_locale := split_part(v_locale, '-', 1);
  if v_locale = any(v_supported) then return v_locale; end if;
  return null;
end;
$function$;

revoke execute on function public.normalize_swaply_locale(text) from public, anon;
grant execute on function public.normalize_swaply_locale(text) to authenticated, service_role;

alter table public.profiles
  add column if not exists primary_language text,
  add column if not exists secondary_language text,
  add column if not exists tertiary_language text,
  add column if not exists auto_translate_messages boolean not null default true,
  add column if not exists show_original_language boolean not null default false,
  add column if not exists profile_revision bigint not null default 1,
  add column if not exists user_type text not null default 'individual',
  add column if not exists availability_status text not null default 'available',
  add column if not exists timezone text not null default 'UTC';

do $backfill$
declare
  r record;
  v_candidate text;
  v_primary text;
  v_secondary text;
  v_tertiary text;
  v_candidates text[];
begin
  for r in
    select p.user_id, p.primary_language, p.secondary_language,
      p.tertiary_language, p.preferred_locale, p.languages,
      u.raw_user_meta_data ->> 'language' as auth_language
    from public.profiles p
    left join auth.users u on u.id = p.user_id
  loop
    v_primary := null;
    v_secondary := null;
    v_tertiary := null;
    v_candidates := array_cat(
      array[r.primary_language, r.preferred_locale],
      array_cat(coalesce(r.languages, '{}'::text[]), array[r.auth_language, 'en'])
    );
    foreach v_candidate in array v_candidates loop
      v_candidate := public.normalize_swaply_locale(v_candidate);
      continue when v_candidate is null;
      v_primary := v_candidate;
      exit;
    end loop;
    foreach v_candidate in array array_cat(array[r.secondary_language], coalesce(r.languages, '{}'::text[])) loop
      v_candidate := public.normalize_swaply_locale(v_candidate);
      continue when v_candidate is null or v_candidate = v_primary;
      v_secondary := v_candidate;
      exit;
    end loop;
    foreach v_candidate in array array_cat(array[r.tertiary_language], coalesce(r.languages, '{}'::text[])) loop
      v_candidate := public.normalize_swaply_locale(v_candidate);
      continue when v_candidate is null or v_candidate = v_primary or v_candidate = v_secondary;
      v_tertiary := v_candidate;
      exit;
    end loop;
    update public.profiles set
      primary_language = coalesce(v_primary, 'en'),
      secondary_language = v_secondary,
      tertiary_language = v_tertiary,
      preferred_locale = coalesce(v_primary, 'en'),
      languages = array_remove(array[coalesce(v_primary, 'en'), v_secondary, v_tertiary], null),
      profile_revision = greatest(coalesce(profile_revision, 1), 1),
      user_type = coalesce(nullif(user_type, ''), 'individual'),
      availability_status = coalesce(nullif(availability_status, ''), 'available'),
      timezone = coalesce(nullif(timezone, ''), 'UTC')
    where user_id = r.user_id;
  end loop;
end;
$backfill$;

alter table public.profiles
  alter column primary_language set default 'en',
  alter column primary_language set not null,
  alter column languages set default array['en'::text],
  alter column languages set not null,
  alter column preferred_locale set default 'en';

do $constraints$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_primary_language_valid' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_primary_language_valid check (primary_language = public.normalize_swaply_locale(primary_language));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_secondary_language_valid' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_secondary_language_valid check (secondary_language is null or secondary_language = public.normalize_swaply_locale(secondary_language));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_tertiary_language_valid' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_tertiary_language_valid check (tertiary_language is null or tertiary_language = public.normalize_swaply_locale(tertiary_language));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_languages_distinct' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_languages_distinct check (
      (secondary_language is null or secondary_language <> primary_language)
      and (tertiary_language is null or tertiary_language <> primary_language)
      and (secondary_language is null or tertiary_language is null or secondary_language <> tertiary_language)
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_revision_positive' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_revision_positive check (profile_revision >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_user_type_valid' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_user_type_valid check (user_type in ('individual', 'professional', 'organization'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_availability_status_valid' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_availability_status_valid check (availability_status in ('available', 'limited', 'away'));
  end if;
end;
$constraints$;

create or replace function public.protect_profile_privileged_fields()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public
as $function$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.badge := 'free'; new.role := 'user'; new.onboarding_completed := false;
      new.is_suspended := false; new.suspended_until := null; new.suspension_reason := null;
      new.is_banned := false; new.ban_reason := null; new.report_count := 0;
      new.event_badges := '{}'::text[]; new.stripe_customer_id := null; new.paypal_payer_id := null;
      new.id_verified := false; new.id_verified_at := null; new.id_verified_method := null;
      new.phone_verified := false; new.phone_verified_at := null; new.address_verified := false;
      new.trust_level := 'starter'; new.trust_score := 0; new.swaps_completed := 0;
      new.swaps_cancelled := 0; new.swaps_disputed := 0; new.response_time_avg_h := null;
      new.response_rate_pct := 0; new.subscription_plan := 'free'; new.subscription_until := null;
      new.token_balance := 0; new.lifetime_tokens := 0; new.api_key_hash := null;
      new.stats := '{}'::jsonb; new.profile_revision := 1;
    else
      new.badge := old.badge; new.role := old.role; new.onboarding_completed := old.onboarding_completed;
      new.is_suspended := old.is_suspended; new.suspended_until := old.suspended_until;
      new.suspension_reason := old.suspension_reason; new.is_banned := old.is_banned;
      new.ban_reason := old.ban_reason; new.report_count := old.report_count;
      new.event_badges := old.event_badges; new.stripe_customer_id := old.stripe_customer_id;
      new.paypal_payer_id := old.paypal_payer_id; new.id_verified := old.id_verified;
      new.id_verified_at := old.id_verified_at; new.id_verified_method := old.id_verified_method;
      new.phone_verified := old.phone_verified; new.phone_verified_at := old.phone_verified_at;
      new.address_verified := old.address_verified; new.trust_level := old.trust_level;
      new.trust_score := old.trust_score; new.swaps_completed := old.swaps_completed;
      new.swaps_cancelled := old.swaps_cancelled; new.swaps_disputed := old.swaps_disputed;
      new.response_time_avg_h := old.response_time_avg_h; new.response_rate_pct := old.response_rate_pct;
      new.subscription_plan := old.subscription_plan; new.subscription_until := old.subscription_until;
      new.token_balance := old.token_balance; new.lifetime_tokens := old.lifetime_tokens;
      new.api_key_hash := old.api_key_hash; new.stats := old.stats;
      new.profile_revision := old.profile_revision;
    end if;
    new.preferences := coalesce(new.preferences, '{}'::jsonb) - 'role';
  end if;
  return new;
end;
$function$;
revoke execute on function public.protect_profile_privileged_fields() from public, anon, authenticated;

create table if not exists public.profile_update_idempotency (
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  response_revision bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key),
  constraint profile_update_idempotency_key_length check (char_length(idempotency_key) between 8 and 120),
  constraint profile_update_idempotency_revision_positive check (response_revision >= 1)
);
alter table public.profile_update_idempotency enable row level security;
revoke all on table public.profile_update_idempotency from public, anon, authenticated;
grant all on table public.profile_update_idempotency to service_role;
create index if not exists profile_update_idempotency_created_at_idx on public.profile_update_idempotency (created_at);

create or replace function public.ensure_own_profile_v1(p_route_locale text default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $function$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_auth auth.users%rowtype;
  v_locale text;
  v_username text;
  v_display_name text;
begin
  if v_user_id is null then raise exception using errcode = '42501', message = 'Authentication required.'; end if;
  select * into v_profile from public.profiles where user_id = v_user_id;
  if found then return jsonb_build_object('profile', to_jsonb(v_profile), 'profile_revision', v_profile.profile_revision, 'created', false); end if;
  select * into v_auth from auth.users where id = v_user_id;
  if not found then raise exception using errcode = 'P0002', message = 'Authenticated user not found.'; end if;
  v_locale := coalesce(public.normalize_swaply_locale(p_route_locale), public.normalize_swaply_locale(v_auth.raw_user_meta_data ->> 'language'), 'en');
  v_username := 'user_' || replace(v_user_id::text, '-', '');
  v_display_name := coalesce(nullif(btrim(v_auth.raw_user_meta_data ->> 'full_name'), ''), nullif(btrim(v_auth.raw_user_meta_data ->> 'name'), ''), nullif(split_part(coalesce(v_auth.email, ''), '@', 1), ''), 'Swaply User');
  insert into public.profiles (user_id,email,username,full_name,display_name,badge,languages,primary_language,preferred_locale,auto_translate_messages,show_original_language,profile_revision,location,visibility,notifications,swap_preferences,security,stats)
  values (v_user_id,v_auth.email,v_username,v_display_name,v_display_name,'free',array[v_locale],v_locale,v_locale,true,false,1,'{}'::jsonb,'{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true}'::jsonb,'{"chat":true,"push":true,"email":true,"matches":true,"swapUpdates":true}'::jsonb,'{"notes":"","logistics":"flexible"}'::jsonb,'{"method":null,"passkeysEnabled":false,"twoFactorEnabled":false}'::jsonb,'{"tokens":0,"reputation":"starter","activeListings":0,"completedSwaps":0}'::jsonb)
  on conflict (user_id) do nothing;
  select * into strict v_profile from public.profiles where user_id = v_user_id;
  return jsonb_build_object('profile', to_jsonb(v_profile), 'profile_revision', v_profile.profile_revision, 'created', true);
end;
$function$;
revoke execute on function public.ensure_own_profile_v1(text) from public, anon;
grant execute on function public.ensure_own_profile_v1(text) to authenticated, service_role;

create or replace function public.update_own_profile_v1(p_expected_revision bigint, p_payload jsonb, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, auth
as $function$
declare
  v_user_id uuid := auth.uid(); v_current public.profiles%rowtype; v_updated public.profiles%rowtype;
  v_existing public.profile_update_idempotency%rowtype; v_request_hash text;
  v_primary text; v_secondary text; v_tertiary text; v_location jsonb; v_visibility jsonb; v_notifications jsonb; v_swap_preferences jsonb;
  v_allowed_keys constant text[] := array['username','full_name','display_name','first_name','avatar_url','bio','primary_language','secondary_language','tertiary_language','auto_translate_messages','show_original_language','location','location_text','visibility','notifications','swap_preferences','user_type','availability_status','timezone'];
  v_unknown_key text;
begin
  if v_user_id is null then raise exception using errcode='42501', message='Authentication required.'; end if;
  if p_expected_revision is null or p_expected_revision < 1 then raise exception using errcode='22023', message='A positive expected revision is required.'; end if;
  if jsonb_typeof(p_payload) is distinct from 'object' then raise exception using errcode='22023', message='Profile payload must be a JSON object.'; end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 8 and 120 or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$' then raise exception using errcode='22023', message='Invalid idempotency key.'; end if;
  select key into v_unknown_key from jsonb_object_keys(p_payload) as key where not (key = any(v_allowed_keys)) limit 1;
  if v_unknown_key is not null then raise exception using errcode='22023', message=format('Unsupported profile field: %s', v_unknown_key); end if;
  v_request_hash := md5(p_expected_revision::text || ':' || p_payload::text);
  select * into v_existing from public.profile_update_idempotency where user_id=v_user_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash <> v_request_hash then raise exception using errcode='23505', message='Idempotency key was already used with a different request.'; end if;
    select * into strict v_current from public.profiles where user_id=v_user_id;
    return jsonb_build_object('profile',to_jsonb(v_current),'profile_revision',v_current.profile_revision,'replayed',true);
  end if;
  select * into v_current from public.profiles where user_id=v_user_id for update;
  if not found then perform public.ensure_own_profile_v1(null); select * into strict v_current from public.profiles where user_id=v_user_id for update; end if;
  if v_current.profile_revision <> p_expected_revision then raise exception using errcode='40001', message=format('Stale profile revision: expected %s, current %s.',p_expected_revision,v_current.profile_revision); end if;
  v_primary := case when p_payload ? 'primary_language' then public.normalize_swaply_locale(p_payload->>'primary_language') else v_current.primary_language end;
  v_secondary := case when p_payload ? 'secondary_language' then public.normalize_swaply_locale(p_payload->>'secondary_language') else v_current.secondary_language end;
  v_tertiary := case when p_payload ? 'tertiary_language' then public.normalize_swaply_locale(p_payload->>'tertiary_language') else v_current.tertiary_language end;
  if v_primary is null then raise exception using errcode='22023', message='Primary language is required and must be supported.'; end if;
  if v_secondary=v_primary then raise exception using errcode='22023', message='Secondary language must differ from primary language.'; end if;
  if v_tertiary=v_primary or (v_tertiary is not null and v_tertiary=v_secondary) then raise exception using errcode='22023', message='Tertiary language must be distinct.'; end if;
  v_location := case when p_payload?'location' then p_payload->'location' else v_current.location end;
  v_visibility := case when p_payload?'visibility' then p_payload->'visibility' else v_current.visibility end;
  v_notifications := case when p_payload?'notifications' then p_payload->'notifications' else v_current.notifications end;
  v_swap_preferences := case when p_payload?'swap_preferences' then p_payload->'swap_preferences' else v_current.swap_preferences end;
  if jsonb_typeof(coalesce(v_location,'{}'::jsonb))<>'object' or jsonb_typeof(coalesce(v_visibility,'{}'::jsonb))<>'object' or jsonb_typeof(coalesce(v_notifications,'{}'::jsonb))<>'object' or jsonb_typeof(coalesce(v_swap_preferences,'{}'::jsonb))<>'object' then raise exception using errcode='22023', message='Profile JSON fields must be objects.'; end if;
  update public.profiles set
    username=case when p_payload?'username' then nullif(btrim(p_payload->>'username'),'') else username end,
    full_name=case when p_payload?'full_name' then nullif(btrim(p_payload->>'full_name'),'') else full_name end,
    display_name=case when p_payload?'display_name' then nullif(btrim(p_payload->>'display_name'),'') else display_name end,
    first_name=case when p_payload?'first_name' then nullif(btrim(p_payload->>'first_name'),'') else first_name end,
    avatar_url=case when p_payload?'avatar_url' then nullif(btrim(p_payload->>'avatar_url'),'') else avatar_url end,
    bio=case when p_payload?'bio' then nullif(btrim(p_payload->>'bio'),'') else bio end,
    primary_language=v_primary,secondary_language=v_secondary,tertiary_language=v_tertiary,preferred_locale=v_primary,languages=array_remove(array[v_primary,v_secondary,v_tertiary],null),
    auto_translate_messages=case when p_payload?'auto_translate_messages' then (p_payload->>'auto_translate_messages')::boolean else auto_translate_messages end,
    show_original_language=case when p_payload?'show_original_language' then (p_payload->>'show_original_language')::boolean else show_original_language end,
    location=coalesce(v_location,'{}'::jsonb), location_text=case when p_payload?'location_text' then nullif(btrim(p_payload->>'location_text'),'') else location_text end,
    visibility=coalesce(v_visibility,'{}'::jsonb),notifications=coalesce(v_notifications,'{}'::jsonb),swap_preferences=coalesce(v_swap_preferences,'{}'::jsonb),
    user_type=case when p_payload?'user_type' then p_payload->>'user_type' else user_type end,
    availability_status=case when p_payload?'availability_status' then p_payload->>'availability_status' else availability_status end,
    timezone=case when p_payload?'timezone' then nullif(btrim(p_payload->>'timezone'),'') else timezone end,
    profile_revision=profile_revision+1,updated_at=now()
  where user_id=v_user_id returning * into strict v_updated;
  insert into public.profile_update_idempotency(user_id,idempotency_key,request_hash,response_revision) values(v_user_id,p_idempotency_key,v_request_hash,v_updated.profile_revision);
  delete from public.profile_update_idempotency where created_at < now()-interval '24 hours';
  return jsonb_build_object('profile',to_jsonb(v_updated),'profile_revision',v_updated.profile_revision,'replayed',false);
end;
$function$;
revoke execute on function public.update_own_profile_v1(bigint,jsonb,text) from public, anon;
grant execute on function public.update_own_profile_v1(bigint,jsonb,text) to authenticated, service_role;

create or replace function public.bootstrap_swaply_profile_from_auth()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,auth
as $function$
declare v_locale text; v_display_name text;
begin
  v_locale:=coalesce(public.normalize_swaply_locale(new.raw_user_meta_data->>'language'),'en');
  v_display_name:=coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'),''),nullif(btrim(new.raw_user_meta_data->>'name'),''),nullif(split_part(coalesce(new.email,''),'@',1),''),'Swaply User');
  insert into public.profiles(user_id,email,username,full_name,display_name,languages,primary_language,preferred_locale,profile_revision)
  values(new.id,new.email,'user_'||replace(new.id::text,'-',''),v_display_name,v_display_name,array[v_locale],v_locale,v_locale,1)
  on conflict(user_id) do nothing;
  return new;
end;
$function$;
revoke execute on function public.bootstrap_swaply_profile_from_auth() from public,anon,authenticated;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.bootstrap_swaply_profile_from_auth();

insert into public.profiles(user_id,email,username,full_name,display_name,languages,primary_language,preferred_locale,profile_revision)
select u.id,u.email,'user_'||replace(u.id::text,'-',''),
  coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),nullif(btrim(u.raw_user_meta_data->>'name'),''),nullif(split_part(coalesce(u.email,''),'@',1),''),'Swaply User'),
  coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),nullif(btrim(u.raw_user_meta_data->>'name'),''),nullif(split_part(coalesce(u.email,''),'@',1),''),'Swaply User'),
  array[coalesce(public.normalize_swaply_locale(u.raw_user_meta_data->>'language'),'en')],
  coalesce(public.normalize_swaply_locale(u.raw_user_meta_data->>'language'),'en'),
  coalesce(public.normalize_swaply_locale(u.raw_user_meta_data->>'language'),'en'),1
from auth.users u left join public.profiles p on p.user_id=u.id where p.user_id is null
on conflict(user_id) do nothing;

commit;
