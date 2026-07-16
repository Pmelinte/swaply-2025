begin;

do $fix$
declare
  v_signature regprocedure;
  v_definition text;
begin
  foreach v_signature in array array[
    'public.set_user_block_v1(uuid,boolean,text)'::regprocedure,
    'public.enforce_unblocked_matching_interest_v1()'::regprocedure,
    'public.enforce_unblocked_conversation_v1()'::regprocedure,
    'public.enforce_unblocked_message_v1()'::regprocedure,
    'public.enforce_unblocked_swap_v1()'::regprocedure
  ]
  loop
    select pg_get_functiondef(v_signature) into v_definition;

    v_definition := replace(v_definition, 'pg_catalog.least(', 'least(');
    v_definition := replace(v_definition, 'pg_catalog.greatest(', 'greatest(');

    execute v_definition;
  end loop;
end
$fix$;

commit;
