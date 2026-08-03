begin;

create schema if not exists private;

create table if not exists public.event_transfers (
  id uuid primary key default extensions.gen_random_uuid(),
  event_item_id uuid not null references public.items(id) on delete restrict,
  swap_id uuid not null references public.swaps(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  provider_id uuid not null references auth.users(id) on delete restrict,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  agreement_revision integer not null check (agreement_revision >= 1),
  agreement_hash text not null check (agreement_hash ~ '^[a-f0-9]{64}$'),
  quantity integer not null check (quantity between 1 and 1000),
  issuer_rule_source text not null,
  transfer_deadline_at timestamptz not null,
  bundle jsonb not null check (jsonb_typeof(bundle) = 'object'),
  proof_required boolean not null default true,
  transfer_notes text not null,
  status text not null default 'pending'
    check (status in (
      'pending', 'proof_submitted', 'retry_requested', 'confirmed',
      'disputed', 'cancelled', 'resolved'
    )),
  revision bigint not null default 0 check (revision >= 0),
  proof_revision integer not null default 0 check (proof_revision >= 0),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  closed_at timestamptz,
  close_reason text,
  capacity_released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swap_id, event_item_id),
  check (provider_id <> recipient_id),
  check (char_length(issuer_rule_source) between 1 and 2000),
  check (char_length(transfer_notes) between 1 and 2000),
  check (proof_required),
  check (
    (status = 'confirmed' and confirmed_at is not null)
    or status <> 'confirmed'
  ),
  check (
    (status in ('cancelled', 'resolved') and closed_at is not null and close_reason is not null)
    or (status not in ('cancelled', 'resolved') and closed_at is null and close_reason is null)
  ),
  check (
    capacity_released_at is null
    or status in ('cancelled', 'resolved')
  )
);

create table if not exists public.event_proofs (
  id uuid primary key default extensions.gen_random_uuid(),
  transfer_id uuid not null references public.event_transfers(id) on delete cascade,
  proof_revision integer not null check (proof_revision >= 1),
  submitted_by uuid not null references auth.users(id) on delete restrict,
  note text not null check (char_length(note) between 1 and 2000),
  payload jsonb not null check (jsonb_typeof(payload) = 'array'),
  payload_digest text not null check (payload_digest ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (transfer_id, proof_revision)
);

create table if not exists public.event_transfer_events (
  id uuid primary key default extensions.gen_random_uuid(),
  transfer_id uuid not null references public.event_transfers(id) on delete cascade,
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'created', 'proof_submitted', 'retry_requested', 'transfer_confirmed',
    'transfer_failure_reported', 'disputed', 'cancelled', 'resolved',
    'capacity_released'
  )),
  transfer_revision bigint not null check (transfer_revision >= 0),
  proof_revision integer check (proof_revision is null or proof_revision >= 1),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists public.event_transfer_mutation_receipts (
  actor_id uuid not null references auth.users(id) on delete cascade,
  transfer_id uuid not null references public.event_transfers(id) on delete cascade,
  command text not null check (command in (
    'submit_proof', 'request_retry', 'confirm_transfer', 'report_failure'
  )),
  idempotency_key text not null,
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, transfer_id, idempotency_key),
  check (char_length(idempotency_key) between 8 and 120),
  check (idempotency_key ~ '^[A-Za-z0-9._:-]+$'),
  check (request_hash ~ '^[a-f0-9]{64}$'),
  check (jsonb_typeof(response) = 'object')
);

alter table public.event_transfers enable row level security;
alter table public.event_proofs enable row level security;
alter table public.event_transfer_events enable row level security;
alter table public.event_transfer_mutation_receipts enable row level security;

revoke all on table public.event_transfers
  from public, anon, authenticated;
revoke all on table public.event_proofs
  from public, anon, authenticated;
revoke all on table public.event_transfer_events
  from public, anon, authenticated;
revoke all on table public.event_transfer_mutation_receipts
  from public, anon, authenticated;

grant select on table public.event_transfers to authenticated;
grant select on table public.event_transfer_events to authenticated;
grant all on table public.event_transfers to service_role;
grant all on table public.event_proofs to service_role;
grant all on table public.event_transfer_events to service_role;
grant all on table public.event_transfer_mutation_receipts to service_role;

drop policy if exists event_transfers_participant_select
  on public.event_transfers;
create policy event_transfers_participant_select
on public.event_transfers
for select
to authenticated
using ((select auth.uid()) in (provider_id, recipient_id));

drop policy if exists event_transfer_events_participant_select
  on public.event_transfer_events;
create policy event_transfer_events_participant_select
on public.event_transfer_events
for select
to authenticated
using (
  exists (
    select 1
    from public.event_transfers transfer_row
    where transfer_row.id = event_transfer_events.transfer_id
      and (select auth.uid()) in (
        transfer_row.provider_id,
        transfer_row.recipient_id
      )
  )
);

create index if not exists event_transfers_swap_idx
  on public.event_transfers (swap_id, status);
