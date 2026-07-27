begin;

create table if not exists public.service_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exchange_id uuid null,
  provider_id text not null,
  provider_reference text null,
  category text not null check (category in (
    'courier',
    'packaging',
    'insurance',
    'travel',
    'accommodation',
    'promotion',
    'affiliate-service'
  )),
  status text not null default 'draft' check (status in (
    'draft',
    'checkout-pending',
    'payment-pending',
    'paid',
    'payment-failed',
    'cancelled',
    'refund-pending',
    'refunded'
  )),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  commission_minor bigint not null check (commission_minor >= 0),
  total_minor bigint generated always as (subtotal_minor + commission_minor) stored,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_id, idempotency_key),
  unique (provider_id, provider_reference)
);

create index if not exists service_payment_orders_user_created_idx
  on public.service_payment_orders (user_id, created_at desc);

create index if not exists service_payment_orders_status_idx
  on public.service_payment_orders (status, updated_at);

alter table public.service_payment_orders enable row level security;

revoke all on table public.service_payment_orders from anon;
revoke insert, update, delete on table public.service_payment_orders from authenticated;
grant select on table public.service_payment_orders to authenticated;

create policy "service payment owners can read their orders"
  on public.service_payment_orders
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.service_payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_payment_orders(id) on delete cascade,
  provider_id text not null,
  provider_event_id text not null,
  event_type text not null,
  payload_digest text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  processing_result text null,
  unique (provider_id, provider_event_id)
);

create index if not exists service_payment_events_order_idx
  on public.service_payment_events (order_id, received_at desc);

alter table public.service_payment_events enable row level security;
revoke all on table public.service_payment_events from anon, authenticated;

comment on table public.service_payment_orders is
  'E4.4 canonical orders for optional services around a swap. The swap itself is not charged.';
comment on table public.service_payment_events is
  'Provider event deduplication and audit ledger. Server-side authority only.';

commit;
