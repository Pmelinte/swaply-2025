begin;

create table if not exists public.promotion_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  disclosure_label text not null default 'sponsored' check (disclosure_label = 'sponsored'),
  status text not null default 'draft' check (status in (
    'draft', 'pending-review', 'approved', 'active', 'paused', 'rejected', 'expired', 'cancelled'
  )),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  budget_minor bigint not null check (budget_minor > 0),
  spent_minor bigint not null default 0 check (spent_minor >= 0 and spent_minor <= budget_minor),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  frequency_cap_per_user_per_day integer not null default 3
    check (frequency_cap_per_user_per_day between 1 and 20),
  targeting jsonb not null default '{"placements":[]}'::jsonb,
  moderation_approved_at timestamptz null,
  moderation_rejected_at timestamptz null,
  kill_switch_activated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.promotion_impressions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promotion_campaigns(id) on delete cascade,
  viewer_user_id uuid null references auth.users(id) on delete set null,
  anonymous_session_hash text null,
  placement text not null,
  country_code text null,
  locale text null,
  category text null,
  occurred_at timestamptz not null default now(),
  check (viewer_user_id is not null or anonymous_session_hash is not null)
);

create index if not exists promotion_campaigns_delivery_idx
  on public.promotion_campaigns (status, starts_at, ends_at);

create index if not exists promotion_impressions_frequency_idx
  on public.promotion_impressions (campaign_id, viewer_user_id, occurred_at desc);

alter table public.promotion_campaigns enable row level security;
alter table public.promotion_impressions enable row level security;

revoke all on table public.promotion_campaigns from anon;
revoke all on table public.promotion_impressions from anon, authenticated;
revoke insert, update, delete on table public.promotion_campaigns from authenticated;
grant select on table public.promotion_campaigns to authenticated;

create policy "advertisers can read own campaigns"
  on public.promotion_campaigns
  for select
  to authenticated
  using (auth.uid() = advertiser_id);

comment on table public.promotion_campaigns is
  'E4.7 controlled campaigns. Delivery requires moderation, disclosure, budget, schedule, frequency cap and kill-switch gates.';
comment on table public.promotion_impressions is
  'Server-side impression evidence used for frequency caps and aggregate reporting; no advertiser access to viewer identity.';

commit;