create index if not exists event_transfers_capacity_idx
  on public.event_transfers (event_item_id, status, transfer_deadline_at);
create index if not exists event_transfers_conversation_idx
  on public.event_transfers (conversation_id);
create index if not exists event_transfers_provider_idx
  on public.event_transfers (provider_id);
create index if not exists event_transfers_recipient_idx
  on public.event_transfers (recipient_id);
create index if not exists event_proofs_transfer_created_idx
  on public.event_proofs (transfer_id, proof_revision desc, created_at desc);
create index if not exists event_proofs_submitted_by_idx
  on public.event_proofs (submitted_by);
create index if not exists event_transfer_events_transfer_created_idx
  on public.event_transfer_events (transfer_id, created_at, id);
create index if not exists event_transfer_events_swap_idx
  on public.event_transfer_events (swap_id);
create index if not exists event_transfer_events_actor_idx
  on public.event_transfer_events (actor_id);
create index if not exists event_transfer_receipts_created_idx
  on public.event_transfer_mutation_receipts (transfer_id, created_at desc);

comment on table public.event_transfers is
  'V1-05.4.5 server-authoritative Event transfer state frozen from the bilateral Agreement.';
comment on table public.event_proofs is
  'Private versioned ticket, booking, code or issuer-transfer proof. Raw payload is available only through participant-authorized RPC.';
comment on table public.event_transfer_events is
  'Participant-visible Event transfer ledger containing no raw ticket, booking or access code.';
comment on table public.event_transfer_mutation_receipts is
  'Server-only exact-once receipts for Event transfer commands.';

create or replace function private.event_transfer_response_v1(
  p_transfer_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_transfer public.event_transfers%rowtype;
  v_proof_summary jsonb;
  v_events jsonb;
begin
  select transfer_row.*
  into v_transfer
  from public.event_transfers transfer_row
  where transfer_row.id = p_transfer_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Event transfer not found.';
  end if;

  select coalesce(
    jsonb_build_object(
      'proof_revision', proof_row.proof_revision,
      'proof_count', jsonb_array_length(proof_row.payload),
      'payload_digest', proof_row.payload_digest,
      'submitted_at', proof_row.created_at
    ),
    '{}'::jsonb
  )
  into v_proof_summary
  from public.event_proofs proof_row
  where proof_row.transfer_id = p_transfer_id
  order by proof_row.proof_revision desc
  limit 1;

  if v_proof_summary is null then
    v_proof_summary := '{}'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(to_jsonb(event_row) order by event_row.created_at, event_row.id),
    '[]'::jsonb
  )
  into v_events
  from public.event_transfer_events event_row
  where event_row.transfer_id = p_transfer_id;

  return jsonb_build_object(
    'transfer', to_jsonb(v_transfer),
    'proof_summary', v_proof_summary,
    'events', v_events
  );
end;
$function$;

