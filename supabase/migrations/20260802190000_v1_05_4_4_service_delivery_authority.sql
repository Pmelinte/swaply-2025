begin;

create schema if not exists private;

create table if not exists public.service_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  service_item_id uuid not null references public.items(id) on delete restrict,
  swap_id uuid not null references public.swaps(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  provider_id uuid not null references auth.users(id) on delete restrict,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  agreement_revision integer not null check (agreement_revision >= 1),
  agreement_hash text not null check (agreement_hash ~ '^[a-f0-9]{64}$'),
  delivery_mode text not null check (delivery_mode in ('remote', 'physical', 'hybrid')),
  timezone text not null,
  deliverables jsonb not null check (jsonb_typeof(deliverables) = 'array'),
  duration_hours integer not null check (duration_hours >= 0),
  duration_days integer not null check (duration_days >= 0),
  deadline_at timestamptz not null,
  acceptance_criteria text not null,
  no_show_terms text not null,
  cancellation_terms text not null,
  dispute_terms text not null,
  status text not null default 'pending'
    check (status in (
      'pending', 'in_progress', 'awaiting_acceptance', 'revision_requested',
      'completed', 'disputed', 'cancelled', 'resolved'
    )),
  revision bigint not null default 0 check (revision >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  closed_at timestamptz,
  close_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swap_id, service_item_id),
  check (provider_id <> recipient_id),
  check (char_length(timezone) between 1 and 100),
  check (char_length(acceptance_criteria) between 1 and 2000),
  check (char_length(no_show_terms) between 1 and 1500),
  check (char_length(cancellation_terms) between 1 and 1500),
  check (char_length(dispute_terms) between 1 and 1500),
  check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed')
  ),
  check (
    (status in ('cancelled', 'resolved') and closed_at is not null and close_reason is not null)
    or (status not in ('cancelled', 'resolved') and closed_at is null and close_reason is null)
  )
);

create table if not exists public.service_delivery_milestones (
  delivery_id uuid not null references public.service_deliveries(id) on delete cascade,
  position integer not null check (position between 1 and 50),
  title text not null check (char_length(title) between 1 and 500),
  status text not null default 'pending'
    check (status in (
      'pending', 'in_progress', 'submitted', 'revision_requested',
      'accepted', 'disputed', 'cancelled', 'resolved'
    )),
  submission_revision integer not null default 0 check (submission_revision >= 0),
  submission_note text,
  submission_evidence jsonb not null default '[]'::jsonb
    check (jsonb_typeof(submission_evidence) = 'array'),
  revision_reason text,
  submitted_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (delivery_id, position),
  check (submission_note is null or char_length(submission_note) between 1 and 2000),
  check (revision_reason is null or char_length(revision_reason) between 3 and 2000),
  check (
    (status = 'submitted' and submitted_at is not null)
    or status <> 'submitted'
  ),
  check (
    (status = 'accepted' and submitted_at is not null and accepted_at is not null)
    or status <> 'accepted'
  )
);

create table if not exists public.service_delivery_events (
  id uuid primary key default extensions.gen_random_uuid(),
  delivery_id uuid not null references public.service_deliveries(id) on delete cascade,
  swap_id uuid not null references public.swaps(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'created', 'started', 'milestone_submitted', 'milestone_accepted',
    'revision_requested', 'missed_deadline', 'completed', 'disputed',
    'cancelled', 'resolved'
  )),
  milestone_position integer,
  delivery_revision bigint not null check (delivery_revision >= 0),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  check (milestone_position is null or milestone_position between 1 and 50)
);

create table if not exists public.service_delivery_mutation_receipts (
  actor_id uuid not null references auth.users(id) on delete cascade,
  delivery_id uuid not null references public.service_deliveries(id) on delete cascade,
  command text not null check (command in (
    'start', 'submit_milestone', 'accept_milestone',
    'request_revision', 'report_missed_deadline'
  )),
  idempotency_key text not null,
  request_hash text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, delivery_id, idempotency_key),
  check (char_length(idempotency_key) between 8 and 120),
  check (idempotency_key ~ '^[A-Za-z0-9._:-]+$'),
  check (request_hash ~ '^[a-f0-9]{64}$'),
  check (jsonb_typeof(response) = 'object')
);

alter table public.service_deliveries enable row level security;
alter table public.service_delivery_milestones enable row level security;
alter table public.service_delivery_events enable row level security;
alter table public.service_delivery_mutation_receipts enable row level security;

revoke all on table public.service_deliveries
  from public, anon, authenticated;
revoke all on table public.service_delivery_milestones
  from public, anon, authenticated;
revoke all on table public.service_delivery_events
  from public, anon, authenticated;
revoke all on table public.service_delivery_mutation_receipts
  from public, anon, authenticated;

grant select on table public.service_deliveries to authenticated;
grant select on table public.service_delivery_milestones to authenticated;
grant select on table public.service_delivery_events to authenticated;
grant all on table public.service_deliveries to service_role;
grant all on table public.service_delivery_milestones to service_role;
grant all on table public.service_delivery_events to service_role;
grant all on table public.service_delivery_mutation_receipts to service_role;

