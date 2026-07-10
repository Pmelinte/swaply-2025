-- Follow-up for remaining actionable Supabase security advisor findings.

begin;

-- These read/write paths already have ownership RLS, so they do not need to
-- bypass RLS. Keep the RPC signature while running with caller privileges.
alter function public.complete_onboarding_step(uuid, text) security invoker;

-- Ratings are served by the authenticated application route; do not expose a
-- privileged database RPC directly to client roles.
revoke execute on function public.get_user_rating(uuid)
  from public, anon, authenticated;

-- Set explicit search paths on the remaining application-owned functions.
do $search_path$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'set_updated_at',
        'get_current_event',
        'update_blog_posts_updated_at',
        'check_active_matches_limit',
        'calculate_trust_score',
        'update_profile_completeness',
        'trigger_profile_completeness',
        'expire_old_events',
        'trigger_trust_score_on_swap'
      )
  loop
    execute format(
      'alter function %s set search_path = pg_catalog, public',
      fn.signature
    );
  end loop;
end
$search_path$;

-- Analytics writes are constrained by identity, event type and active item.
drop policy if exists "Anyone can insert item analytics" on public.item_analytics;

create policy item_analytics_insert_guest_view
  on public.item_analytics for insert to anon
  with check (
    visitor_id is null
    and event_type = 'view'
    and exists (
      select 1 from public.items
      where items.id = item_analytics.item_id and items.is_active
    )
  );

create policy item_analytics_insert_authenticated
  on public.item_analytics for insert to authenticated
  with check (
    visitor_id = (select auth.uid())
    and event_type in (
      'view', 'favorite', 'unfavorite', 'inquiry', 'match',
      'swap_proposed', 'swap_accepted', 'swap_completed'
    )
    and exists (
      select 1 from public.items
      where items.id = item_analytics.item_id and items.is_active
    )
  );

-- service_role bypasses RLS; a public always-true UPDATE policy is unnecessary.
drop policy if exists item_boosts_service_update on public.item_boosts;

-- Public buckets serve object URLs without a broad listing policy. Retain the
-- authenticated owner's SELECT permission required for update/upsert/delete.
drop policy if exists "Public read access for item photos" on storage.objects;
drop policy if exists "Users can read own photos" on storage.objects;
create policy "Users can read own photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
