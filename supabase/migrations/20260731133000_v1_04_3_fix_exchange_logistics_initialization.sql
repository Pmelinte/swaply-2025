-- V1-04.3 — Initialize missing exchange_logistics before applying commands.

do $$
declare
  v_definition text;
  v_old text := 'if jsonb_typeof(v_logistics) <> ''object'' then';
  v_new text := 'if v_logistics is null or jsonb_typeof(v_logistics) <> ''object'' then';
begin
  select pg_get_functiondef(
    'public.update_exchange_logistics_v1(uuid,text,jsonb)'::regprocedure
  ) into v_definition;

  if position(v_old in v_definition) = 0 then
    raise exception 'update_exchange_logistics_v1 initialization guard not found';
  end if;

  execute replace(v_definition, v_old, v_new);
end;
$$;

revoke all on function public.update_exchange_logistics_v1(uuid, text, jsonb) from public, anon;
grant execute on function public.update_exchange_logistics_v1(uuid, text, jsonb) to authenticated;
