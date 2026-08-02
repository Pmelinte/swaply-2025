begin;

create schema if not exists private;
create extension if not exists btree_gist with schema extensions;

create table if not exists public.property_reservations (
  id uuid primary key default extensions.gen_random_uuid(),
  property_item_id uuid not null references public.items(id) on delete restrict,
  swap_id uuid not null references public.swaps(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  agreement_revision integer not null check (agreement_revision >= 1),
  agreement_hash text not null check (agreement_hash ~ '^[a-f0-9]{64}$'),
  reserved_from date not null,
  reserved_until date not null,
  stay_range daterange generated always as (
    pg_catalog.daterange(reserved_from, reserved_until + 1, '[)')
  ) stored,
  status text not null default 'reserved'
    check (status in ('reserved', 'disputed', 'completed', 'released')),
  created_by uuid not null references auth.users(id) on delete restrict,
  released_at timestamptz,
  release_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (swap_id, property_item_id),
  check (reserved_until >= reserved_from),
  check (
    (status = 'released' and released_at is not null and release_reason is not null)
    or (status <> 'released' and released_at is null and release_reason is null)
  )
);

alter table public.property_reservations enable row level security;

revoke all on table public.property_reservations
  from public, anon, authenticated;
grant select on table public.property_reservations to authenticated;
grant all on table public.property_reservations to service_role;

create policy property_reservations_participant_select
on public.property_reservations
for select
to authenticated
using (
  exists (
    select 1
    from public.swaps s
    where s.id = property_reservations.swap_id
      and auth.uid() in (s.requester_id, s.responder_id)
  )
);

create index if not exists property_reservations_swap_idx
  on public.property_reservations (swap_id, status);
create index if not exists property_reservations_property_idx
  on public.property_reservations (property_item_id, reserved_from, reserved_until);

alter table public.property_reservations
  add constraint property_reservations_no_active_overlap
  exclude using gist (
    property_item_id with =,
    stay_range with &&
  )
  where (status in ('reserved', 'disputed', 'completed'));

comment on table public.property_reservations is
  'V1-05.4.3 server-authoritative Property booking locks. Active, disputed and completed reservations cannot overlap for the same canonical Property item.';

create or replace function private.property_blocked_dates_overlap_v1(
  p_blocked_dates jsonb,
  p_reserved_from date,
  p_reserved_until date
)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_entry jsonb;
  v_from date;
  v_until date;
  v_text text;
begin
  if p_blocked_dates is null
    or p_blocked_dates = 'null'::jsonb
    or p_blocked_dates = '[]'::jsonb
  then
    return false;
  end if;

  if jsonb_typeof(p_blocked_dates) <> 'array' then
    return true;
  end if;

  for v_entry in
    select value from jsonb_array_elements(p_blocked_dates)
  loop
    v_from := null;
    v_until := null;

    begin
      if jsonb_typeof(v_entry) = 'string' then
        v_text := trim(both '"' from v_entry::text);
        v_from := v_text::date;
        v_until := v_from;
      elsif jsonb_typeof(v_entry) = 'object' then
        if jsonb_typeof(v_entry -> 'date') = 'string' then
          v_from := (v_entry ->> 'date')::date;
          v_until := v_from;
        elsif jsonb_typeof(v_entry -> 'start') = 'string'
          and jsonb_typeof(v_entry -> 'end') = 'string'
        then
          v_from := (v_entry ->> 'start')::date;
          v_until := (v_entry ->> 'end')::date;
        elsif jsonb_typeof(v_entry -> 'from') = 'string'
          and jsonb_typeof(v_entry -> 'until') = 'string'
        then
          v_from := (v_entry ->> 'from')::date;
          v_until := (v_entry ->> 'until')::date;
        else
          return true;
        end if;
      else
        return true;
      end if;
    exception
      when others then
        return true;
    end;

    if v_from is null or v_until is null or v_until < v_from then
      return true;
    end if;

    if pg_catalog.daterange(v_from, v_until + 1, '[)')
      && pg_catalog.daterange(p_reserved_from, p_reserved_until + 1, '[)')
    then
      return true;
    end if;
  end loop;

  return false;
end;
$function$;

revoke all on function private.property_blocked_dates_overlap_v1(jsonb, date, date)
  from public, anon, authenticated, service_role;

create or replace function private.property_period_is_available_v1(
  p_property_item_id uuid,
  p_reserved_from date,
  p_reserved_until date,
  p_exclude_swap_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_property public.properties%rowtype;
  v_duration integer;
begin
  if p_property_item_id is null
    or p_reserved_from is null
    or p_reserved_until is null
    or p_reserved_until < p_reserved_from
  then
    return false;
  end if;

  select p.*
  into v_property
  from public.properties p
  join public.items i on i.id = p.item_id
  where p.item_id = p_property_item_id
    and p.status = 'active'
    and i.item_type = 'property'
    and i.status = 'active'
    and i.is_active = true;

  if not found then
    return false;
  end if;

  v_duration := p_reserved_until - p_reserved_from + 1;

  if p_reserved_from < current_date
    or (v_property.available_from is not null and p_reserved_from < v_property.available_from)
    or (v_property.available_until is not null and p_reserved_until > v_property.available_until)
    or (v_property.min_stay_days is not null and v_duration < v_property.min_stay_days)
    or (v_property.max_stay_days is not null and v_duration > v_property.max_stay_days)
    or (
      coalesce(v_property.advance_notice_days, 0) > 0
      and p_reserved_from < current_date + v_property.advance_notice_days
    )
  then
    return false;
  end if;

  if coalesce(cardinality(v_property.available_months), 0) > 0
    and exists (
      select 1
      from generate_series(
        p_reserved_from::timestamp,
        p_reserved_until::timestamp,
        interval '1 day'
      ) as day_value
      where extract(month from day_value)::integer
        <> all(v_property.available_months)
    )
  then
    return false;
  end if;

  if private.property_blocked_dates_overlap_v1(
    v_property.blocked_dates,
    p_reserved_from,
    p_reserved_until
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.property_reservations r
    where r.property_item_id = p_property_item_id
      and r.status in ('reserved', 'disputed', 'completed')
      and (p_exclude_swap_id is null or r.swap_id <> p_exclude_swap_id)
      and r.stay_range
        && pg_catalog.daterange(p_reserved_from, p_reserved_until + 1, '[)')
  ) then
    return false;
  end if;

  return true;
end;
$function$;

revoke all on function private.property_period_is_available_v1(uuid, date, date, uuid)
  from public, anon, authenticated, service_role;

create or replace function public.check_property_period_availability_v1(
  p_conversation_id uuid,
  p_property_item_id uuid,
  p_reserved_from date,
  p_reserved_until date
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_available boolean;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select c.*
  into v_conversation
  from public.conversations c
  where c.id = p_conversation_id;

  if not found
    or cardinality(v_conversation.participant_ids) <> 2
    or not (v_actor = any(v_conversation.participant_ids))
    or not (p_property_item_id = any(v_conversation.item_ids))
  then
    raise exception using errcode = '42501', message = 'Property availability access denied.';
  end if;

  v_available := private.property_period_is_available_v1(
    p_property_item_id,
    p_reserved_from,
    p_reserved_until,
    v_conversation.swap_id
  );

  return jsonb_build_object(
    'conversation_id', p_conversation_id,
    'property_item_id', p_property_item_id,
    'reserved_from', p_reserved_from,
    'reserved_until', p_reserved_until,
    'available', v_available
  );
end;
$function$;

revoke all on function public.check_property_period_availability_v1(uuid, uuid, date, date)
  from public, anon;
grant execute on function public.check_property_period_availability_v1(uuid, uuid, date, date)
  to authenticated;

create or replace function public.get_property_reservations_v1(
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
  v_reservations jsonb;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  select s.*
  into v_swap
  from public.swaps s
  where s.id = p_swap_id;

  if not found or v_actor not in (v_swap.requester_id, v_swap.responder_id) then
    raise exception using errcode = '42501', message = 'Property reservation access denied.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'reservation_id', r.id,
        'property_item_id', r.property_item_id,
        'reserved_from', r.reserved_from,
        'reserved_until', r.reserved_until,
        'status', r.status,
        'agreement_revision', r.agreement_revision,
        'agreement_hash', r.agreement_hash,
        'released_at', r.released_at,
        'release_reason', r.release_reason
      )
      order by r.property_item_id
    ),
    '[]'::jsonb
  )
  into v_reservations
  from public.property_reservations r
  where r.swap_id = p_swap_id;

  return jsonb_build_object(
    'swap_id', p_swap_id,
    'reservations', v_reservations
  );
end;
$function$;

revoke all on function public.get_property_reservations_v1(uuid)
  from public, anon;
grant execute on function public.get_property_reservations_v1(uuid)
  to authenticated;

create or replace function private.reserve_property_periods_on_exchange_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor uuid := auth.uid();
  v_property_count integer;
  v_terms jsonb;
  v_entry jsonb;
  v_property_item_id uuid;
  v_reserved_from date;
  v_reserved_until date;
  v_property_term_count integer;
  v_agreement_hash text;
begin
  if new.exchange_kind <> 'bilateral' then
    return new;
  end if;

  select count(*)
  into v_property_count
  from public.items i
  where i.id in (new.offered_item_id, new.requested_item_id)
    and i.item_type = 'property';

  if v_property_count = 0 then
    return new;
  end if;

  if v_actor is null
    or v_actor not in (new.requester_id, new.responder_id)
  then
    raise exception using errcode = '42501', message = 'Property reservation requires an Exchange participant.';
  end if;

  v_terms := new.exchange_data -> 'domain_terms';
  v_agreement_hash := new.swap_metadata ->> 'agreement_hash';

  if new.conversation_id is null
    or new.swap_metadata ->> 'source' is distinct from 'domain_aware_match_agreement'
    or jsonb_typeof(v_terms) is distinct from 'array'
    or new.agreement_revision < 1
    or coalesce(v_agreement_hash, '') !~ '^[a-f0-9]{64}$'
  then
    raise exception using errcode = '22023', message = 'Complete Property agreement terms are required before reservation.';
  end if;

  select count(*)
  into v_property_term_count
  from jsonb_array_elements(v_terms) term(value)
  where term.value ->> 'domain' = 'property';

  if v_property_term_count <> v_property_count then
    raise exception using errcode = '22023', message = 'Every Property in the Exchange requires one reservation period.';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_terms) term(value)
    where term.value ->> 'domain' = 'property'
    group by term.value ->> 'item_id'
    having count(*) <> 1
  ) then
    raise exception using errcode = '22023', message = 'Duplicate Property reservation terms are not allowed.';
  end if;

  for v_entry in
    select term.value
    from jsonb_array_elements(v_terms) term(value)
    where term.value ->> 'domain' = 'property'
    order by term.value ->> 'item_id'
  loop
    begin
      v_property_item_id := (v_entry ->> 'item_id')::uuid;
      v_reserved_from := (v_entry -> 'terms' ->> 'period_start')::date;
      v_reserved_until := (v_entry -> 'terms' ->> 'period_end')::date;
    exception
      when others then
        raise exception using errcode = '22023', message = 'Invalid Property reservation period.';
    end;

    if v_property_item_id not in (new.offered_item_id, new.requested_item_id) then
      raise exception using errcode = '42501', message = 'Property reservation item is outside this Exchange.';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('property-reservation:' || v_property_item_id::text, 0)
    );

    if not private.property_period_is_available_v1(
      v_property_item_id,
      v_reserved_from,
      v_reserved_until,
      new.id
    ) then
      raise exception using errcode = '23P01', message = 'Property period is unavailable or overlaps another reservation.';
    end if;

    begin
      insert into public.property_reservations (
        property_item_id,
        swap_id,
        conversation_id,
        agreement_revision,
        agreement_hash,
        reserved_from,
        reserved_until,
        status,
        created_by
      ) values (
        v_property_item_id,
        new.id,
        new.conversation_id,
        new.agreement_revision,
        v_agreement_hash,
        v_reserved_from,
        v_reserved_until,
        case when new.status = 'disputed' then 'disputed'
             when new.status = 'completed' then 'completed'
             else 'reserved' end,
        v_actor
      );
    exception
      when exclusion_violation then
        raise exception using errcode = '23P01', message = 'Property period is unavailable or overlaps another reservation.';
    end;
  end loop;

  return new;