drop policy if exists service_deliveries_participant_select
  on public.service_deliveries;
create policy service_deliveries_participant_select
on public.service_deliveries
for select
to authenticated
using (auth.uid() in (provider_id, recipient_id));

drop policy if exists service_delivery_milestones_participant_select
  on public.service_delivery_milestones;
create policy service_delivery_milestones_participant_select
on public.service_delivery_milestones
for select
to authenticated
using (
  exists (
    select 1
    from public.service_deliveries d
    where d.id = service_delivery_milestones.delivery_id
      and auth.uid() in (d.provider_id, d.recipient_id)
  )
);

drop policy if exists service_delivery_events_participant_select
  on public.service_delivery_events;
create policy service_delivery_events_participant_select
on public.service_delivery_events
for select
to authenticated
using (
  exists (
    select 1
    from public.service_deliveries d
    where d.id = service_delivery_events.delivery_id
      and auth.uid() in (d.provider_id, d.recipient_id)
  )
);

create index if not exists service_deliveries_swap_idx
  on public.service_deliveries (swap_id, status);
create index if not exists service_deliveries_capacity_idx
  on public.service_deliveries (service_item_id, status, deadline_at);
create index if not exists service_delivery_events_delivery_created_idx
  on public.service_delivery_events (delivery_id, created_at, id);
create index if not exists service_delivery_receipts_created_idx
  on public.service_delivery_mutation_receipts (delivery_id, created_at desc);

comment on table public.service_deliveries is
  'V1-05.4.4 server-authoritative Service execution state frozen from the bilateral Agreement.';
comment on table public.service_delivery_milestones is
  'Ordered Service milestones with provider submissions and recipient acceptance or revision decisions.';
comment on table public.service_delivery_events is
  'Immutable participant-visible Service delivery and acceptance event stream.';

create or replace function private.service_delivery_response_v1(
  p_delivery_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_delivery public.service_deliveries%rowtype;
  v_milestones jsonb;
  v_events jsonb;
begin
  select d.*
  into v_delivery
  from public.service_deliveries d
  where d.id = p_delivery_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Service delivery not found.';
  end if;

  select coalesce(
    jsonb_agg(to_jsonb(m) order by m.position),
    '[]'::jsonb
  )
  into v_milestones
  from public.service_delivery_milestones m
  where m.delivery_id = p_delivery_id;

  select coalesce(
    jsonb_agg(to_jsonb(e) order by e.created_at, e.id),
    '[]'::jsonb
  )
  into v_events
  from public.service_delivery_events e
  where e.delivery_id = p_delivery_id;

  return jsonb_build_object(
    'delivery', to_jsonb(v_delivery),
    'milestones', v_milestones,
    'events', v_events
  );
end;
$function$;

revoke all on function private.service_delivery_response_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.get_service_deliveries_v1(
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
  v_deliveries jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select s.*
  into v_swap
  from public.swaps s
  where s.id = p_swap_id;

  if not found or v_actor not in (v_swap.requester_id, v_swap.responder_id) then
    raise exception using errcode = '42501', message = 'Service delivery access denied.';
  end if;

  select coalesce(
    jsonb_agg(private.service_delivery_response_v1(d.id) order by d.service_item_id),
    '[]'::jsonb
  )
  into v_deliveries
  from public.service_deliveries d
  where d.swap_id = p_swap_id;

  return jsonb_build_object(
    'swap_id', p_swap_id,
    'deliveries', v_deliveries
  );
end;
$function$;

revoke all on function public.get_service_deliveries_v1(uuid)
  from public, anon;
grant execute on function public.get_service_deliveries_v1(uuid)
  to authenticated;

create or replace function private.validate_service_submission_evidence_v1(
  p_evidence jsonb
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
  if p_evidence is null then
    return '[]'::jsonb;
  end if;

  if jsonb_typeof(p_evidence) is distinct from 'array'
    or jsonb_array_length(p_evidence) > 10
  then
    raise exception using errcode = '22023', message = 'Service submission evidence must be an array of at most 10 entries.';
  end if;

  for v_entry in
    select value from jsonb_array_elements(p_evidence)
  loop
    if jsonb_typeof(v_entry) is distinct from 'object' then
      raise exception using errcode = '22023', message = 'Invalid Service submission evidence entry.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_entry) keys(key)
    where key not in ('type', 'reference', 'label')
    limit 1;

    if v_unknown_key is not null then
      raise exception using errcode = '22023', message = format('Unsupported Service evidence field: %s', v_unknown_key);
    end if;

    if jsonb_typeof(v_entry -> 'type') is distinct from 'string'
      or jsonb_typeof(v_entry -> 'reference') is distinct from 'string'
      or (
        v_entry ? 'label'
        and jsonb_typeof(v_entry -> 'label') is distinct from 'string'
      )
    then
      raise exception using errcode = '22023', message = 'Invalid Service submission evidence field types.';
    end if;

    v_type := btrim(v_entry ->> 'type');
    v_reference := btrim(v_entry ->> 'reference');
    v_label := nullif(btrim(v_entry ->> 'label'), '');

    if v_type not in ('photo', 'document', 'link', 'note')
      or char_length(v_reference) not between 1 and 2000
      or (v_label is not null and char_length(v_label) > 200)
    then
      raise exception using errcode = '22023', message = 'Invalid Service submission evidence value.';
    end if;

    v_normalized := v_normalized || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'type', v_type,
      'reference', v_reference,
      'label', v_label
    )));
  end loop;

  return v_normalized;
