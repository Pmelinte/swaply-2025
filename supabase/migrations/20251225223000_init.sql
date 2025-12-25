-- Schema bootstrap aligned with DATA_MODEL_RLS_BLUEPRINT
create extension if not exists "pgcrypto";

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  language text default 'ro',
  badge_level text default 'free' check (badge_level in ('free', 'premium', 'platinum')),
  location_hint text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Items
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id),
  title text not null,
  description text,
  images text[] default '{}',
  is_active boolean default true,
  is_demo boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Swap intents
create table if not exists public.swap_intents (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_item_id uuid not null references public.items(id) on delete cascade,
  offered_item_id uuid references public.items(id),
  status text default 'pending',
  created_at timestamptz default now()
);

-- Swaps
create table if not exists public.swaps (
  id uuid primary key default gen_random_uuid(),
  initiator_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid references public.swaps(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  payload jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Grants
revoke all on public.categories from public;
revoke all on public.items from public;
revoke all on public.messages from public;
revoke all on public.notifications from public;
revoke all on public.profiles from public;
revoke all on public.swap_intents from public;
revoke all on public.swaps from public;

grant select on public.categories to anon, authenticated;
grant select on public.items to anon, authenticated;
grant insert, update, delete on public.items to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.swap_intents to authenticated;
grant select, insert, update on public.swaps to authenticated;
grant select, insert on public.messages to authenticated;
grant select, update on public.notifications to authenticated;

-- Enable RLS
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.profiles enable row level security;
alter table public.swap_intents enable row level security;
alter table public.swaps enable row level security;

-- Policies: categories
create policy "Public categories are readable" on public.categories
  for select using (true);

-- Policies: items
create policy "Public can read active items" on public.items
  for select using (is_active = true and is_demo = false);

create policy "Owners read their items" on public.items
  for select using (auth.uid() = owner_id);

create policy "Owners insert items" on public.items
  for insert with check (auth.uid() = owner_id and is_demo = false);

create policy "Owners update items" on public.items
  for update using (auth.uid() = owner_id);

create policy "Owners delete items" on public.items
  for delete using (auth.uid() = owner_id);

-- Policies: profiles (self only)
create policy "Users manage own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Policies: messages
create policy "Participants read messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "Senders insert messages" on public.messages
  for insert with check (auth.uid() = sender_id);
create policy "Senders update messages" on public.messages
  for update using (auth.uid() = sender_id);

-- Policies: notifications
create policy "Users read notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users update notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Policies: swap_intents
create policy "Participants read swap intents" on public.swap_intents
  for select using (
    auth.uid() = requester_id
    or auth.uid() = (select owner_id from public.items where id = target_item_id)
  );
create policy "Requester inserts swap intent" on public.swap_intents
  for insert with check (auth.uid() = requester_id);
create policy "Participants update swap intent" on public.swap_intents
  for update using (
    auth.uid() = requester_id
    or auth.uid() = (select owner_id from public.items where id = target_item_id)
  );

-- Policies: swaps
create policy "Participants read swaps" on public.swaps
  for select using (auth.uid() = initiator_id or auth.uid() = receiver_id);
create policy "Initiator inserts swaps" on public.swaps
  for insert with check (auth.uid() = initiator_id);
create policy "Participants update swaps" on public.swaps
  for update using (auth.uid() = initiator_id or auth.uid() = receiver_id);

-- Helper trigger to maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
before update on public.items
for each row
execute function public.set_updated_at();
