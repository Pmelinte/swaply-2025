\set ON_ERROR_STOP on

create extension if not exists pgcrypto;
create schema if not exists auth;
create schema if not exists storage;

create table auth.users (
  id uuid primary key,
  email text not null unique,
  encrypted_password text not null,
  created_at timestamptz not null default now()
);

create table storage.buckets (
  id text primary key,
  name text not null unique,
  public boolean not null default false
);

create table storage.objects (
  id uuid primary key,
  bucket_id text not null references storage.buckets(id),
  name text not null,
  owner uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  unique (bucket_id, name)
);

create table public.profiles (
  user_id uuid primary key references auth.users(id),
  username text not null unique,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key,
  owner_id uuid not null references public.profiles(user_id),
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.swaps (
  id uuid primary key,
  requester_id uuid not null references public.profiles(user_id),
  responder_id uuid not null references public.profiles(user_id),
  status text not null check (status in ('proposed', 'accepted', 'completed', 'disputed')),
  created_at timestamptz not null default now(),
  check (requester_id <> responder_id)
);

create table public.conversations (
  id uuid primary key,
  swap_id uuid not null unique references public.swaps(id) on delete cascade,
  participant_ids uuid[] not null,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(user_id),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key,
  swap_id uuid not null unique references public.swaps(id),
  status text not null check (status in ('draft', 'pending_consent', 'published', 'hidden')),
  current_revision integer not null default 1
);

create table public.story_consents (
  story_id uuid not null references public.stories(id) on delete cascade,
  participant_id uuid not null references public.profiles(user_id),
  revision integer not null,
  consented boolean not null,
  primary key (story_id, participant_id, revision)
);

create table public.swapleni_ledger (
  id uuid primary key,
  user_id uuid not null references public.profiles(user_id),
  amount integer not null check (amount <> 0),
  source_type text not null,
  source_id uuid not null,
  deduplication_key text not null unique,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key,
  locale text not null,
  slug text not null,
  title text not null,
  published boolean not null default false,
  unique (locale, slug)
);

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.swaps enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.stories enable row level security;
alter table public.story_consents enable row level security;
alter table public.swapleni_ledger enable row level security;

create policy profiles_owner_select on public.profiles
  for select using (true);
create policy items_public_select on public.items
  for select using (is_active);
create policy swaps_participant_select on public.swaps
  for select using (true);
create policy conversations_participant_select on public.conversations
  for select using (true);
create policy messages_participant_select on public.messages
  for select using (true);
create policy stories_published_select on public.stories
  for select using (status = 'published');
create policy story_consents_private_select on public.story_consents
  for select using (false);
create policy swapleni_owner_select on public.swapleni_ledger
  for select using (false);

insert into auth.users (id, email, encrypted_password, created_at) values
  ('10000000-0000-0000-0000-000000000001', 'alice@example.invalid', 'synthetic-hash-a', '2026-08-09T00:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'bob@example.invalid', 'synthetic-hash-b', '2026-08-09T00:00:00Z');

insert into public.profiles (user_id, username, preferred_language, created_at) values
  ('10000000-0000-0000-0000-000000000001', 'alice-recovery', 'ro', '2026-08-09T00:00:00Z'),
  ('10000000-0000-0000-0000-000000000002', 'bob-recovery', 'de', '2026-08-09T00:00:00Z');

insert into public.items (id, owner_id, title, is_active, created_at) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Synthetic camera', false, '2026-08-09T00:00:00Z'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Synthetic bicycle', false, '2026-08-09T00:00:00Z');

insert into public.swaps (id, requester_id, responder_id, status, created_at) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'completed', '2026-08-09T00:00:00Z');

insert into public.conversations (id, swap_id, participant_ids, created_at) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', array['10000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid], '2026-08-09T00:00:00Z');

insert into public.messages (id, conversation_id, sender_id, content, created_at) values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Synthetic recovery message', '2026-08-09T00:00:00Z');

insert into public.stories (id, swap_id, status, current_revision) values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'published', 1);

insert into public.story_consents (story_id, participant_id, revision, consented) values
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1, true),
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, true);

insert into public.swapleni_ledger (id, user_id, amount, source_type, source_id, deduplication_key, created_at) values
  ('70000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 10, 'completed_swap', '30000000-0000-0000-0000-000000000001', 'synthetic:swap:alice', '2026-08-09T00:00:00Z'),
  ('70000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 10, 'completed_swap', '30000000-0000-0000-0000-000000000001', 'synthetic:swap:bob', '2026-08-09T00:00:00Z');

insert into public.blog_posts (id, locale, slug, title, published) values
  ('80000000-0000-0000-0000-000000000001', 'en', 'synthetic-recovery', 'Synthetic recovery article', true),
  ('80000000-0000-0000-0000-000000000002', 'ro', 'synthetic-recovery', 'Articol sintetic de recuperare', true);

insert into storage.buckets (id, name, public) values
  ('item-photos', 'item-photos', true);

insert into storage.objects (id, bucket_id, name, owner, metadata) values
  ('90000000-0000-0000-0000-000000000001', 'item-photos', 'synthetic/camera.jpg', '10000000-0000-0000-0000-000000000001', '{"size": 1024, "mimetype": "image/jpeg"}'::jsonb);
