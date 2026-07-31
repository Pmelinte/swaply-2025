-- V1-04.3 — Fix message activity trigger against the current messages schema.

create or replace function public.touch_conversation_activity_from_message_v1()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_conversation_id uuid;
begin
  if new.conversation_id is null or btrim(new.conversation_id) = '' then
    return new;
  end if;

  begin
    v_conversation_id := new.conversation_id::uuid;
  exception
    when invalid_text_representation then
      return new;
  end;

  update public.conversations
  set updated_at = now()
  where id = v_conversation_id;

  return new;
end;
$$;

revoke all on function public.touch_conversation_activity_from_message_v1() from public, anon, authenticated;
