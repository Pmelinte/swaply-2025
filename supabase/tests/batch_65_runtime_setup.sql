\set ON_ERROR_STOP on

begin;

create extension if not exists pgcrypto;

grant usage on schema public to anon, authenticated, service_role;

drop table if exists public.profile_update_requests cascade;
drop table if exists public.matches cascade;
drop table if exists public.conversations cascade;
drop table if exists public.swaps cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.public_profiles cascade;
drop table if exists public.profiles cascade;
drop function if exists public.sync_public_profile() cascade;
drop function if exists public.protect_profile_privileged_fields() cascade;
drop function if exists public.update_own_profile_v1(bigint, jsonb, text) cascade;
drop function if exists public.get_profile_identity_v1(uuid) cascade;
drop function if exists public.normalize_swaply_locale(text) cascade;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  display_name text,
  first_name text,
  avatar_url text,
  bio text,
  email text,
  badge text not null default 'free',
  role text not null default 'user',
  languages text[] not null default array['en'::text],
  preferred_locale text default 'en',
  preferred_currency text default 'EUR',
  dark_mode boolean not null default false,
  location jsonb not null default '{}'::jsonb,
  location_text text,
  visibility jsonb not null default '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true}'::jsonb,
  notifications jsonb not null default '{}'::jsonb,
  swap_preferences jsonb not null default '{}'::jsonb,
  security jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 0,
  is_suspended boolean not null default false,
  suspended_until timestamptz,
  suspension_reason text,
  is_banned boolean not null default false,
  ban_reason text,
  report_count integer not null default 0,
  event_badges text[] not null default '{}'::text[],
  stripe_customer_id text,
  paypal_payer_id text,
  id_verified boolean not null default false,
  id_verified_at timestamptz,
  id_verified_method text,
  phone_verified boolean not null default false,
  phone_verified_at timestamptz,
  address_verified boolean not null default false,
  trust_level text not null default 'starter',
  trust_score numeric not null default 0,
  swaps_completed integer not null default 0,
  swaps_cancelled integer not null default 0,
  swaps_disputed integer not null default 0,
  response_time_avg_h numeric,
  response_rate_pct numeric not null default 0,
  last_active_at timestamptz,
  swap_intent text,
  swap_context text[] not null default '{}'::text[],
  swap_geo_range text,
  open_to_types text[] not null default '{}'::text[],
  date_of_birth date,
  gender text,
  nationality text,
  address_line1 text,
  address_city text,
  address_country text,
  address_postal_code text,
  address_lat numeric,
  address_lon numeric,
  website_url text,
  social_links jsonb not null default '{}'::jsonb,
  affinity_groups text[] not null default '{}'::text[],
  interests text[] not null default '{}'::text[],
  occupation text,
  company text,
  rating numeric not null default 0,
  rating_count integer not null default 0,
  subscription_plan text not null default 'free',
  subscription_until timestamptz,
  token_balance integer not null default 0,
  lifetime_tokens integer not null default 0,
  api_key_hash text,
  profile_completeness integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.public_profiles (
  user_id uuid primary key,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  location_text text,
  location jsonb,
  badge text,
  languages text[],
  rating numeric,
  rating_count integer,
  trust_level text,
  trust_score numeric,
  id_verified boolean,
  phone_verified boolean,
  swaps_completed integer,
  response_time_avg_h numeric,
  response_rate_pct numeric,
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

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  primary key (user_id, role)
);

create table public.swaps (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  responder_id uuid not null references auth.users(id) on delete cascade
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_ids uuid[] not null default '{}'::uuid[]
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  initiator_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade
);

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
begin
  return new;
end;
$function$;

create trigger protect_profile_privileged_fields_trigger
before insert or update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

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

  insert into public.public_profiles (user_id, username, display_name, created_at)
  values (new.user_id, new.username, new.display_name, new.created_at)
  on conflict (user_id) do update set
    username = excluded.username,
    display_name = excluded.display_name;

  return new;
end;
$function$;

create trigger sync_public_profile_trigger
after insert or update or delete on public.profiles
for each row execute function public.sync_public_profile();

alter table public.profiles enable row level security;
create policy select_own_profile on public.profiles
  for select to authenticated
  using (auth.uid() = user_id);