end;
$function$;

revoke all on function private.validate_service_submission_evidence_v1(jsonb)
  from public, anon, authenticated, service_role;

create or replace function private.create_service_deliveries_on_exchange_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_service_count integer;
  v_service_term_count integer;
  v_source record;
  v_entry jsonb;
  v_terms jsonb;
  v_provider uuid;
  v_recipient uuid;
  v_delivery_id uuid;
  v_active_count integer;
  v_capacity integer;
  v_deadline timestamptz;
  v_timezone text;
  v_duration_hours integer;
  v_duration_days integer;
  v_unknown_key text;
  v_milestone record;
begin
  if new.exchange_kind <> 'bilateral' then
    return new;
  end if;

  select count(*)
  into v_service_count
  from public.items i
  where i.id in (new.offered_item_id, new.requested_item_id)
    and i.item_type = 'service';

  if v_service_count = 0 then
    return new;
  end if;

  if v_actor is null or v_actor not in (new.requester_id, new.responder_id) then
    raise exception using errcode = '42501', message = 'Service delivery creation requires an Exchange participant.';
  end if;

  if new.conversation_id is null
    or new.swap_metadata ->> 'source' is distinct from 'domain_aware_match_agreement'
    or coalesce(new.swap_metadata ->> 'agreement_hash', '') !~ '^[a-f0-9]{64}$'
    or new.agreement_revision < 1
    or jsonb_typeof(new.exchange_data -> 'domain_terms') is distinct from 'array'
  then
    raise exception using errcode = '22023', message = 'Complete Service Agreement terms are required before delivery creation.';
  end if;

  select count(*)
  into v_service_term_count
  from jsonb_array_elements(new.exchange_data -> 'domain_terms') term(value)
  where term.value ->> 'domain' = 'service';

  if v_service_term_count <> v_service_count then
    raise exception using errcode = '22023', message = 'Every Service in the Exchange requires one delivery contract.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(new.exchange_data -> 'domain_terms') term(value)
    where term.value ->> 'domain' = 'service'
    group by term.value ->> 'item_id'
    having count(*) <> 1
  ) then
    raise exception using errcode = '22023', message = 'Duplicate Service delivery terms are not allowed.';
  end if;

  for v_source in
    select i.id as service_item_id, i.owner_id, s.*
    from public.items i
    join public.services_listings s on s.item_id = i.id
    where i.id in (new.offered_item_id, new.requested_item_id)
      and i.item_type = 'service'
      and i.status = 'active'
      and i.is_active = true
      and s.status = 'active'
    order by i.id
  loop
    v_provider := v_source.owner_id;

    if v_provider not in (new.requester_id, new.responder_id) then
      raise exception using errcode = '42501', message = 'Service provider is outside this Exchange.';
    end if;

    v_recipient := case
      when v_provider = new.requester_id then new.responder_id
      else new.requester_id
    end;

    select term.value
    into v_entry
    from jsonb_array_elements(new.exchange_data -> 'domain_terms') term(value)
    where term.value ->> 'domain' = 'service'
      and term.value ->> 'item_id' = v_source.service_item_id::text
    limit 1;

    if v_entry is null
      or jsonb_typeof(v_entry -> 'terms') is distinct from 'object'
    then
      raise exception using errcode = '22023', message = 'Service delivery contract item mismatch.';
    end if;

    v_terms := v_entry -> 'terms';

    select key
    into v_unknown_key
    from jsonb_object_keys(v_terms) keys(key)
    where key not in (
      'delivery_mode', 'timezone', 'deliverables', 'duration_hours',
      'duration_days', 'deadline_at', 'milestones', 'acceptance_criteria',
      'no_show_terms', 'cancellation_terms', 'dispute_terms'
    )
    limit 1;

    if v_unknown_key is not null then
      raise exception using errcode = '22023', message = format('Unsupported Service delivery field: %s', v_unknown_key);
    end if;

    if jsonb_typeof(v_terms -> 'delivery_mode') is distinct from 'string'
      or jsonb_typeof(v_terms -> 'timezone') is distinct from 'string'
      or jsonb_typeof(v_terms -> 'deliverables') is distinct from 'array'
      or jsonb_typeof(v_terms -> 'duration_hours') is distinct from 'number'
      or jsonb_typeof(v_terms -> 'duration_days') is distinct from 'number'
      or jsonb_typeof(v_terms -> 'deadline_at') is distinct from 'string'
      or jsonb_typeof(v_terms -> 'milestones') is distinct from 'array'
      or jsonb_typeof(v_terms -> 'acceptance_criteria') is distinct from 'string'
      or jsonb_typeof(v_terms -> 'no_show_terms') is distinct from 'string'
      or jsonb_typeof(v_terms -> 'cancellation_terms') is distinct from 'string'
      or jsonb_typeof(v_terms -> 'dispute_terms') is distinct from 'string'
    then
      raise exception using errcode = '22023', message = 'Invalid Service delivery field types.';
    end if;

    v_deadline := (v_terms ->> 'deadline_at')::timestamptz;
    v_timezone := btrim(v_terms ->> 'timezone');
    v_duration_hours := (v_terms ->> 'duration_hours')::integer;
    v_duration_days := (v_terms ->> 'duration_days')::integer;

    if v_terms ->> 'delivery_mode' not in ('remote', 'physical', 'hybrid')
      or not exists (
        select 1 from pg_catalog.pg_timezone_names where name = v_timezone
      )
      or jsonb_array_length(v_terms -> 'deliverables') not between 1 and 50
      or jsonb_array_length(v_terms -> 'milestones') not between 1 and 50
      or v_duration_hours < 0
      or v_duration_days < 0
      or (v_duration_hours = 0 and v_duration_days = 0)
      or v_deadline <= clock_timestamp()
      or nullif(btrim(v_terms ->> 'acceptance_criteria'), '') is null
      or nullif(btrim(v_terms ->> 'no_show_terms'), '') is null
      or nullif(btrim(v_terms ->> 'cancellation_terms'), '') is null
      or nullif(btrim(v_terms ->> 'dispute_terms'), '') is null
    then
      raise exception using errcode = '22023', message = 'Service delivery terms are incomplete.';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(v_terms -> 'deliverables') value(entry)
      where jsonb_typeof(value.entry) is distinct from 'string'
        or char_length(btrim(value.entry #>> '{}')) not between 1 and 500
    ) or exists (
      select 1
      from jsonb_array_elements(v_terms -> 'milestones') value(entry)
      where jsonb_typeof(value.entry) is distinct from 'string'
        or char_length(btrim(value.entry #>> '{}')) not between 1 and 500
    ) then
      raise exception using errcode = '22023', message = 'Service deliverables and milestones must contain bounded text values.';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('service-delivery-capacity:' || v_source.service_item_id::text, 0)
    );

    select count(*)
    into v_active_count
    from public.service_deliveries d
    where d.service_item_id = v_source.service_item_id
      and d.status in (
        'pending', 'in_progress', 'awaiting_acceptance',
        'revision_requested', 'disputed'
      );

    v_capacity := greatest(1, coalesce(v_source.max_concurrent_jobs, 1));

    if v_active_count >= v_capacity then
      raise exception using errcode = '23P01', message = 'Service provider capacity is unavailable.';
    end if;

    insert into public.service_deliveries (
      service_item_id,
      swap_id,
      conversation_id,
      provider_id,
      recipient_id,
      agreement_revision,
      agreement_hash,
      delivery_mode,
      timezone,
      deliverables,
      duration_hours,
      duration_days,
      deadline_at,
      acceptance_criteria,
      no_show_terms,
      cancellation_terms,
      dispute_terms
    ) values (
      v_source.service_item_id,
      new.id,
      new.conversation_id,
      v_provider,
      v_recipient,
      new.agreement_revision,
      new.swap_metadata ->> 'agreement_hash',
      v_terms ->> 'delivery_mode',
      v_timezone,
      v_terms -> 'deliverables',
      v_duration_hours,
      v_duration_days,
      v_deadline,
      btrim(v_terms ->> 'acceptance_criteria'),
      btrim(v_terms ->> 'no_show_terms'),
      btrim(v_terms ->> 'cancellation_terms'),
      btrim(v_terms ->> 'dispute_terms')
    )
    returning id into v_delivery_id;

    insert into public.service_delivery_milestones (
      delivery_id,
      position,
      title
    )
    select
      v_delivery_id,
      milestone.position::integer,
      btrim(milestone.title)
    from jsonb_array_elements_text(v_terms -> 'milestones')
      with ordinality as milestone(title, position)
    order by milestone.position;

    insert into public.service_delivery_events (
      delivery_id,
      swap_id,
      actor_id,
      event_type,
      delivery_revision,
      metadata
    ) values (
      v_delivery_id,
      new.id,
      v_actor,
      'created',
      0,
      jsonb_build_object(
        'agreement_revision', new.agreement_revision,
        'agreement_hash', new.swap_metadata ->> 'agreement_hash',
        'milestone_count', jsonb_array_length(v_terms -> 'milestones')
      )
    );
  end loop;

  if (
    select count(*)
    from public.service_deliveries d
    where d.swap_id = new.id
  ) <> v_service_count then
    raise exception using errcode = '23514', message = 'Service delivery creation is incomplete.';
  end if;

  return new;
end;
$function$;

revoke all on function private.create_service_deliveries_on_exchange_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists aaa_create_service_deliveries_v1 on public.swaps;
create trigger aaa_create_service_deliveries_v1
after insert on public.swaps
for each row
execute function private.create_service_deliveries_on_exchange_v1();

create or replace function private.service_delivery_completion_guard_v1()
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
      from public.service_deliveries d
      where d.swap_id = new.id
        and d.status <> 'completed'
    )
  then
    raise exception using errcode = '23514', message = 'Every Service delivery must be accepted before Exchange completion.';
  end if;

  return new;
end;
$function$;

revoke all on function private.service_delivery_completion_guard_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists aaa_service_delivery_completion_guard_v1 on public.swaps;
create trigger aaa_service_delivery_completion_guard_v1
before update of status on public.swaps
for each row
execute function private.service_delivery_completion_guard_v1();

create or replace function private.sync_service_deliveries_from_swap_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if new.status in ('cancelled', 'rejected', 'expired') then
    with changed as (
      update public.service_deliveries
      set status = 'cancelled',
          revision = revision + 1,
          closed_at = clock_timestamp(),
          close_reason = 'swap_' || new.status,
          updated_at = clock_timestamp()
      where swap_id = new.id
        and status not in ('completed', 'cancelled', 'resolved')
      returning id, revision
    )
    insert into public.service_delivery_events (
      delivery_id, swap_id, actor_id, event_type, delivery_revision, metadata
    )
    select
      changed.id,
      new.id,
      auth.uid(),
      'cancelled',
      changed.revision,
      jsonb_build_object('reason', 'swap_' || new.status)
    from changed;

    update public.service_delivery_milestones m
    set status = 'cancelled',
        updated_at = clock_timestamp()
    from public.service_deliveries d
    where d.id = m.delivery_id
      and d.swap_id = new.id
      and m.status not in ('accepted', 'cancelled', 'resolved');

  elsif new.status = 'disputed' then
    with changed as (
      update public.service_deliveries
      set status = 'disputed',
          revision = revision + 1,
          updated_at = clock_timestamp()
      where swap_id = new.id
        and status not in ('cancelled', 'resolved')
      returning id, revision
    )
    insert into public.service_delivery_events (
      delivery_id, swap_id, actor_id, event_type, delivery_revision, metadata
    )
    select
      changed.id,
      new.id,
      auth.uid(),
      'disputed',
      changed.revision,
      jsonb_build_object('source', 'swap_dispute')
    from changed;

    update public.service_delivery_milestones m
    set status = 'disputed',
        updated_at = clock_timestamp()
    from public.service_deliveries d
    where d.id = m.delivery_id
      and d.swap_id = new.id
      and m.status not in ('accepted', 'cancelled', 'resolved');
  end if;

  return new;
end;
$function$;

revoke all on function private.sync_service_deliveries_from_swap_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists sync_service_deliveries_from_swap_v1 on public.swaps;
create trigger sync_service_deliveries_from_swap_v1
after update of status on public.swaps
for each row
execute function private.sync_service_deliveries_from_swap_v1();

create or replace function private.resolve_service_deliveries_from_dispute_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  if old.status is distinct from new.status
    and new.status in ('resolved_requester', 'resolved_responder', 'resolved_split', 'rejected')
  then
    with changed as (
      update public.service_deliveries
      set status = 'resolved',
          revision = revision + 1,
          closed_at = clock_timestamp(),
          close_reason = 'dispute_' || new.status,
          updated_at = clock_timestamp()
      where swap_id = new.swap_id
        and status = 'disputed'
      returning id, revision
    )
    insert into public.service_delivery_events (
      delivery_id, swap_id, actor_id, event_type, delivery_revision, metadata
    )
    select
      changed.id,
      new.swap_id,
      auth.uid(),
      'resolved',
      changed.revision,
      jsonb_build_object('resolution', new.status)
    from changed;

    update public.service_delivery_milestones m
    set status = 'resolved',
        updated_at = clock_timestamp()
    from public.service_deliveries d
    where d.id = m.delivery_id
      and d.swap_id = new.swap_id
      and m.status = 'disputed';
  end if;

  return new;
end;
$function$;

revoke all on function private.resolve_service_deliveries_from_dispute_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists resolve_service_deliveries_from_dispute_v1 on public.disputes;
create trigger resolve_service_deliveries_from_dispute_v1
after update of status on public.disputes
for each row
execute function private.resolve_service_deliveries_from_dispute_v1();

create or replace function public.mutate_service_delivery_v1(
  p_delivery_id uuid,
  p_command text,
  p_expected_revision bigint,
  p_milestone_position integer,
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
  v_receipt public.service_delivery_mutation_receipts%rowtype;
  v_delivery public.service_deliveries%rowtype;
  v_swap public.swaps%rowtype;
  v_milestone public.service_delivery_milestones%rowtype;
  v_unknown_key text;
  v_note text;
  v_reason text;
  v_evidence jsonb;
  v_description text;
  v_response jsonb;
  v_next_position integer;
  v_all_accepted boolean;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if p_delivery_id is null
    or p_command not in (
      'start', 'submit_milestone', 'accept_milestone',
      'request_revision', 'report_missed_deadline'
    )
    or p_expected_revision is null
    or p_expected_revision < 0
    or p_idempotency_key is null
    or char_length(p_idempotency_key) not between 8 and 120
    or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$'
    or jsonb_typeof(v_payload) is distinct from 'object'
  then
    raise exception using errcode = '22023', message = 'Invalid Service delivery mutation request.';
  end if;

  v_request_hash := encode(
    extensions.digest(
      concat_ws(
        '|',
        p_delivery_id::text,
        p_command,
        p_expected_revision::text,
        coalesce(p_milestone_position::text, ''),
        v_payload::text
      ),
      'sha256'
    ),
    'hex'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'service-delivery-receipt:' || v_actor::text || ':' || p_delivery_id::text || ':' || p_idempotency_key,
      0
    )
  );

  select r.*
  into v_receipt
  from public.service_delivery_mutation_receipts r
  where r.actor_id = v_actor
    and r.delivery_id = p_delivery_id
    and r.idempotency_key = p_idempotency_key;

  if found then
    if v_receipt.command is distinct from p_command
      or v_receipt.request_hash is distinct from v_request_hash
    then
      raise exception using errcode = '23505', message = 'Idempotency key already used with another Service delivery request.';
    end if;

    return v_receipt.response || jsonb_build_object('replayed', true);
  end if;

  select d.swap_id
  into v_delivery.swap_id
  from public.service_deliveries d
  where d.id = p_delivery_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Service delivery not found.';
  end if;

  select s.*
  into v_swap
  from public.swaps s
  where s.id = v_delivery.swap_id
  for update;

  select d.*
  into v_delivery
  from public.service_deliveries d
  where d.id = p_delivery_id
  for update;

  if v_actor not in (v_delivery.provider_id, v_delivery.recipient_id)
    or v_actor not in (v_swap.requester_id, v_swap.responder_id)
  then
    raise exception using errcode = '42501', message = 'Service delivery mutation denied.';
  end if;

  if v_delivery.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = format(
      'Stale Service delivery revision: expected %s, current %s.',
      p_expected_revision,
      v_delivery.revision
    );
  end if;

  if p_command in ('start', 'report_missed_deadline')
    and p_milestone_position is not null
  then
    raise exception using errcode = '22023', message = 'This Service delivery command cannot target a milestone.';
  end if;

  if p_command in ('submit_milestone', 'accept_milestone', 'request_revision')
    and (p_milestone_position is null or p_milestone_position not between 1 and 50)
  then
    raise exception using errcode = '22023', message = 'A valid Service milestone position is required.';
  end if;

  if p_command <> 'report_missed_deadline'
    and v_swap.status not in ('accepted', 'in_progress')
  then
    raise exception using errcode = '23514', message = 'Service delivery cannot change in the current Exchange state.';
  end if;

  if p_command = 'start' then
    if v_actor <> v_delivery.provider_id then
      raise exception using errcode = '42501', message = 'Only the Service provider may start delivery.';
    end if;

    if v_delivery.status <> 'pending' then
      raise exception using errcode = '23514', message = 'Service delivery is not pending.';
    end if;

    if clock_timestamp() > v_delivery.deadline_at then
      raise exception using errcode = '23514', message = 'Service deadline has passed.';
    end if;

    if v_payload <> '{}'::jsonb then
      raise exception using errcode = '22023', message = 'Start Service delivery does not accept a payload.';
    end if;

    update public.service_deliveries
    set status = 'in_progress',
        revision = revision + 1,
        started_at = coalesce(started_at, clock_timestamp()),
        updated_at = clock_timestamp()
    where id = p_delivery_id
    returning * into v_delivery;

    select min(m.position)
    into v_next_position
    from public.service_delivery_milestones m
    where m.delivery_id = p_delivery_id
      and m.status = 'pending';

    update public.service_delivery_milestones
    set status = 'in_progress',
        updated_at = clock_timestamp()
    where delivery_id = p_delivery_id
      and position = v_next_position
      and status = 'pending';

    if v_swap.status = 'accepted' then
      perform public.apply_swap_transition_v1(
        v_swap.id,
        'accepted',
        'in_progress',
        v_actor,
        'service_delivery',
        p_idempotency_key || ':swap'
      );
    end if;

    insert into public.service_delivery_events (
      delivery_id, swap_id, actor_id, event_type, delivery_revision, metadata
    ) values (
      p_delivery_id,
      v_delivery.swap_id,
      v_actor,
      'started',
      v_delivery.revision,
      '{}'::jsonb
    );

  elsif p_command = 'submit_milestone' then
    if v_actor <> v_delivery.provider_id then
      raise exception using errcode = '42501', message = 'Only the Service provider may submit a milestone.';
    end if;

    if v_delivery.status not in ('in_progress', 'revision_requested') then
      raise exception using errcode = '23514', message = 'Service delivery is not ready for milestone submission.';
    end if;

    select m.*
    into v_milestone
    from public.service_delivery_milestones m
    where m.delivery_id = p_delivery_id
      and m.position = p_milestone_position
    for update;

    if not found or v_milestone.status not in ('pending', 'in_progress', 'revision_requested') then
      raise exception using errcode = '23514', message = 'Service milestone is not ready for submission.';
    end if;

    select min(m.position)
    into v_next_position
    from public.service_delivery_milestones m
    where m.delivery_id = p_delivery_id
      and m.status <> 'accepted';

    if p_milestone_position <> v_next_position then
      raise exception using errcode = '23514', message = 'Service milestones must be delivered in Agreement order.';
    end if;

    if clock_timestamp() > v_delivery.deadline_at
      and v_milestone.status <> 'revision_requested'
    then
      raise exception using errcode = '23514', message = 'Service deadline has passed.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_payload) keys(key)
    where key not in ('note', 'evidence')
    limit 1;

    if v_unknown_key is not null
      or jsonb_typeof(v_payload -> 'note') is distinct from 'string'
      or (
        v_payload ? 'evidence'
        and jsonb_typeof(v_payload -> 'evidence') is distinct from 'array'
      )
    then
      raise exception using errcode = '22023', message = 'Invalid Service milestone submission payload.';
    end if;

    v_note := btrim(v_payload ->> 'note');
    v_evidence := private.validate_service_submission_evidence_v1(v_payload -> 'evidence');

    if char_length(v_note) not between 1 and 2000 then
      raise exception using errcode = '22023', message = 'Service milestone submission note is required.';
    end if;

    update public.service_delivery_milestones
    set status = 'submitted',
        submission_revision = submission_revision + 1,
        submission_note = v_note,
        submission_evidence = v_evidence,
        revision_reason = null,
        submitted_at = clock_timestamp(),
        accepted_at = null,
        updated_at = clock_timestamp()
    where delivery_id = p_delivery_id
      and position = p_milestone_position;

    update public.service_deliveries
    set status = 'awaiting_acceptance',
        revision = revision + 1,
        updated_at = clock_timestamp()
    where id = p_delivery_id
    returning * into v_delivery;

    insert into public.service_delivery_events (
      delivery_id,
      swap_id,
      actor_id,
      event_type,
      milestone_position,
      delivery_revision,
      metadata
    ) values (
      p_delivery_id,
      v_delivery.swap_id,
      v_actor,
      'milestone_submitted',
      p_milestone_position,
      v_delivery.revision,
      jsonb_build_object(
        'submission_note', v_note,
        'evidence_count', jsonb_array_length(v_evidence)
      )
    );

  elsif p_command = 'accept_milestone' then
    if v_actor <> v_delivery.recipient_id then
      raise exception using errcode = '42501', message = 'Only the Service recipient may accept a milestone.';
    end if;

    select m.*
    into v_milestone
    from public.service_delivery_milestones m
    where m.delivery_id = p_delivery_id
      and m.position = p_milestone_position
    for update;

    if not found or v_milestone.status <> 'submitted' then
      raise exception using errcode = '23514', message = 'Only a submitted Service milestone may be accepted.';
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
      raise exception using errcode = '22023', message = 'Invalid Service milestone acceptance payload.';
    end if;

    v_note := nullif(btrim(v_payload ->> 'note'), '');

    update public.service_delivery_milestones
    set status = 'accepted',
        accepted_at = clock_timestamp(),
        revision_reason = null,
        updated_at = clock_timestamp()
    where delivery_id = p_delivery_id
      and position = p_milestone_position;

    select not exists (
      select 1
      from public.service_delivery_milestones m
      where m.delivery_id = p_delivery_id
        and m.status <> 'accepted'
    )
    into v_all_accepted;

    if v_all_accepted then
      update public.service_deliveries
      set status = 'completed',
          revision = revision + 1,
          completed_at = clock_timestamp(),
          updated_at = clock_timestamp()
      where id = p_delivery_id
      returning * into v_delivery;
    else
      update public.service_deliveries
      set status = 'in_progress',
          revision = revision + 1,
          updated_at = clock_timestamp()
      where id = p_delivery_id
      returning * into v_delivery;

      select min(m.position)
      into v_next_position
      from public.service_delivery_milestones m
      where m.delivery_id = p_delivery_id
        and m.status = 'pending';

      update public.service_delivery_milestones
      set status = 'in_progress',
          updated_at = clock_timestamp()
      where delivery_id = p_delivery_id
        and position = v_next_position
        and status = 'pending';
    end if;

    insert into public.service_delivery_events (
      delivery_id,
      swap_id,
      actor_id,
      event_type,
      milestone_position,
      delivery_revision,
      metadata
    ) values (
      p_delivery_id,
      v_delivery.swap_id,
      v_actor,
      'milestone_accepted',
      p_milestone_position,
      v_delivery.revision,
      jsonb_strip_nulls(jsonb_build_object('note', v_note))
    );

    if v_all_accepted then
      insert into public.service_delivery_events (
        delivery_id,
        swap_id,
        actor_id,
        event_type,
        delivery_revision,
        metadata
      ) values (
        p_delivery_id,
        v_delivery.swap_id,
        v_actor,
        'completed',
        v_delivery.revision,
        jsonb_build_object('accepted_milestones', p_milestone_position)
      );
    end if;

  elsif p_command = 'request_revision' then
    if v_actor <> v_delivery.recipient_id then
      raise exception using errcode = '42501', message = 'Only the Service recipient may request a revision.';
    end if;

    select m.*
    into v_milestone
    from public.service_delivery_milestones m
    where m.delivery_id = p_delivery_id
      and m.position = p_milestone_position
    for update;

    if not found or v_milestone.status <> 'submitted' then
      raise exception using errcode = '23514', message = 'Only a submitted Service milestone may receive a revision request.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_payload) keys(key)
    where key not in ('reason')
    limit 1;

    if v_unknown_key is not null
      or jsonb_typeof(v_payload -> 'reason') is distinct from 'string'
    then
      raise exception using errcode = '22023', message = 'Invalid Service revision request payload.';
    end if;

    v_reason := btrim(v_payload ->> 'reason');

    if char_length(v_reason) not between 3 and 2000 then
      raise exception using errcode = '22023', message = 'Service revision reason is required.';
    end if;

    update public.service_delivery_milestones
    set status = 'revision_requested',
        revision_reason = v_reason,
        accepted_at = null,
        updated_at = clock_timestamp()
    where delivery_id = p_delivery_id
      and position = p_milestone_position;

    update public.service_deliveries
    set status = 'revision_requested',
        revision = revision + 1,
        updated_at = clock_timestamp()
    where id = p_delivery_id
    returning * into v_delivery;

    insert into public.service_delivery_events (
      delivery_id,
      swap_id,
      actor_id,
      event_type,
      milestone_position,
      delivery_revision,
      metadata
    ) values (
      p_delivery_id,
      v_delivery.swap_id,
      v_actor,
      'revision_requested',
      p_milestone_position,
      v_delivery.revision,
      jsonb_build_object('reason', v_reason)
    );

  else
    if v_actor <> v_delivery.recipient_id then
      raise exception using errcode = '42501', message = 'Only the Service recipient may report a missed deadline.';
    end if;

    if v_delivery.status in ('completed', 'cancelled', 'resolved', 'disputed')
      or v_swap.status not in ('accepted', 'in_progress')
      or clock_timestamp() <= v_delivery.deadline_at
    then
      raise exception using errcode = '23514', message = 'Service missed deadline cannot be reported in the current state.';
    end if;

    select key
    into v_unknown_key
    from jsonb_object_keys(v_payload) keys(key)
    where key not in ('description', 'evidence')
    limit 1;

    if v_unknown_key is not null
      or jsonb_typeof(v_payload -> 'description') is distinct from 'string'
      or (
        v_payload ? 'evidence'
        and jsonb_typeof(v_payload -> 'evidence') is distinct from 'array'
      )
    then
      raise exception using errcode = '22023', message = 'Invalid Service missed deadline payload.';
    end if;

    v_description := btrim(v_payload ->> 'description');
    v_evidence := coalesce(v_payload -> 'evidence', '[]'::jsonb);

    if char_length(v_description) not between 10 and 2000 then
      raise exception using errcode = '22023', message = 'Service missed deadline description is required.';
    end if;

    insert into public.service_delivery_events (
      delivery_id,
      swap_id,
      actor_id,
      event_type,
      delivery_revision,
      metadata
    ) values (
      p_delivery_id,
      v_delivery.swap_id,
      v_actor,
      'missed_deadline',
      v_delivery.revision,
      jsonb_build_object('deadline_at', v_delivery.deadline_at)
    );

    perform public.open_swap_dispute_v1(
      v_delivery.swap_id,
      v_swap.status,
      'no_show',
      v_description,
      v_evidence,
      'service:' || p_idempotency_key
    );

    select d.*
    into v_delivery
    from public.service_deliveries d
    where d.id = p_delivery_id;
  end if;

  v_response := private.service_delivery_response_v1(p_delivery_id)
    || jsonb_build_object(
      'command', p_command,
      'replayed', false,
      'idempotency_key', p_idempotency_key
    );

  insert into public.service_delivery_mutation_receipts (
    actor_id,
    delivery_id,
    command,
    idempotency_key,
    request_hash,
    response
  ) values (
    v_actor,
    p_delivery_id,
    p_command,
    p_idempotency_key,
    v_request_hash,
    v_response
  );

  return v_response;
end;
$function$;

revoke all on function public.mutate_service_delivery_v1(uuid, text, bigint, integer, jsonb, text)
  from public, anon;
grant execute on function public.mutate_service_delivery_v1(uuid, text, bigint, integer, jsonb, text)
  to authenticated;

commit;