revoke all on function private.event_transfer_response_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.get_event_transfers_v1(
  p_swap_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_transfers jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select swap_row.*
  into v_swap
  from public.swaps swap_row
  where swap_row.id = p_swap_id;

  if not found or v_actor not in (v_swap.requester_id, v_swap.responder_id) then
    raise exception using errcode = '42501', message = 'Event transfer access denied.';
  end if;

  select coalesce(
    jsonb_agg(
      private.event_transfer_response_v1(transfer_row.id)
      order by transfer_row.event_item_id
    ),
    '[]'::jsonb
  )
  into v_transfers
  from public.event_transfers transfer_row
  where transfer_row.swap_id = p_swap_id;

  return jsonb_build_object(
    'swap_id', p_swap_id,
    'transfers', v_transfers
  );
end;
$function$;

revoke all on function public.get_event_transfers_v1(uuid)
  from public, anon;
grant execute on function public.get_event_transfers_v1(uuid)
  to authenticated;

create or replace function public.get_event_transfer_proof_v1(
  p_transfer_id uuid,
  p_expected_proof_revision integer
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_transfer public.event_transfers%rowtype;
  v_proof public.event_proofs%rowtype;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_transfer_id is null
    or p_expected_proof_revision is null
    or p_expected_proof_revision < 1
  then
    raise exception using errcode = '22023', message = 'A valid Event proof revision is required.';
  end if;

  select transfer_row.*
  into v_transfer
  from public.event_transfers transfer_row
  where transfer_row.id = p_transfer_id;

  if not found
    or v_actor not in (v_transfer.provider_id, v_transfer.recipient_id)
  then
    raise exception using errcode = '42501', message = 'Event proof access denied.';
  end if;

  if v_transfer.proof_revision <> p_expected_proof_revision
    or v_transfer.status not in (
      'proof_submitted', 'retry_requested', 'confirmed', 'disputed', 'resolved'
    )
  then
    raise exception using errcode = '40001', message = 'Event proof revision is unavailable or stale.';
  end if;

  select proof_row.*
  into v_proof
  from public.event_proofs proof_row
  where proof_row.transfer_id = p_transfer_id
    and proof_row.proof_revision = p_expected_proof_revision;

  if not found then
    raise exception using errcode = 'P0002', message = 'Event proof not found.';
  end if;

  return jsonb_build_object(
    'transfer_id', p_transfer_id,
    'proof_revision', v_proof.proof_revision,
    'note', v_proof.note,
    'proof', v_proof.payload,
    'payload_digest', v_proof.payload_digest,
    'submitted_at', v_proof.created_at
  );
end;
$function$;

revoke all on function public.get_event_transfer_proof_v1(uuid, integer)
  from public, anon;
grant execute on function public.get_event_transfer_proof_v1(uuid, integer)
  to authenticated;

create or replace function private.validate_event_transfer_proof_v1(
  p_proof jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_entry jsonb;
  v_unknown_key text;
  v_type text;
  v_reference text;
  v_label text;
  v_normalized jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_proof) is distinct from 'array'
    or jsonb_array_length(p_proof) not between 1 and 10
  then
    raise exception using errcode = '22023', message = 'Event transfer proof must contain between 1 and 10 entries.';
  end if;

  for v_entry in
    select value from jsonb_array_elements(p_proof)
  loop
    if jsonb_typeof(v_entry) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'Invalid Event proof entry.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_entry) keys(key)
    where key not in ('type', 'reference', 'label')
    limit 1;

    if v_unknown_key is not null then
      raise exception using errcode = '22023', message = format(
        'Unsupported Event proof field: %s',
        v_unknown_key
      );
    end if;

    if jsonb_typeof(v_entry -> 'type') is distinct from 'string'
      or jsonb_typeof(v_entry -> 'reference') is distinct from 'string'
      or (
        v_entry ? 'label'
        and jsonb_typeof(v_entry -> 'label') is distinct from 'string'
      )
    then
      raise exception using errcode = '22023', message = 'Invalid Event proof field types.';
    end if;

    v_type := btrim(v_entry ->> 'type');
    v_reference := btrim(v_entry ->> 'reference');
    v_label := nullif(btrim(v_entry ->> 'label'), '');

    if v_type not in (
      'ticket', 'booking_reference', 'qr_code', 'transfer_confirmation',
      'email', 'document', 'note'
    )
      or char_length(v_reference) not between 1 and 4000
      or (v_label is not null and char_length(v_label) > 200)
    then
      raise exception using errcode = '22023', message = 'Invalid Event proof value.';
    end if;

    v_normalized := v_normalized || jsonb_build_array(
      jsonb_strip_nulls(jsonb_build_object(
        'type', v_type,
        'reference', v_reference,
        'label', v_label
      ))
    );
  end loop;

  return v_normalized;
end;
$function$;

revoke all on function private.validate_event_transfer_proof_v1(jsonb)
  from public, anon, authenticated, service_role;

create or replace function private.release_event_transfer_capacity_v1(
  p_transfer_id uuid,
  p_reason text,
  p_actor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_transfer public.event_transfers%rowtype;
  v_event public.events_listings%rowtype;
  v_current_capacity integer;
  v_next_capacity integer;
begin
  select transfer_row.*
  into v_transfer
  from public.event_transfers transfer_row
  where transfer_row.id = p_transfer_id
  for update;

  if not found
    or v_transfer.capacity_released_at is not null
    or v_transfer.confirmed_at is not null
  then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'event-transfer-capacity:' || v_transfer.event_item_id::text,
      0
    )
  );

  select event_row.*
  into v_event
  from public.events_listings event_row
  where event_row.item_id = v_transfer.event_item_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Event listing is unavailable for capacity release.';
  end if;

  v_current_capacity := greatest(
    0,
    coalesce(v_event.capacity_available, 0)
  );
  v_next_capacity := v_current_capacity + v_transfer.quantity;

  if v_event.capacity_total is not null then
    v_next_capacity := least(v_next_capacity, greatest(0, v_event.capacity_total));
  end if;

  update public.events_listings
  set capacity_available = v_next_capacity,
      updated_at = clock_timestamp()
  where item_id = v_transfer.event_item_id;

  update public.event_transfers
  set capacity_released_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = p_transfer_id
  returning * into v_transfer;

  insert into public.event_transfer_events (
    transfer_id,
    swap_id,
    actor_id,
    event_type,
    transfer_revision,
    proof_revision,
    metadata
  ) values (
    v_transfer.id,
    v_transfer.swap_id,
    p_actor_id,
    'capacity_released',
    v_transfer.revision,
    nullif(v_transfer.proof_revision, 0),
    jsonb_build_object(
      'reason', p_reason,
      'quantity', v_transfer.quantity,
      'capacity_available', v_next_capacity
    )
  );

  return true;
end;
$function$;

revoke all on function private.release_event_transfer_capacity_v1(uuid, text, uuid)
  from public, anon, authenticated, service_role;

create or replace function private.create_event_transfers_on_exchange_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_event_count integer;
  v_event_term_count integer;
  v_source record;
  v_event public.events_listings%rowtype;
  v_entry jsonb;
  v_terms jsonb;
  v_provider uuid;
  v_recipient uuid;
  v_transfer_id uuid;
  v_quantity integer;
  v_available integer;
  v_deadline timestamptz;
  v_bundle jsonb;
  v_unknown_key text;
begin
  if new.exchange_kind <> 'bilateral' then
    return new;
  end if;

  select count(*)
  into v_event_count
  from public.items item_row
  where item_row.id in (new.offered_item_id, new.requested_item_id)
    and item_row.item_type = 'event';

  if v_event_count = 0 then
    return new;
  end if;

  if v_actor is null or v_actor not in (new.requester_id, new.responder_id) then
    raise exception using errcode = '42501', message = 'Event transfer creation requires an Exchange participant.';
  end if;

  if new.conversation_id is null
    or new.swap_metadata ->> 'source' is distinct from 'domain_aware_match_agreement'
    or coalesce(new.swap_metadata ->> 'agreement_hash', '') !~ '^[a-f0-9]{64}$'
    or new.agreement_revision < 1
    or jsonb_typeof(new.exchange_data -> 'domain_terms') is distinct from 'array'
  then
    raise exception using errcode = '22023', message = 'Complete Event Agreement terms are required before transfer creation.';
  end if;

  select count(*)
  into v_event_term_count
  from jsonb_array_elements(new.exchange_data -> 'domain_terms') term(value)
  where term.value ->> 'domain' = 'event';

  if v_event_term_count <> v_event_count then
    raise exception using errcode = '22023', message = 'Every Event in the Exchange requires one transfer contract.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.exchange_data -> 'domain_terms') term(value)
    where term.value ->> 'domain' = 'event'
    group by term.value ->> 'item_id'
    having count(*) <> 1
  ) then
    raise exception using errcode = '22023', message = 'Duplicate Event transfer terms are not allowed.';
  end if;

  for v_source in
    select item_row.id as event_item_id, item_row.owner_id
    from public.items item_row
    where item_row.id in (new.offered_item_id, new.requested_item_id)
      and item_row.item_type = 'event'
      and item_row.status = 'active'
      and item_row.is_active = true
    order by item_row.id
  loop
    v_provider := v_source.owner_id;

    if v_provider not in (new.requester_id, new.responder_id) then
      raise exception using errcode = '42501', message = 'Event provider is outside this Exchange.';
    end if;

    v_recipient := case
      when v_provider = new.requester_id then new.responder_id
      else new.requester_id
    end;

    select term.value
    into v_entry
    from jsonb_array_elements(new.exchange_data -> 'domain_terms') term(value)
    where term.value ->> 'domain' = 'event'
      and term.value ->> 'item_id' = v_source.event_item_id::text
    limit 1;

    if v_entry is null
      or jsonb_typeof(v_entry -> 'terms') is distinct from 'object'
    then
      raise exception using errcode = '22023', message = 'Event transfer contract item mismatch.';
    end if;

    v_terms := v_entry -> 'terms';

    select key
    into v_unknown_key
    from jsonb_object_keys(v_terms) keys(key)
    where key not in (
      'quantity', 'transferable', 'issuer_rule_confirmed',
      'issuer_rule_source', 'transfer_deadline_at', 'bundle',
      'proof_required', 'transfer_notes'
    )
    limit 1;

    if v_unknown_key is not null then
      raise exception using errcode = '22023', message = format(
        'Unsupported Event transfer field: %s',
        v_unknown_key
      );
    end if;

    if jsonb_typeof(v_terms -> 'quantity') is distinct from 'number'
      or jsonb_typeof(v_terms -> 'transferable') is distinct from 'boolean'
      or jsonb_typeof(v_terms -> 'issuer_rule_confirmed') is distinct from 'boolean'
      or jsonb_typeof(v_terms -> 'issuer_rule_source') is distinct from 'string'
      or jsonb_typeof(v_terms -> 'transfer_deadline_at') is distinct from 'string'
      or jsonb_typeof(v_terms -> 'bundle') is distinct from 'object'
      or jsonb_typeof(v_terms -> 'proof_required') is distinct from 'boolean'
      or jsonb_typeof(v_terms -> 'transfer_notes') is distinct from 'string'
    then
      raise exception using errcode = '22023', message = 'Invalid Event transfer field types.';
    end if;

    v_quantity := (v_terms ->> 'quantity')::integer;
    v_deadline := (v_terms ->> 'transfer_deadline_at')::timestamptz;
    v_bundle := v_terms -> 'bundle';

    if v_quantity < 1
      or (v_terms ->> 'transferable')::boolean is not true
      or (v_terms ->> 'issuer_rule_confirmed')::boolean is not true
      or nullif(btrim(v_terms ->> 'issuer_rule_source'), '') is null
      or char_length(v_terms ->> 'issuer_rule_source') > 2000
      or (v_terms ->> 'proof_required')::boolean is not true
      or nullif(btrim(v_terms ->> 'transfer_notes'), '') is null
      or char_length(v_terms ->> 'transfer_notes') > 2000
      or v_deadline <= clock_timestamp()
      or jsonb_typeof(v_bundle -> 'ticket') is distinct from 'boolean'
      or jsonb_typeof(v_bundle -> 'accommodation') is distinct from 'boolean'
      or jsonb_typeof(v_bundle -> 'transport') is distinct from 'boolean'
      or not (
        (v_bundle ->> 'ticket')::boolean
        or (v_bundle ->> 'accommodation')::boolean
        or (v_bundle ->> 'transport')::boolean
      )
    then
      raise exception using errcode = '22023', message = 'Event transfer terms are incomplete.';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'event-transfer-capacity:' || v_source.event_item_id::text,
        0
      )
    );

    select event_row.*
    into v_event
    from public.events_listings event_row
    where event_row.item_id = v_source.event_item_id
      and event_row.status = 'active'
    for update;

    if not found
      or coalesce(v_event.is_transferable, false) is not true
      or coalesce(v_event.transfer_rule_confirmed, false) is not true
      or nullif(btrim(coalesce(v_event.transfer_rule_source, '')), '') is null
      or btrim(v_terms ->> 'issuer_rule_source') <> btrim(v_event.transfer_rule_source)
      or (
        v_event.transfer_deadline_at is not null
        and v_deadline > v_event.transfer_deadline_at
      )
      or (
        v_event.start_date is not null
        and v_deadline > (v_event.start_date::timestamp + time '23:59:59') at time zone coalesce(v_event.timezone, 'UTC')
      )
      or (
        coalesce((v_bundle ->> 'accommodation')::boolean, false)
        and coalesce(v_event.includes_accommodation, false) is not true
      )
      or (
        coalesce((v_bundle ->> 'transport')::boolean, false)
        and coalesce(v_event.includes_transport, false) is not true
      )
    then
      raise exception using errcode = '23514', message = 'Event listing is unavailable or its issuer transfer contract changed.';
    end if;

    v_available := greatest(
      0,
      coalesce(v_event.capacity_available, v_event.capacity_total, 0)
    );

    if v_quantity > v_available then
      raise exception using errcode = '23P01', message = 'Event transfer capacity is unavailable.';
    end if;

    update public.events_listings
    set capacity_available = v_available - v_quantity,
        updated_at = clock_timestamp()
    where item_id = v_source.event_item_id;

    insert into public.event_transfers (
      event_item_id,
      swap_id,
      conversation_id,
      provider_id,
      recipient_id,
      agreement_revision,
      agreement_hash,
      quantity,
      issuer_rule_source,
      transfer_deadline_at,
      bundle,
      proof_required,
      transfer_notes
    ) values (
      v_source.event_item_id,
      new.id,
      new.conversation_id,
      v_provider,
      v_recipient,
      new.agreement_revision,
      new.swap_metadata ->> 'agreement_hash',
      v_quantity,
      btrim(v_terms ->> 'issuer_rule_source'),
      v_deadline,
      v_bundle,
      true,
      btrim(v_terms ->> 'transfer_notes')
    )
    returning id into v_transfer_id;

    insert into public.event_transfer_events (
      transfer_id,
      swap_id,
      actor_id,
      event_type,
      transfer_revision,
      metadata
    ) values (
      v_transfer_id,
      new.id,
      v_actor,
      'created',
      0,
      jsonb_build_object(
        'agreement_revision', new.agreement_revision,
        'agreement_hash', new.swap_metadata ->> 'agreement_hash',
        'quantity', v_quantity,
        'transfer_deadline_at', v_deadline,
        'bundle', v_bundle
      )
    );
  end loop;

  if (
    select count(*)
    from public.event_transfers transfer_row
    where transfer_row.swap_id = new.id
  ) <> v_event_count then
    raise exception using errcode = '23514', message = 'Event transfer creation is incomplete.';
  end if;

  return new;
