-- V1-07.9 — Policy-driven Swapleni reward authority
-- Forward-only migration. Reward values remain inactive until explicitly configured.

create table if not exists public.swapleni_reward_policies (
  source_type text primary key
    check (source_type in ('story_publication', 'blog_contribution')),
  reward_amount bigint not null check (reward_amount > 0 and reward_amount <= 1000000),
  per_user_window_cap bigint not null
    check (per_user_window_cap > 0 and per_user_window_cap <= 1000000),
  window_days integer not null check (window_days between 1 and 3650),
  active boolean not null default false,
  revision integer not null default 1 check (revision > 0),
  configured_at timestamptz not null default clock_timestamp(),
  configured_by uuid references auth.users(id) on delete set null,
  check (per_user_window_cap >= reward_amount)
);

alter table public.swapleni_reward_policies enable row level security;

create or replace function public.configure_swapleni_reward_policy_v1(
  p_source_type text,
  p_reward_amount bigint,
  p_per_user_window_cap bigint,
  p_window_days integer,
  p_active boolean,
  p_expected_revision integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_source_type text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_source_type, '')));
  v_policy public.swapleni_reward_policies%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Swapleni policy authority required' using errcode = '42501';
  end if;

  if v_source_type not in ('story_publication', 'blog_contribution')
     or p_reward_amount is null
     or p_reward_amount <= 0
     or p_reward_amount > 1000000
     or p_per_user_window_cap is null
     or p_per_user_window_cap < p_reward_amount
     or p_per_user_window_cap > 1000000
     or p_window_days is null
     or p_window_days not between 1 and 3650
     or p_active is null then
    raise exception 'Invalid Swapleni reward policy' using errcode = '22023';
  end if;

  select * into v_policy
  from public.swapleni_reward_policies
  where source_type = v_source_type
  for update;

  if found then
    if p_expected_revision is null
       or v_policy.revision is distinct from p_expected_revision then
      raise exception 'Swapleni policy stale revision' using errcode = '40001';
    end if;

    update public.swapleni_reward_policies
       set reward_amount = p_reward_amount,
           per_user_window_cap = p_per_user_window_cap,
           window_days = p_window_days,
           active = p_active,
           revision = revision + 1,
           configured_at = clock_timestamp(),
           configured_by = auth.uid()
     where source_type = v_source_type
     returning * into v_policy;
  else
    if p_expected_revision is not null then
      raise exception 'Swapleni policy stale revision' using errcode = '40001';
    end if;

    insert into public.swapleni_reward_policies (
      source_type,
      reward_amount,
      per_user_window_cap,
      window_days,
      active,
      configured_by
    ) values (
      v_source_type,
      p_reward_amount,
      p_per_user_window_cap,
      p_window_days,
      p_active,
      auth.uid()
    )
    returning * into v_policy;
  end if;

  return pg_catalog.to_jsonb(v_policy);
end;
$$;

create or replace function public.award_v1_07_swapleni_reward_v1(
  p_source_type text,
  p_source_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_source_type text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_source_type, '')));
  v_policy public.swapleni_reward_policies%rowtype;
  v_recipient uuid;
  v_key text;
  v_event_id uuid;
  v_existing public.swapleni_ledger%rowtype;
  v_window_total bigint;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Swapleni reward authority required' using errcode = '42501';
  end if;

  if p_source_id is null
     or v_source_type not in ('story_publication', 'blog_contribution') then
    raise exception 'Invalid Swapleni reward source' using errcode = '22023';
  end if;

  select * into v_policy
  from public.swapleni_reward_policies
  where source_type = v_source_type
    and active is true;

  if not found then
    raise exception 'Swapleni reward policy is not active' using errcode = '55000';
  end if;

  if v_source_type = 'story_publication' then
    select story_row.created_by into v_recipient
    from public.stories story_row
    where story_row.id = p_source_id
      and story_row.status = 'published'
      and story_row.visibility = 'public'
      and story_row.dispute_suppressed is false
      and story_row.withdrawn_at is null
      and exists (
        select 1
        from public.story_publications publication_row
        where publication_row.story_id = story_row.id
          and publication_row.revision = story_row.published_revision
          and publication_row.is_visible is true
      );
  else
    select contribution_row.contributor_id into v_recipient
    from public.blog_contributions contribution_row
    where contribution_row.id = p_source_id
      and contribution_row.status = 'approved';
  end if;

  if v_recipient is null then
    raise exception 'Swapleni reward source is not eligible' using errcode = '42501';
  end if;

  v_key := pg_catalog.format(
    'v1-07-reward:%s:%s:%s',
    v_source_type,
    p_source_id,
    v_recipient
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_key, 0)
  );

  select * into v_existing
  from public.swapleni_ledger ledger_row
  where ledger_row.idempotency_key = v_key;

  if found then
    return pg_catalog.jsonb_build_object(
      'event_id', v_existing.id,
      'recipient_id', v_recipient,
      'replayed', true
    );
  end if;

  select coalesce(sum(ledger_row.amount), 0) into v_window_total
  from public.swapleni_ledger ledger_row
  where ledger_row.user_id = v_recipient
    and ledger_row.event_type = 'v1_07_reward'
    and ledger_row.source_type = v_source_type
    and ledger_row.amount > 0
    and ledger_row.occurred_at >= clock_timestamp() - pg_catalog.make_interval(days => v_policy.window_days)
    and not exists (
      select 1
      from public.swapleni_ledger reversal_row
      where reversal_row.reversal_of = ledger_row.id
    );

  if v_window_total + v_policy.reward_amount > v_policy.per_user_window_cap then
    raise exception 'Swapleni reward cap exceeded' using errcode = '22023';
  end if;

  v_event_id := public.post_swapleni_event_v1(
    v_recipient,
    v_policy.reward_amount,
    'v1_07_reward',
    v_source_type,
    p_source_id,
    v_key,
    pg_catalog.jsonb_build_object(
      'policy_revision', v_policy.revision,
      'window_days', v_policy.window_days,
      'window_cap', v_policy.per_user_window_cap
    ),
    clock_timestamp()
  );

  return pg_catalog.jsonb_build_object(
    'event_id', v_event_id,
    'recipient_id', v_recipient,
    'replayed', false
  );
