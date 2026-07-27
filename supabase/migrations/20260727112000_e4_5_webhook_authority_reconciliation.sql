begin;

alter table public.service_payment_events
  add column if not exists provider_object_id text,
  add column if not exists signature_verified boolean not null default false,
  add column if not exists processing_status text not null default 'received',
  add column if not exists attempt_count integer not null default 0,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists dead_lettered_at timestamptz,
  add column if not exists provider_created_at timestamptz;

alter table public.service_payment_events
  drop constraint if exists service_payment_events_processing_status_check;

alter table public.service_payment_events
  add constraint service_payment_events_processing_status_check
  check (processing_status in (
    'received',
    'processing',
    'processed',
    'ignored',
    'retry-pending',
    'dead-letter'
  ));

alter table public.service_payment_events
  add constraint service_payment_events_attempt_count_check
  check (attempt_count >= 0);

create index if not exists service_payment_events_retry_idx
  on public.service_payment_events (processing_status, next_attempt_at)
  where processing_status = 'retry-pending';

create index if not exists service_payment_events_dead_letter_idx
  on public.service_payment_events (dead_lettered_at desc)
  where processing_status = 'dead-letter';

create table if not exists public.service_payment_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  checked_count integer not null default 0 check (checked_count >= 0),
  mismatch_count integer not null default 0 check (mismatch_count >= 0),
  corrected_count integer not null default 0 check (corrected_count >= 0),
  manual_review_count integer not null default 0 check (manual_review_count >= 0),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  error_code text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.service_payment_reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.service_payment_reconciliation_runs(id) on delete cascade,
  order_id uuid not null references public.service_payment_orders(id) on delete cascade,
  provider_id text not null,
  provider_object_id text not null,
  local_status text not null,
  provider_status text not null,
  action text not null check (action in ('none', 'apply-provider-status', 'manual-review')),
  created_at timestamptz not null default now(),
  unique (run_id, order_id)
);

create index if not exists service_payment_reconciliation_items_order_idx
  on public.service_payment_reconciliation_items (order_id, created_at desc);

alter table public.service_payment_reconciliation_runs enable row level security;
alter table public.service_payment_reconciliation_items enable row level security;

revoke all on table public.service_payment_reconciliation_runs from anon, authenticated;
revoke all on table public.service_payment_reconciliation_items from anon, authenticated;

comment on table public.service_payment_reconciliation_runs is
  'E4.5 provider-to-Swaply reconciliation runs. Server-side authority only.';
comment on table public.service_payment_reconciliation_items is
  'E4.5 per-order reconciliation evidence and correction decision.';

commit;