end;
$function$;

revoke all on function private.create_event_transfers_on_exchange_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists aaa_create_event_transfers_v1 on public.swaps;
create trigger aaa_create_event_transfers_v1
after insert on public.swaps
for each row
execute function private.create_event_transfers_on_exchange_v1();

create or replace function private.event_transfer_completion_guard_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  if old.status is distinct from new.status
    and new.status = 'completed'
    and exists (
      select 1
      from public.event_transfers transfer_row
      where transfer_row.swap_id = new.id
        and transfer_row.status <> 'confirmed'
    )
  then
    raise exception using errcode = '23514', message = 'Every Event transfer must be confirmed before Exchange completion.';
  end if;

  return new;
end;
$function$;

revoke all on function private.event_transfer_completion_guard_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists aaa_event_transfer_completion_guard_v1 on public.swaps;
create trigger aaa_event_transfer_completion_guard_v1
before update of status on public.swaps
for each row
execute function private.event_transfer_completion_guard_v1();

create or replace function private.sync_event_transfers_from_swap_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_changed record;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if new.status in ('cancelled', 'rejected', 'expired') then
    for v_changed in
      update public.event_transfers
      set status = 'cancelled',
          revision = revision + 1,
          closed_at = clock_timestamp(),
          close_reason = 'swap_' || new.status,
          updated_at = clock_timestamp()
      where swap_id = new.id
        and status not in ('cancelled', 'resolved')
      returning id, revision, proof_revision
    loop
      insert into public.event_transfer_events (
        transfer_id,
        swap_id,
        actor_id,
        event_type,
        transfer_revision,
        proof_revision,
        metadata
      ) values (
        v_changed.id,
        new.id,
        auth.uid(),
        'cancelled',
        v_changed.revision,
        nullif(v_changed.proof_revision, 0),
        jsonb_build_object('reason', 'swap_' || new.status)
      );

      perform private.release_event_transfer_capacity_v1(
        v_changed.id,
        'swap_' || new.status,
        auth.uid()
      );
    end loop;

  elsif new.status = 'disputed' then
    with changed as (
      update public.event_transfers
      set status = 'disputed',
          revision = revision + 1,
          updated_at = clock_timestamp()
      where swap_id = new.id
        and status not in ('cancelled', 'resolved')
      returning id, revision, proof_revision
    )
    insert into public.event_transfer_events (
      transfer_id,
      swap_id,
      actor_id,
      event_type,
      transfer_revision,
      proof_revision,
      metadata
    )
    select
      changed.id,
      new.id,
      auth.uid(),
      'disputed',
      changed.revision,
      nullif(changed.proof_revision, 0),
      jsonb_build_object('source', 'swap_dispute')
    from changed;
  end if;

  return new;
