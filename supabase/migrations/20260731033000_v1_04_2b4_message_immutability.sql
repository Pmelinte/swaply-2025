-- V1-04.2B.4 — Message Immutability

create or replace function public.require_message_immutability_v1()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'message_delete_forbidden' using errcode = '42501';
  end if;

  if (to_jsonb(new) - array['is_read', 'read_at', 'metadata'])
      is distinct from
     (to_jsonb(old) - array['is_read', 'read_at', 'metadata']) then
    raise exception 'message_content_immutable' using errcode = '42501';
  end if;

  if (coalesce(new.metadata, '{}'::jsonb) - array['translations', 'detected_language'])
      is distinct from
     (coalesce(old.metadata, '{}'::jsonb) - array['translations', 'detected_language']) then
    raise exception 'message_metadata_immutable' using errcode = '42501';
  end if;

  if (new.is_read is distinct from old.is_read
      or new.read_at is distinct from old.read_at)
     and auth.uid() is distinct from old.recipient_id then
    raise exception 'message_read_receipt_recipient_required' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists require_message_immutability_v1 on public.messages;
create trigger require_message_immutability_v1
before update or delete on public.messages
for each row execute function public.require_message_immutability_v1();
