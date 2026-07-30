-- V1-02-R10 — authenticated RG-13 adversarial closure
-- Forward-only fix for a real authority gap found by the Production rollback harness:
-- Stories require a completed Swap, while the canonical dispute authority previously
-- accepted only accepted/in_progress Swaps. This made post-completion Story suppression
-- unreachable through the supported RPC.

begin;

alter table public.disputes
  drop constraint if exists disputes_opened_from_status_check;

alter table public.disputes
  add constraint disputes_opened_from_status_check
  check (opened_from_status in ('accepted', 'in_progress', 'completed'));

-- Preserve the complete current function body and change only the verified status gate.
do $$
declare
  function_definition text;
  old_fragment constant text :=
    'p_expected_status not in (''accepted'', ''in_progress'')';
  new_fragment constant text :=
    'p_expected_status not in (''accepted'', ''in_progress'', ''completed'')';
begin
  select pg_catalog.pg_get_functiondef(procedure_row.oid)
    into function_definition
    from pg_catalog.pg_proc procedure_row
   where procedure_row.oid =
     'public.open_swap_dispute_v1(uuid,text,text,text,jsonb,text)'::regprocedure;

  if function_definition is null
     or pg_catalog.position(old_fragment in function_definition) = 0 then
    raise exception 'R10 expected open_swap_dispute_v1 status gate was not found';
  end if;

  function_definition := pg_catalog.replace(
    function_definition,
    old_fragment,
    new_fragment
  );

  execute function_definition;
end;
$$;

-- Preserve the current transition engine and add only completed -> disputed.
do $$
declare
  function_definition text;
  old_fragment constant text :=
    'when ''in_progress'' then p_to_status in (\n      ''completed'',\n      ''cancelled'',\n      ''disputed''\n    )\n    else false';
  new_fragment constant text :=
    'when ''in_progress'' then p_to_status in (\n      ''completed'',\n      ''cancelled'',\n      ''disputed''\n    )\n    when ''completed'' then p_to_status in (\n      ''disputed''\n    )\n    else false';
begin
  select pg_catalog.pg_get_functiondef(procedure_row.oid)
    into function_definition
    from pg_catalog.pg_proc procedure_row
   where procedure_row.oid =
     'public.apply_swap_transition_v1(uuid,text,text,uuid,text,text)'::regprocedure;

  if function_definition is null
     or pg_catalog.position(old_fragment in function_definition) = 0 then
    raise exception 'R10 expected apply_swap_transition_v1 transition matrix was not found';
  end if;

  function_definition := pg_catalog.replace(
    function_definition,
    old_fragment,
    new_fragment
  );

  execute function_definition;
end;
$$;

comment on function public.open_swap_dispute_v1(uuid, text, text, text, jsonb, text) is
  'Canonical participant dispute authority. V1-02-R10 permits completed Swaps so published Stories can be suppressed by a legitimate post-completion dispute.';

comment on function public.apply_swap_transition_v1(uuid, text, text, uuid, text, text) is
  'Canonical Swap transition authority. V1-02-R10 adds completed -> disputed for legitimate post-completion disputes; all other terminal transitions remain denied.';

commit;
