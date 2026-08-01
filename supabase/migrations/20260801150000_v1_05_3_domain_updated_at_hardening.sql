begin;

alter table public.properties
  add column if not exists updated_at timestamptz not null default now();

alter table public.services_listings
  add column if not exists updated_at timestamptz not null default now();

alter table public.events_listings
  add column if not exists updated_at timestamptz not null default now();

comment on column public.properties.updated_at is
  'Last canonical property edit or lifecycle mutation timestamp.';
comment on column public.services_listings.updated_at is
  'Last canonical service edit or lifecycle mutation timestamp.';
comment on column public.events_listings.updated_at is
  'Last canonical event edit or lifecycle mutation timestamp.';

commit;
