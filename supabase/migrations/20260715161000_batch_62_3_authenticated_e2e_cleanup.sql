begin;

-- Batch 62.3: repeatable authenticated C3 closure tests need immutable-ID
-- cleanup without granting browser roles access to private ledgers or effect tables.
-- The registry is intentionally empty on fresh environments. Only an operator or
-- service role may register dedicated test accounts.

create table if not exists public.c3_e2e_test_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  label text not null check (pg_catalog.length(pg_catalog.btrim(label)) between 1 and 80),
  registered_at timestamptz not null default pg_catalog.clock_timestamp()
);

alter table public.c3_e2e_test_accounts enable row level security;
revoke all on table public.c3_e2e_test_accounts
  from public, anon, authenticated;

create or replace function public.cleanup_c3_e2e_fixture_v1(
  p_swap_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor_id uuid := auth.uid();
  v_swap public.swaps%rowtype;
  v_registered_participants integer := 0;
  v_post_effect_rows integer := 0;
  v_completion_effect_rows integer := 0;
  v_reward_rows integer := 0;
  v_reward_amount integer := 0;
  v_requester_reward integer := 0;
  v_responder_reward integer := 0;
  v_notification_rows integer := 0;
  v_review_rows integer := 0;
  v_deleted_swap_rows integer := 0;
  v_counter_delta integer := 0;
begin
  if v_actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_swap_id is null then
    raise exception 'swap_id is required' using errcode = '22023';
  end if;

  select *
    into v_swap
    from public.swaps
   where id = p_swap_id
   for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'swap_id', p_swap_id,
      'replayed', true,
      'deleted', false
    );
  end if;

  if v_actor_id <> v_swap.requester_id
     and v_actor_id <> v_swap.responder_id then
    raise exception 'Actor is not a swap participant' using errcode = '42501';
  end if;

  select pg_catalog.count(*)::integer
    into v_registered_participants
    from public.c3_e2e_test_accounts
   where user_id in (v_swap.requester_id, v_swap.responder_id);

  if v_registered_participants <> 2 then
    raise exception 'Cleanup is restricted to registered C3 E2E participants'
      using errcode = '42501';
  end if;

  select pg_catalog.count(*)::integer
    into v_post_effect_rows
    from public.swap_post_completion_effects
   where swap_id = p_swap_id;

  select pg_catalog.count(*)::integer
    into v_completion_effect_rows
    from public.swap_completion_effects
   where swap_id = p_swap_id;

  select
    pg_catalog.count(*)::integer,
    coalesce(pg_catalog.sum(amount), 0)::integer,
    coalesce(pg_catalog.sum(amount) filter (where user_id = v_swap.requester_id), 0)::integer,
    coalesce(pg_catalog.sum(amount) filter (where user_id = v_swap.responder_id), 0)::integer
  into
    v_reward_rows,
    v_reward_amount,
    v_requester_reward,
    v_responder_reward
  from public.user_tokens
  where reference_id = p_swap_id
    and reason = 'swap_completed'
    and user_id in (v_swap.requester_id, v_swap.responder_id);

  select pg_catalog.count(*)::integer
    into v_notification_rows
    from public.notifications
   where source_type = 'swap'
     and source_id = p_swap_id
     and user_id in (v_swap.requester_id, v_swap.responder_id);

  select pg_catalog.count(*)::integer
    into v_review_rows
    from public.reviews
   where swap_id = p_swap_id;

  if v_post_effect_rows > 1
     or v_completion_effect_rows > 1
     or v_reward_rows > 2
     or v_notification_rows > 4
     or v_review_rows > 2 then
    raise exception 'C3 E2E fixture cardinality is invalid' using errcode = '23514';
  end if;

  if v_post_effect_rows = 1
     and (
       v_completion_effect_rows <> 1
       or v_reward_rows <> 2
       or v_reward_amount <> 60
       or v_requester_reward <> 30
       or v_responder_reward <> 30
       or v_notification_rows <> 4
     ) then
    raise exception 'Completed C3 E2E fixture effects are incomplete'
      using errcode = '23514';
  end if;

  delete from public.notifications
   where source_type = 'swap'
     and source_id = p_swap_id
     and user_id in (v_swap.requester_id, v_swap.responder_id);

  delete from public.user_tokens
   where reference_id = p_swap_id
     and reason = 'swap_completed'
     and user_id in (v_swap.requester_id, v_swap.responder_id);

  v_counter_delta := case when v_post_effect_rows = 1 then 1 else 0 end;

  update public.profiles
     set swaps_completed = greatest(
           coalesce(swaps_completed, 0) - v_counter_delta,
           0
         ),
         stats = pg_catalog.jsonb_set(
           pg_catalog.jsonb_set(
             coalesce(stats, '{}'::jsonb),
             '{tokens}',
             pg_catalog.to_jsonb(
               greatest(
                 coalesce((stats ->> 'tokens')::integer, 0)
                   - case
                       when user_id = v_swap.requester_id then v_requester_reward
                       when user_id = v_swap.responder_id then v_responder_reward
                       else 0
                     end,
                 0
               )
             ),
             true
           ),
           '{completedSwaps}',
           pg_catalog.to_jsonb(
             greatest(
               coalesce((stats ->> 'completedSwaps')::integer, 0) - v_counter_delta,
               0
             )
           ),
           true
         ),
         updated_at = pg_catalog.clock_timestamp()
   where user_id in (v_swap.requester_id, v_swap.responder_id);

  delete from public.swaps where id = p_swap_id;
  get diagnostics v_deleted_swap_rows = row_count;

  if v_deleted_swap_rows <> 1 then
    raise exception 'C3 E2E Swap cleanup failed' using errcode = 'P0002';
  end if;

  -- Reviews cascade with the Swap. Rebuild the two cached aggregates and trust
  -- from any Reviews that remain outside this immutable test fixture.
  perform public.refresh_review_reputation_v1(v_swap.requester_id);
  perform public.refresh_review_reputation_v1(v_swap.responder_id);

  return pg_catalog.jsonb_build_object(
    'swap_id', p_swap_id,
    'replayed', false,
    'deleted', true,
    'completion_effect_rows', v_completion_effect_rows,
    'post_effect_rows', v_post_effect_rows,
    'reward_rows', v_reward_rows,
    'reward_amount', v_reward_amount,
    'notification_rows', v_notification_rows,
    'review_rows', v_review_rows
  );
end;
$function$;

revoke execute on function public.cleanup_c3_e2e_fixture_v1(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.cleanup_c3_e2e_fixture_v1(uuid)
  to authenticated;

comment on table public.c3_e2e_test_accounts is
  'Private allowlist for dedicated authenticated E2E accounts. Empty by default and not browser writable.';
comment on function public.cleanup_c3_e2e_fixture_v1(uuid) is
  'Batch 62.3 immutable-ID cleanup for a Swap whose two participants are privately registered E2E accounts.';

commit;
