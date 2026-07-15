begin;

-- Batch 62.2: exactly-once post-completion effects.
-- Historical completed Swaps are intentionally not backfilled.

alter table public.notifications
  add column if not exists source_type text,
  add column if not exists source_id uuid,
  add column if not exists dedupe_key text,
  add column if not exists title_key text,
  add column if not exists body_key text;

create unique index if not exists notifications_dedupe_key_unique
  on public.notifications(dedupe_key)
  where dedupe_key is not null;

create index if not exists notifications_source_idx
  on public.notifications(source_type, source_id)
  where source_id is not null;

-- Normalize the two historical read flags before making is_read canonical.
update public.notifications
   set is_read = coalesce(is_read, false) or coalesce(read, false),
       read = coalesce(is_read, false) or coalesce(read, false),
       read_at = case
         when coalesce(is_read, false) or coalesce(read, false)
           then coalesce(read_at, created_at, pg_catalog.clock_timestamp())
         else null
       end
 where is_read is distinct from read
    or (coalesce(is_read, false) and read_at is null);

create or replace function public.sync_notification_read_state_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_read boolean;
begin
  if tg_op = 'INSERT' then
    v_read := coalesce(new.is_read, false) or coalesce(new.read, false);
  elsif new.is_read is distinct from old.is_read then
    v_read := coalesce(new.is_read, false);
  elsif new.read is distinct from old.read then
    v_read := coalesce(new.read, false);
  else
    v_read := coalesce(old.is_read, false) or coalesce(old.read, false);
  end if;

  new.is_read := v_read;
  new.read := v_read;
  new.read_at := case
    when v_read then coalesce(new.read_at, pg_catalog.clock_timestamp())
    else null
  end;

  return new;
end;
$function$;

revoke execute on function public.sync_notification_read_state_v1()
  from public, anon, authenticated;

drop trigger if exists sync_notification_read_state_trigger
  on public.notifications;
create trigger sync_notification_read_state_trigger
  before insert or update of read, is_read, read_at
  on public.notifications
  for each row
  execute function public.sync_notification_read_state_v1();

-- Harden the existing ledger writer so a missing Profile can never create
-- another orphan token row. user_tokens remains the source of truth and
-- profiles.stats.tokens remains the active cache.
create or replace function public.award_tokens(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_user_id is null then
    raise exception 'user_id is required' using errcode = '22023';
  end if;

  if p_amount is null or p_amount = 0 or pg_catalog.abs(p_amount) > 1000 then
    raise exception 'invalid token amount' using errcode = '22023';
  end if;

  if p_reason is null
     or pg_catalog.btrim(p_reason) = ''
     or pg_catalog.length(p_reason) > 80 then
    raise exception 'invalid token reason' using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.profiles
     where user_id = p_user_id
  ) then
    raise exception 'Profile is required for token award' using errcode = 'P0002';
  end if;

  insert into public.user_tokens (user_id, amount, reason, reference_id)
  values (p_user_id, p_amount, pg_catalog.btrim(p_reason), p_reference_id)
  on conflict do nothing;

  if found then
    update public.profiles
       set stats = pg_catalog.jsonb_set(
         coalesce(stats, '{}'::jsonb),
         '{tokens}',
         pg_catalog.to_jsonb(
           coalesce((stats ->> 'tokens')::integer, 0) + p_amount
         ),
         true
       ),
       updated_at = pg_catalog.clock_timestamp()
     where user_id = p_user_id;
  end if;
end;
$function$;

revoke execute on function public.award_tokens(uuid, integer, text, uuid)
  from public, anon, authenticated;

