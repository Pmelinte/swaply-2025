-- Apply together with the application changes that read other users from
-- public.public_profiles. This removes broad access to private profile rows.

begin;

drop policy if exists profiles_select_public on public.profiles;
drop policy if exists profiles_select_public_anon on public.profiles;
drop policy if exists select_profiles_authenticated on public.profiles;
drop policy if exists profiles_delete_admin on public.profiles;

drop policy if exists select_own_profile on public.profiles;
create policy select_own_profile
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

-- Consolidate duplicate ownership policies and require both USING and WITH CHECK.
drop policy if exists insert_own_profile on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
create policy insert_own_profile
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists update_own_profile on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy update_own_profile
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists delete_own_profile on public.profiles;
create policy delete_own_profile
  on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon;
revoke truncate, references, trigger on table public.profiles from authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;

commit;