end;
$function$;

revoke all on function private.sync_event_transfers_from_swap_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists sync_event_transfers_from_swap_v1 on public.swaps;
create trigger sync_event_transfers_from_swap_v1
after update of status on public.swaps
for each row
execute function private.sync_event_transfers_from_swap_v1();

create or replace function private.resolve_event_transfers_from_dispute_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_changed record;
begin
  if old.status is distinct from new.status
    and new.status in (
      'resolved_requester', 'resolved_responder', 'resolved_split', 'rejected'
    )
  then
    for v_changed in
      update public.event_transfers
      set status = 'resolved',
          revision = revision + 1,
          closed_at = clock_timestamp(),
          close_reason = 'dispute_' || new.status,
          updated_at = clock_timestamp()
      where swap_id = new.swap_id
        and status = 'disputed'
      returning id, revision, proof_revision
    loop
      insert into public.event_transfer_events (
        transfer_id,
        swap_id,
        actor_id,
        event_type,
        transfer_revision,
        proof_revision,
        metadata
      ) values (
        v_changed.id,
        new.swap_id,
        auth.uid(),
        'resolved',
        v_changed.revision,
        nullif(v_changed.proof_revision, 0),
        jsonb_build_object('resolution', new.status)
      );

      perform private.release_event_transfer_capacity_v1(
        v_changed.id,
        'dispute_' || new.status,
        auth.uid()
      );
    end loop;
  end if;

  return new;
