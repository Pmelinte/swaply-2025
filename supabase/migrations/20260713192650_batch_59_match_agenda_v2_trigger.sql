begin;

create or replace function public.ensure_match_conversation_agenda_v2()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  if new.match_id is not null then
    new.agenda_state :=
      jsonb_set(
        jsonb_set(
          case
            when jsonb_typeof(new.agenda_state) = 'object'
              then new.agenda_state
            else '{}'::jsonb
          end,
          '{version}',
          '2'::jsonb,
          true
        ),
        '{conversation_id}',
        to_jsonb(new.id::text),
        true
      );
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_match_conversation_agenda_v2
  on public.conversations;

create trigger ensure_match_conversation_agenda_v2
before insert on public.conversations
for each row
execute function public.ensure_match_conversation_agenda_v2();

comment on function public.ensure_match_conversation_agenda_v2()
is 'Batch 59: initialize every new match conversation with a self-identifying agenda v2 snapshot.';

commit;
