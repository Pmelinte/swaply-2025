begin;

create or replace function public.normalize_safety_moderation_action_v1()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.action = 'suspend'
     and coalesce(current_setting('swaply.safety_authority', true), '')
       = 'resolve_report_v1' then
    new.action := 'suspend_user';
  end if;

  return new;
end;
$function$;

revoke execute on function public.normalize_safety_moderation_action_v1()
  from public, anon, authenticated;

drop trigger if exists normalize_safety_moderation_action_v1
  on public.moderation_actions;
create trigger normalize_safety_moderation_action_v1
before insert on public.moderation_actions
for each row execute function public.normalize_safety_moderation_action_v1();

commit;