end;
$function$;

revoke all on function private.resolve_event_transfers_from_dispute_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists resolve_event_transfers_from_dispute_v1 on public.disputes;
create trigger resolve_event_transfers_from_dispute_v1
after update of status on public.disputes
for each row
execute function private.resolve_event_transfers_from_dispute_v1();

create or replace function public.mutate_event_transfer_v1(
  p_transfer_id uuid,
  p_command text,
  p_expected_revision bigint,
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_request_hash text;
  v_receipt public.event_transfer_mutation_receipts%rowtype;
  v_transfer public.event_transfers%rowtype;
  v_swap public.swaps%rowtype;
  v_unknown_key text;
  v_note text;
  v_reason text;
  v_description text;
  v_proof jsonb;
  v_evidence jsonb;
  v_proof_digest text;
  v_next_proof_revision integer;
  v_response jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_transfer_id is null
    or p_command not in (
      'submit_proof', 'request_retry', 'confirm_transfer', 'report_failure'
    )
    or p_expected_revision is null
    or p_expected_revision < 0
    or p_idempotency_key is null
    or char_length(p_idempotency_key) not between 8 and 120
    or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$'
    or jsonb_typeof(v_payload) is distinct from 'object'
  then
    raise exception using errcode = '22023', message = 'Invalid Event transfer mutation request.';
  end if;

  v_request_hash := encode(
    extensions.digest(
      concat_ws(
        '|',
        p_transfer_id::text,
        p_command,
        p_expected_revision::text,
        v_payload::text
      ),
      'sha256'
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'event-transfer-receipt:' || v_actor::text || ':' || p_transfer_id::text || ':' || p_idempotency_key,
      0
    )
  );

  select receipt_row.*
  into v_receipt
  from public.event_transfer_mutation_receipts receipt_row
  where receipt_row.actor_id = v_actor
    and receipt_row.transfer_id = p_transfer_id
    and receipt_row.idempotency_key = p_idempotency_key;

  if found then
    if v_receipt.command is distinct from p_command
      or v_receipt.request_hash is distinct from v_request_hash
    then
      raise exception using errcode = '23505', message = 'Idempotency key already used with another Event transfer request.';
    end if;

    return v_receipt.response || jsonb_build_object('replayed', true);
  end if;

  select transfer_row.swap_id
  into v_transfer.swap_id
  from public.event_transfers transfer_row
  where transfer_row.id = p_transfer_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Event transfer not found.';
  end if;

  select swap_row.*
  into v_swap
  from public.swaps swap_row
  where swap_row.id = v_transfer.swap_id
  for update;

  select transfer_row.*
  into v_transfer
  from public.event_transfers transfer_row
  where transfer_row.id = p_transfer_id
  for update;

  if v_actor not in (v_transfer.provider_id, v_transfer.recipient_id)
    or v_actor not in (v_swap.requester_id, v_swap.responder_id)
  then
    raise exception using errcode = '42501', message = 'Event transfer mutation denied.';
  end if;

  if v_transfer.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = format(
      'Stale Event transfer revision: expected %s, current %s.',
      p_expected_revision,
      v_transfer.revision
    );
  end if;

  if v_swap.status not in ('accepted', 'in_progress') then
    raise exception using errcode = '23514', message = 'Event transfer cannot change in the current Exchange state.';
  end if;

  if p_command = 'submit_proof' then
    if v_actor <> v_transfer.provider_id then
      raise exception using errcode = '42501', message = 'Only the Event provider may submit transfer proof.';
    end if;

    if v_transfer.status not in ('pending', 'retry_requested') then
      raise exception using errcode = '23514', message = 'Event transfer is not ready for proof submission.';
    end if;

    if clock_timestamp() > v_transfer.transfer_deadline_at then
      raise exception using errcode = '23514', message = 'Event transfer deadline has passed.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_payload) keys(key)
    where key not in ('note', 'proof')
    limit 1;

    if v_unknown_key is not null
      or jsonb_typeof(v_payload -> 'note') is distinct from 'string'
      or jsonb_typeof(v_payload -> 'proof') is distinct from 'array'
    then
      raise exception using errcode = '22023', message = 'Invalid Event proof submission payload.';
    end if;

    v_note := btrim(v_payload ->> 'note');
    v_proof := private.validate_event_transfer_proof_v1(v_payload -> 'proof');

    if char_length(v_note) not between 1 and 2000 then
      raise exception using errcode = '22023', message = 'Event proof submission note is required.';
    end if;

    v_next_proof_revision := v_transfer.proof_revision + 1;
    v_proof_digest := encode(
      extensions.digest(v_proof::text, 'sha256'),
      'hex'
    );

    insert into public.event_proofs (
      transfer_id,
      proof_revision,
      submitted_by,
      note,
      payload,
      payload_digest
    ) values (
      p_transfer_id,
      v_next_proof_revision,
      v_actor,
      v_note,
      v_proof,
      v_proof_digest
    );

    update public.event_transfers
    set status = 'proof_submitted',
        revision = revision + 1,
        proof_revision = v_next_proof_revision,
        submitted_at = clock_timestamp(),
        updated_at = clock_timestamp()
    where id = p_transfer_id
    returning * into v_transfer;

    if v_swap.status = 'accepted' then
      perform public.apply_swap_transition_v1(
        v_swap.id,
        'accepted',
        'in_progress',
        v_actor,
        'event_transfer',
        p_idempotency_key || ':swap'
      );
    end if;

    insert into public.event_transfer_events (
      transfer_id,
      swap_id,
      actor_id,
      event_type,
      transfer_revision,
      proof_revision,
      metadata
    ) values (
      p_transfer_id,
      v_transfer.swap_id,
      v_actor,
      'proof_submitted',
      v_transfer.revision,
      v_transfer.proof_revision,
      jsonb_build_object(
        'proof_count', jsonb_array_length(v_proof),
        'payload_digest', v_proof_digest
      )
    );

  elsif p_command = 'request_retry' then
    if v_actor <> v_transfer.recipient_id then
      raise exception using errcode = '42501', message = 'Only the Event recipient may request another transfer proof.';
    end if;

    if v_transfer.status <> 'proof_submitted' then
      raise exception using errcode = '23514', message = 'Only submitted Event proof may receive a retry request.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_payload) keys(key)
    where key not in ('reason')
    limit 1;

    if v_unknown_key is not null
      or jsonb_typeof(v_payload -> 'reason') is distinct from 'string'
    then
      raise exception using errcode = '22023', message = 'Invalid Event transfer retry payload.';
    end if;

    v_reason := btrim(v_payload ->> 'reason');

    if char_length(v_reason) not between 3 and 2000 then
      raise exception using errcode = '22023', message = 'Event transfer retry reason is required.';
    end if;

    update public.event_transfers
    set status = 'retry_requested',
        revision = revision + 1,
        updated_at = clock_timestamp()
    where id = p_transfer_id
    returning * into v_transfer;

    insert into public.event_transfer_events (
      transfer_id,
      swap_id,
      actor_id,
      event_type,
      transfer_revision,
      proof_revision,
      metadata
    ) values (
      p_transfer_id,
      v_transfer.swap_id,
      v_actor,
      'retry_requested',
      v_transfer.revision,
      nullif(v_transfer.proof_revision, 0),
      jsonb_build_object('reason', v_reason)
    );

  elsif p_command = 'confirm_transfer' then
    if v_actor <> v_transfer.recipient_id then
      raise exception using errcode = '42501', message = 'Only the Event recipient may confirm transfer.';
    end if;

    if v_transfer.status <> 'proof_submitted'
      or v_transfer.proof_revision < 1
      or not exists (
        select 1
        from public.event_proofs proof_row
        where proof_row.transfer_id = p_transfer_id
          and proof_row.proof_revision = v_transfer.proof_revision
      )
    then
      raise exception using errcode = '23514', message = 'A current Event proof submission is required before confirmation.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_payload) keys(key)
    where key not in ('note')
    limit 1;

    if v_unknown_key is not null
      or (
        v_payload ? 'note'
        and jsonb_typeof(v_payload -> 'note') is distinct from 'string'
      )
      or char_length(coalesce(v_payload ->> 'note', '')) > 2000
    then
      raise exception using errcode = '22023', message = 'Invalid Event transfer confirmation payload.';
    end if;

    v_note := nullif(btrim(v_payload ->> 'note'), '');

    update public.event_transfers
    set status = 'confirmed',
        revision = revision + 1,
        confirmed_at = clock_timestamp(),
        updated_at = clock_timestamp()
    where id = p_transfer_id
    returning * into v_transfer;

    insert into public.event_transfer_events (
      transfer_id,
      swap_id,
      actor_id,
      event_type,
      transfer_revision,
      proof_revision,
      metadata
    ) values (
      p_transfer_id,
      v_transfer.swap_id,
      v_actor,
      'transfer_confirmed',
      v_transfer.revision,
      v_transfer.proof_revision,
      jsonb_strip_nulls(jsonb_build_object('note', v_note))
    );

  else
    if v_actor <> v_transfer.recipient_id then
      raise exception using errcode = '42501', message = 'Only the Event recipient may report transfer failure.';
    end if;

    if v_transfer.status not in ('pending', 'proof_submitted', 'retry_requested') then
      raise exception using errcode = '23514', message = 'Event transfer failure cannot be reported in the current state.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_payload) keys(key)
    where key not in ('reason', 'description', 'evidence')
    limit 1;

    if v_unknown_key is not null
      or jsonb_typeof(v_payload -> 'reason') is distinct from 'string'
      or jsonb_typeof(v_payload -> 'description') is distinct from 'string'
      or (
        v_payload ? 'evidence'
        and jsonb_typeof(v_payload -> 'evidence') is distinct from 'array'
      )
    then
      raise exception using errcode = '22023', message = 'Invalid Event transfer failure payload.';
    end if;

    v_reason := btrim(v_payload ->> 'reason');
    v_description := btrim(v_payload ->> 'description');
    v_evidence := coalesce(v_payload -> 'evidence', '[]'::jsonb);

    if v_reason not in (
      'not_received', 'issuer_rejected', 'expired', 'invalid_proof',
      'fraud_suspected', 'other'
    )
      or char_length(v_description) not between 10 and 2000
      or (
        v_reason in ('not_received', 'expired')
        and clock_timestamp() <= v_transfer.transfer_deadline_at
      )
    then
      raise exception using errcode = '22023', message = 'Event transfer failure details are invalid or premature.';
    end if;

    insert into public.event_transfer_events (
      transfer_id,
      swap_id,
      actor_id,
      event_type,
      transfer_revision,
      proof_revision,
      metadata
    ) values (
      p_transfer_id,
      v_transfer.swap_id,
      v_actor,
      'transfer_failure_reported',
      v_transfer.revision,
      nullif(v_transfer.proof_revision, 0),
      jsonb_build_object('reason', v_reason)
    );

    perform public.open_swap_dispute_v1(
      v_transfer.swap_id,
      v_swap.status,
      'other',
      concat('Event transfer failure [', v_reason, ']: ', v_description),
      v_evidence,
      'event:' || p_idempotency_key
    );

    select transfer_row.*
    into v_transfer
    from public.event_transfers transfer_row
    where transfer_row.id = p_transfer_id;
  end if;

  v_response := private.event_transfer_response_v1(p_transfer_id)
    || jsonb_build_object(
      'command', p_command,
      'replayed', false,
      'idempotency_key', p_idempotency_key
    );

  insert into public.event_transfer_mutation_receipts (
    actor_id,
    transfer_id,
    command,
    idempotency_key,
    request_hash,
    response
  ) values (
    v_actor,
    p_transfer_id,
    p_command,
    p_idempotency_key,
    v_request_hash,
    v_response
  );

  return v_response;
end;
$function$;

revoke all on function public.mutate_event_transfer_v1(uuid, text, bigint, jsonb, text)
  from public, anon;
grant execute on function public.mutate_event_transfer_v1(uuid, text, bigint, jsonb, text)
  to authenticated;

commit;
