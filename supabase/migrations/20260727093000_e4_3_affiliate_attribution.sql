-- E4.3 — Affiliate offers and attribution
-- Additive, sandbox-safe foundation. Does not activate any affiliate provider.

create table if not exists public.affiliate_offers (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  campaign_id text not null,
  destination_url text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sandbox', 'active', 'paused', 'expired')),
  disclosure_label text not null,
  sponsored boolean not null default true,
  attribution_window_hours integer not null
    check (attribution_window_hours > 0 and attribution_window_hours <= 2160),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  allowed_locales text[] not null default '{}',
  production_activation_explicitly_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, campaign_id),
  check (ends_at > starts_at),
  check (length(trim(disclosure_label)) > 0)
);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  attribution_id uuid not null unique,
  offer_id uuid not null references public.affiliate_offers(id) on delete restrict,
  provider_id text not null,
  campaign_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_session_hash text,
  source text not null,
  locale text not null,
  deduplication_key text not null unique,
  occurred_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'clicked'
    check (status in ('clicked', 'converted', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  check (expires_at > occurred_at),
  check (user_id is not null or anonymous_session_hash is not null)
);

create table if not exists public.affiliate_conversions (
  id uuid primary key default gen_random_uuid(),
  attribution_id uuid not null references public.affiliate_clicks(attribution_id) on delete restrict,
  provider_conversion_id text not null unique,
  deduplication_key text not null unique,
  occurred_at timestamptz not null,
  amount_minor bigint,
  currency text,
  status text not null default 'converted'
    check (status in ('converted', 'rejected')),
  created_at timestamptz not null default now(),
  check (amount_minor is null or amount_minor >= 0),
  check (currency is null or currency ~ '^[A-Z]{3}$')
);

create index if not exists affiliate_offers_provider_campaign_idx
  on public.affiliate_offers(provider_id, campaign_id);
create index if not exists affiliate_clicks_offer_occurred_idx
  on public.affiliate_clicks(offer_id, occurred_at desc);
create index if not exists affiliate_clicks_user_occurred_idx
  on public.affiliate_clicks(user_id, occurred_at desc)
  where user_id is not null;
create index if not exists affiliate_conversions_attribution_idx
  on public.affiliate_conversions(attribution_id);

alter table public.affiliate_offers enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.affiliate_conversions enable row level security;

-- No browser-side writes. Service-role/server authority owns campaign and conversion ingestion.
revoke all on public.affiliate_offers from anon, authenticated;
revoke all on public.affiliate_clicks from anon, authenticated;
revoke all on public.affiliate_conversions from anon, authenticated;

-- Authenticated users may inspect only their own attribution history.
drop policy if exists affiliate_clicks_select_own on public.affiliate_clicks;
create policy affiliate_clicks_select_own
  on public.affiliate_clicks
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.affiliate_clicks to authenticated;

comment on table public.affiliate_offers is
  'E4.3 affiliate campaign contract. Production activation remains explicit and disabled by default.';
comment on table public.affiliate_clicks is
  'Privacy-minimised affiliate click attribution with unique deduplication keys.';
comment on table public.affiliate_conversions is
  'Provider conversion evidence with provider and request-level idempotency.';