-- Recalculate trust only for users touched by new canonical events.
create or replace function public.calculate_trust_score(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_score integer := 0;
  v_level text;
  v_completed integer := 0;
  v_cancelled integer := 0;
  v_disputed integer := 0;
  v_id_verified boolean := false;
  v_phone_verified boolean := false;
  v_rating numeric := 0;
  v_response_rate integer := 0;
begin
  select
    coalesce(swaps_completed, 0),
    coalesce(swaps_cancelled, 0),
    coalesce(swaps_disputed, 0),
    coalesce(id_verified, false),
    coalesce(phone_verified, false),
    coalesce(rating, 0),
    coalesce(response_rate_pct, 0)
  into
    v_completed,
    v_cancelled,
    v_disputed,
    v_id_verified,
    v_phone_verified,
    v_rating,
    v_response_rate
  from public.profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  v_score := v_score + pg_catalog.least(v_completed * 20, 400);
  v_score := v_score - (v_cancelled * 10);
  v_score := v_score - (v_disputed * 25);

  if v_id_verified then
    v_score := v_score + 150;
  end if;
  if v_phone_verified then
    v_score := v_score + 50;
  end if;
  if v_rating > 0 then
    v_score := v_score + (v_rating * 40)::integer;
  end if;
  v_score := v_score + v_response_rate;

  v_score := pg_catalog.greatest(0, pg_catalog.least(1000, v_score));
  v_level := case
    when v_score >= 800 then 'ambassador'
    when v_score >= 500 then 'trusted'
    when v_score >= 200 then 'verified'
    else 'starter'
  end;

  update public.profiles
     set trust_score = v_score,
         trust_level = v_level,
         stats = pg_catalog.jsonb_set(
           coalesce(stats, '{}'::jsonb),
           '{reputation}',
           pg_catalog.to_jsonb(v_level),
           true
         ),
         updated_at = pg_catalog.clock_timestamp()
   where user_id = p_user_id;
end;
$function$;

revoke execute on function public.calculate_trust_score(uuid)
  from public, anon, authenticated;

create or replace function public.refresh_review_reputation_v1(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_rating numeric := 0;
  v_rating_count integer := 0;
begin
  if p_user_id is null then
    raise exception 'reviewed user is required' using errcode = '22023';
  end if;

  select
    coalesce(pg_catalog.round(pg_catalog.avg(rating)::numeric, 2), 0),
    pg_catalog.count(*)::integer
  into v_rating, v_rating_count
  from public.reviews
  where reviewed_id = p_user_id;

  update public.profiles
     set rating = v_rating,
         rating_count = v_rating_count,
         updated_at = pg_catalog.clock_timestamp()
   where user_id = p_user_id;

  if not found then
    raise exception 'Reviewed Profile not found' using errcode = 'P0002';
  end if;

  perform public.calculate_trust_score(p_user_id);
end;
$function$;

revoke execute on function public.refresh_review_reputation_v1(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.refresh_review_reputation_trigger_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform public.refresh_review_reputation_v1(new.reviewed_id);
  return new;
end;
$function$;

revoke execute on function public.refresh_review_reputation_trigger_v1()
  from public, anon, authenticated, service_role;

drop trigger if exists refresh_review_reputation_trigger
  on public.reviews;
create trigger refresh_review_reputation_trigger
  after insert on public.reviews
  for each row
  execute function public.refresh_review_reputation_trigger_v1();

create table if not exists public.swap_post_completion_effects (
  swap_id uuid primary key references public.swaps(id) on delete cascade,
  applied_by uuid not null references auth.users(id) on delete restrict,
  transition_idempotency_key text not null,
  reward_per_participant integer not null default 30
    check (reward_per_participant = 30),
  applied_at timestamptz not null default now()
);

alter table public.swap_post_completion_effects enable row level security;
revoke all on table public.swap_post_completion_effects
  from public, anon, authenticated;

create or replace function public.apply_swap_post_completion_effects_v1(
  p_swap_id uuid,
  p_actor_id uuid,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_swap public.swaps%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_applied boolean := false;
  v_profile_count integer := 0;
begin
  select *
    into v_swap
    from public.swaps
   where id = p_swap_id
   for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if v_swap.status <> 'completed'
     or not coalesce(v_swap.requester_confirmed, false)
     or not coalesce(v_swap.responder_confirmed, false) then
    raise exception 'Post-completion effects require bilateral completion'
      using errcode = '23514';
  end if;

  if p_actor_id <> v_swap.requester_id
     and p_actor_id <> v_swap.responder_id then
    raise exception 'Actor is not a swap participant' using errcode = '42501';
  end if;

  insert into public.swap_post_completion_effects (
    swap_id,
    applied_by,
    transition_idempotency_key,
    reward_per_participant,
    applied_at
  ) values (
    p_swap_id,
    p_actor_id,
    p_idempotency_key,
    30,
    v_now
  )
  on conflict (swap_id) do nothing
  returning true into v_applied;

  if not found then
    return false;
  end if;

  -- The unique user_tokens reference index makes each participant reward
  -- independently replay-safe even if legacy data already contains one side.
  perform public.award_tokens(
    v_swap.requester_id,
    30,
    'swap_completed',
    p_swap_id
  );
  perform public.award_tokens(
    v_swap.responder_id,
    30,
    'swap_completed',
    p_swap_id
  );

  update public.profiles
     set swaps_completed = coalesce(swaps_completed, 0) + 1,
         stats = pg_catalog.jsonb_set(
           coalesce(stats, '{}'::jsonb),
           '{completedSwaps}',
           pg_catalog.to_jsonb(
             coalesce((stats ->> 'completedSwaps')::integer, 0) + 1
           ),
           true
         ),
         updated_at = v_now
   where user_id in (v_swap.requester_id, v_swap.responder_id);

  get diagnostics v_profile_count = row_count;
  if v_profile_count <> 2 then
    raise exception 'Both participant Profiles are required for completion effects'
      using errcode = 'P0002';
  end if;

  perform public.calculate_trust_score(v_swap.requester_id);
  perform public.calculate_trust_score(v_swap.responder_id);

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    title_key,
    body_key,
    data,
    priority,
    source_type,
    source_id,
    dedupe_key,
    is_read,
    read
  ) values
    (
      v_swap.requester_id,
      'swap_completed',
      'Swap completed',
      'Both participants confirmed the exchange.',
      'tokenReasons.swap_completed',
      'change.bothConfirmed',
      pg_catalog.jsonb_build_object(
        'swap_id', p_swap_id,
        'event', 'swap_completed',
        'reward', 30
      ),
      'success',
      'swap',
      p_swap_id,
      'swap:' || p_swap_id::text || ':completed:' || v_swap.requester_id::text,
      false,
      false
    ),
    (
      v_swap.responder_id,
      'swap_completed',
      'Swap completed',
      'Both participants confirmed the exchange.',
      'tokenReasons.swap_completed',
      'change.bothConfirmed',
      pg_catalog.jsonb_build_object(
        'swap_id', p_swap_id,
        'event', 'swap_completed',
        'reward', 30
      ),
      'success',
      'swap',
      p_swap_id,
      'swap:' || p_swap_id::text || ':completed:' || v_swap.responder_id::text,
      false,
      false
    ),
    (
      v_swap.requester_id,
      'feedback_requested',
      'Feedback requested',
      'Leave a review after your completed exchange.',
      'notificationSettings.type_feedback_requested',
      'notificationSettings.type_feedback_requested_desc',
      pg_catalog.jsonb_build_object(
        'swap_id', p_swap_id,
        'event', 'feedback_requested'
      ),
      'normal',
      'swap',
      p_swap_id,
      'swap:' || p_swap_id::text || ':feedback_requested:' || v_swap.requester_id::text,
      false,
      false
    ),
    (
      v_swap.responder_id,
      'feedback_requested',
      'Feedback requested',
      'Leave a review after your completed exchange.',
      'notificationSettings.type_feedback_requested',
      'notificationSettings.type_feedback_requested_desc',
      pg_catalog.jsonb_build_object(
        'swap_id', p_swap_id,
        'event', 'feedback_requested'
      ),
      'normal',
      'swap',
      p_swap_id,
      'swap:' || p_swap_id::text || ':feedback_requested:' || v_swap.responder_id::text,
      false,
      false
    )
  on conflict (dedupe_key) where dedupe_key is not null do nothing;

  insert into public.swap_events (
    swap_id,
    actor_id,
    action,
    from_status,
    to_status,
    metadata
  ) values (
    p_swap_id,
    p_actor_id,
    'post_completion_effects_applied',
    'completed',
    'completed',
    pg_catalog.jsonb_build_object(
      'authority', 'apply_swap_post_completion_effects_v1',
      'idempotency_key', p_idempotency_key,
      'reward_per_participant', 30,
      'notification_count', 4,
      'scope', 'reward_notification_reputation'
    )
  );

  return true;
end;
$function$;

revoke execute on function public.apply_swap_post_completion_effects_v1(
  uuid,
  uuid,
  text
) from public, anon, authenticated, service_role;

-- Replace the C2 structural effect function so C2 structural work and C3
-- post-completion effects commit or roll back in one transaction.
create or replace function public.apply_swap_completion_effects_v1(
  p_swap_id uuid,
  p_actor_id uuid,
  p_idempotency_key text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_swap public.swaps%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_item_count integer := 0;
  v_conversation_count integer := 0;
  v_applied boolean := false;
  v_post_applied boolean := false;
begin
  select *
    into v_swap
    from public.swaps
   where id = p_swap_id
   for update;

  if not found then
    raise exception 'Swap not found' using errcode = 'P0002';
  end if;

  if v_swap.status <> 'completed' then
    raise exception 'Completion effects require completed status'
      using errcode = '23514';
  end if;

  insert into public.swap_completion_effects (
    swap_id,
    completed_by,
    transition_idempotency_key,
    applied_at
  ) values (
    p_swap_id,
    p_actor_id,
    p_idempotency_key,
    v_now
  )
  on conflict (swap_id) do nothing
  returning true into v_applied;

  if not found then
    return false;
  end if;

  update public.items
     set status = 'traded',
         is_active = false,
         locked_by = null,
         locked_until = null,
         lock_reason = null,
         updated_at = v_now
   where id in (v_swap.offered_item_id, v_swap.requested_item_id);

  get diagnostics v_item_count = row_count;
  if v_item_count <> 2 then
    raise exception 'Both swap items are required for completion'
      using errcode = 'P0002';
  end if;

  if v_swap.conversation_id is not null then
    update public.conversations
       set status = 'completed',
           updated_at = v_now
     where id = v_swap.conversation_id;

    get diagnostics v_conversation_count = row_count;
    if v_conversation_count <> 1 then
      raise exception 'Linked conversation is required for completion'
        using errcode = 'P0002';
    end if;
  end if;

  v_post_applied := public.apply_swap_post_completion_effects_v1(
    p_swap_id,
    p_actor_id,
    p_idempotency_key
  );

  if not v_post_applied then
    raise exception 'Post-completion effects were not applied'
      using errcode = '23505';
  end if;

  insert into public.swap_events (
    swap_id,
    actor_id,
    action,
    from_status,
    to_status,
    metadata
  ) values (
    v_swap.id,
    p_actor_id,
    'completion_effects_applied',
    'completed',
    'completed',
    pg_catalog.jsonb_build_object(
      'authority', 'apply_swap_completion_effects_v1',
      'idempotency_key', p_idempotency_key,
      'scope', 'structural_only',
      'post_completion_effects_applied', v_post_applied
    )
  );

  return true;
end;
$function$;

revoke execute on function public.apply_swap_completion_effects_v1(
  uuid,
  uuid,
  text
) from public, anon, authenticated, service_role;

comment on table public.swap_post_completion_effects is
  'Batch 62.2 private exactly-once reward, notification and reputation registry. Historical completed Swaps are not backfilled.';
comment on function public.apply_swap_post_completion_effects_v1(uuid, uuid, text) is
  'Batch 62.2 exactly-once +30 Swapleni, deduplicated notifications and touched-user trust refresh.';
comment on function public.refresh_review_reputation_v1(uuid) is
  'Batch 62.2 canonical Review aggregate and trust refresh for the reviewed user.';

commit;