end;
$$;

create or replace function public.reverse_v1_07_swapleni_reward_v1(
  p_source_type text,
  p_source_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_source_type text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_source_type, '')));
  v_original public.swapleni_ledger%rowtype;
  v_reversal_id uuid;
  v_still_eligible boolean := false;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Swapleni reversal authority required' using errcode = '42501';
  end if;

  if p_source_id is null
     or nullif(pg_catalog.btrim(coalesce(p_reason, '')), '') is null
     or v_source_type not in ('story_publication', 'blog_contribution') then
    raise exception 'Invalid Swapleni reversal request' using errcode = '22023';
  end if;

  select * into v_original
  from public.swapleni_ledger ledger_row
  where ledger_row.event_type = 'v1_07_reward'
    and ledger_row.source_type = v_source_type
    and ledger_row.source_id = p_source_id
    and ledger_row.amount > 0
  order by ledger_row.created_at asc
  limit 1
  for share;

  if not found then
    raise exception 'Original V1-07 Swapleni reward not found' using errcode = 'P0002';
  end if;

  if v_source_type = 'story_publication' then
    select exists (
      select 1
      from public.stories story_row
      where story_row.id = p_source_id
        and story_row.status = 'published'
        and story_row.visibility = 'public'
        and story_row.dispute_suppressed is false
        and story_row.withdrawn_at is null
        and exists (
          select 1
          from public.story_publications publication_row
          where publication_row.story_id = story_row.id
            and publication_row.revision = story_row.published_revision
            and publication_row.is_visible is true
        )
    ) into v_still_eligible;
  else
    select exists (
      select 1
      from public.blog_contributions contribution_row
      where contribution_row.id = p_source_id
        and contribution_row.status = 'approved'
    ) into v_still_eligible;
  end if;

  if v_still_eligible then
    raise exception 'Eligible source cannot be reversed' using errcode = '22023';
  end if;

  v_reversal_id := public.reverse_swapleni_event_v1(
    v_original.id,
    pg_catalog.btrim(p_reason),
    pg_catalog.format('v1-07-reversal:%s', v_original.id),
    pg_catalog.jsonb_build_object(
      'source_type', v_source_type,
      'source_id', p_source_id
    )
  );

  return pg_catalog.jsonb_build_object(
    'original_event_id', v_original.id,
    'reversal_event_id', v_reversal_id
  );
end;
$$;

revoke all on table public.swapleni_reward_policies from public, anon, authenticated;

revoke all on function public.configure_swapleni_reward_policy_v1(text, bigint, bigint, integer, boolean, integer)
  from public, anon, authenticated;
grant execute on function public.configure_swapleni_reward_policy_v1(text, bigint, bigint, integer, boolean, integer)
  to service_role;

revoke all on function public.award_v1_07_swapleni_reward_v1(text, uuid)
  from public, anon, authenticated;
grant execute on function public.award_v1_07_swapleni_reward_v1(text, uuid)
  to service_role;

revoke all on function public.reverse_v1_07_swapleni_reward_v1(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.reverse_v1_07_swapleni_reward_v1(text, uuid, text)
  to service_role;

comment on table public.swapleni_reward_policies is
  'Inactive-by-default V1-07 reward policies. Numeric values require explicit product configuration.';
comment on function public.award_v1_07_swapleni_reward_v1(text, uuid) is
  'Service-only V1-07 reward authority with source eligibility, one reward per source and per-user window caps.';
comment on function public.reverse_v1_07_swapleni_reward_v1(text, uuid, text) is
  'Service-only compensating reversal for withdrawn, rejected, hidden or disputed V1-07 sources.';
