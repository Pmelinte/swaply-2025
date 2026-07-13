begin;

revoke all on function public.ensure_match_conversation_agenda_v2()
  from public;
revoke all on function public.ensure_match_conversation_agenda_v2()
  from anon;
revoke all on function public.ensure_match_conversation_agenda_v2()
  from authenticated;

comment on function public.ensure_match_conversation_agenda_v2()
is 'Batch 59: internal trigger-only agenda v2 initializer; direct client execution revoked.';

commit;
