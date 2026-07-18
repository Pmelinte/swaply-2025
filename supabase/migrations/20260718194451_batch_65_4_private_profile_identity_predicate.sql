-- Batch 65.4 — keep the participant identity predicate outside the exposed API schema.
--
-- The initial projection migration introduced a caller-bound relationship predicate
-- in public so the RLS policy could preserve private identity for legitimate
-- participants. This forward-only hardening moves the helper to the existing
-- private schema and separates anonymous public discovery from authenticated
-- participant access.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.profile_identity_allowed_v1(
  p_target_user_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $function$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null or p_target_user_id is null then
    return false;
  end if;

  if v_actor_id = p_target_user_id then
    return true;
  end if;

  if exists (
    select 1
    from public.user_roles r
    where r.user_id = v_actor_id
      and r.role in ('moderator', 'admin')
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.swaps s
    where (s.requester_id = v_actor_id and s.responder_id = p_target_user_id)
       or (s.responder_id = v_actor_id and s.requester_id = p_target_user_id)
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.conversations c
    where c.participant_ids @> array[v_actor_id, p_target_user_id]::uuid[]
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.matches m
    where (m.initiator_id = v_actor_id and m.target_user_id = p_target_user_id)
       or (m.target_user_id = v_actor_id and m.initiator_id = p_target_user_id)
  ) then
    return true;
  end if;

  return false;
end;
$function$;

revoke all on function private.profile_identity_allowed_v1(uuid)
  from public, anon;
grant execute on function private.profile_identity_allowed_v1(uuid)
  to authenticated, service_role;

alter table public.public_profiles enable row level security;

drop policy if exists public_profiles_read on public.public_profiles;
drop policy if exists public_profiles_public_read on public.public_profiles;
drop policy if exists public_profiles_participant_read on public.public_profiles;

create policy public_profiles_public_read
  on public.public_profiles
  for select
  to anon, authenticated
  using (is_public);

create policy public_profiles_participant_read
  on public.public_profiles
  for select
  to authenticated
  using (private.profile_identity_allowed_v1(user_id));

revoke execute on function public.profile_identity_allowed_v1(uuid)
  from public, anon, authenticated, service_role;
drop function public.profile_identity_allowed_v1(uuid);

commit;
