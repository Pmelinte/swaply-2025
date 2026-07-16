begin;

do $fix$
declare
  v_definition text;
begin
  select pg_get_functiondef(
    'public.resolve_safety_report_v1(uuid,text,text,text,text)'::regprocedure
  ) into v_definition;

  if position('wg_catalog.greatest('in v_definition) = 0 then
    raise exception 'Expected pg_catalog.greatest reference not found';
  end if;

  v_definition := replace(
    v_definition,
    'pg_catalog.greatest(',
    'greatest('
  );

  execute v_definition;
end
$fix$;

commit;