create policy insert_own_profile on public.profiles
  for insert to authenticated
  with check (auth.uid() = user_id);
create policy update_own_profile on public.profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy delete_own_profile on public.profiles
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
revoke all on public.profiles from anon;

alter table public.public_profiles enable row level security;
create policy public_profiles_read on public.public_profiles
  for select to anon, authenticated
  using (true);
grant select on public.public_profiles to anon, authenticated;

revoke all on public.user_roles, public.swaps, public.conversations, public.matches
  from anon, authenticated;
grant all on public.user_roles, public.swaps, public.conversations, public.matches
  to service_role;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'batch65-owner@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"language":"it"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'batch65-outsider@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'batch65-participant@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'batch65-admin@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'batch65-moderator@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'batch65-guard@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
on conflict (id) do nothing;

insert into public.profiles (
  user_id,
  username,
  full_name,
  display_name,
  email,
  bio,
  languages,
  preferred_locale,
  location,
  location_text,
  visibility,
  address_line1,
  address_city,
  address_country,
  address_postal_code,
  address_lat,
  address_lon,
  affinity_groups,
  interests,
  occupation,
  website_url,
  social_links
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'batch65-owner',
    'Batch 65 Owner',
    'Owner Original',
    'batch65-owner@example.test',
    'Owner private biography',
    array['en','fr'],
    'ro-RO',
    '{"city":"Tulcea","country":"RO","lat":45.17,"lon":28.80,"street":"Hidden"}',
    'Exact private location string',
    '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true,"showBio":false,"showInterests":false,"showOccupation":false,"showWebsite":false,"showSocialLinks":false}',
    'Hidden owner street',
    'Tulcea',
    'RO',
    '820000',
    45.17,
    28.80,
    array['medical'],
    array['technology'],
    'Doctor',
    'https://private-owner.example.test',
    '{"github":"hidden-owner"}'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'batch65-outsider',
    'Batch 65 Outsider',
    'Outsider Original',
    'batch65-outsider@example.test',
    'Outsider biography',
    array['de'],
    null,
    '{"city":"Berlin","country":"DE","coordinates":{"lat":52.5,"lng":13.4}}',
    'Berlin exact',
    '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true}',
    'Hidden outsider street',
    'Berlin',
    'DE',
    '10115',
    52.5,
    13.4,
    '{}'::text[],
    '{}'::text[],
    null,
    null,
    '{}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'batch65-participant',
    'Batch 65 Participant',
    'Private Participant',
    'batch65-participant@example.test',
    'Participant biography must stay private',
    array['es'],
    'es',
    '{"city":"Madrid","country":"ES","lat":40.4,"lon":-3.7}',
    'Madrid exact',
    '{"publicProfile":false,"itemsVisibility":"match_only","showExactLocation":false,"showLastSeen":false}',
    'Hidden participant street',
    'Madrid',
    'ES',
    '28001',
    40.4,
    -3.7,
    array['community'],
    array['books'],
    'Teacher',
    'https://private-participant.example.test',
    '{"linkedin":"hidden-participant"}'
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'batch65-admin',
    'Batch 65 Admin',
    'Admin User',
    'batch65-admin@example.test',
    null,
    array['en'],
    'en',
    '{"city":"Cluj","country":"RO"}',
    'Cluj',
    '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true}',
    null,
    'Cluj',
    'RO',
    null,
    null,
    null,
    '{}'::text[],
    '{}'::text[],
    null,
    null,
    '{}'::jsonb
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'batch65-moderator',
    'Batch 65 Moderator',
    'Moderator User',
    'batch65-moderator@example.test',
    null,
    array['en'],
    'en',
    '{"city":"Iasi","country":"RO"}',
    'Iasi',
    '{"publicProfile":true,"itemsVisibility":"public","showExactLocation":false,"showLastSeen":true}',
    null,
    'Iasi',
    'RO',
    null,
    null,
    null,
    '{}'::text[],
    '{}'::text[],
    null,
    null,
    '{}'::jsonb
  );

insert into public.user_roles (user_id, role) values
  ('44444444-4444-4444-8444-444444444444', 'admin'),
  ('55555555-5555-4555-8555-555555555555', 'moderator');

insert into public.swaps (id, requester_id, responder_id) values
  ('77777777-7777-4777-8777-777777777777', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333');

commit;