end;
$function$;

revoke all on function private.reserve_property_periods_on_exchange_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists aaa_property_reservation_authority_v1 on public.swaps;
create trigger aaa_property_reservation_authority_v1
after insert on public.swaps
for each row
execute function private.reserve_property_periods_on_exchange_v1();

create or replace function private.sync_property_reservations_from_swap_v1()
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
    update public.property_reservations
    set status = 'released',
        released_at = clock_timestamp(),
        release_reason = 'swap_' || new.status,
        updated_at = clock_timestamp()
    where swap_id = new.id
      and status <> 'released';
  elsif new.status = 'disputed' then
    update public.property_reservations
    set status = 'disputed',
        released_at = null,
        release_reason = null,
        updated_at = clock_timestamp()
    where swap_id = new.id
      and status <> 'released';
  elsif new.status = 'completed' then
    update public.property_reservations
    set status = 'completed',
        released_at = null,
        release_reason = null,
        updated_at = clock_timestamp()
    where swap_id = new.id
      and status <> 'released';
  elsif new.status in ('accepted', 'in_progress') then
    update public.property_reservations
    set status = 'reserved',
        released_at = null,
        release_reason = null,
        updated_at = clock_timestamp()
    where swap_id = new.id
      and status = 'reserved';
  end if;

  return new;
end;
$function$;

revoke all on function private.sync_property_reservations_from_swap_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists sync_property_reservations_from_swap_v1 on public.swaps;
create trigger sync_property_reservations_from_swap_v1
after update of status on public.swaps
for each row
execute function private.sync_property_reservations_from_swap_v1();

create or replace function private.release_property_reservations_on_dispute_resolution_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  if old.status is distinct from new.status
    and new.status in ('resolved_requester', 'resolved_responder', 'resolved_split', 'rejected')
  then
    update public.property_reservations
    set status = 'released',
        released_at = clock_timestamp(),
        release_reason = 'dispute_' || new.status,
        updated_at = clock_timestamp()
    where swap_id = new.swap_id
      and status <> 'released';
  end if;

  return new;
end;
$function$;

revoke all on function private.release_property_reservations_on_dispute_resolution_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists release_property_reservations_on_dispute_resolution_v1 on public.disputes;
create trigger release_property_reservations_on_dispute_resolution_v1
after update of status on public.disputes
for each row
execute function private.release_property_reservations_on_dispute_resolution_v1();

commit;
