begin;

create index if not exists safety_report_resolution_effects_moderator_idx
  on public.safety_report_resolution_effects (moderator_id);

create index if not exists safety_report_resolution_effects_user_idx
  on public.safety_report_resolution_effects (affected_user_id)
  where affected_user_id is not null;

create index if not exists safety_report_resolution_effects_item_idx
  on public.safety_report_resolution_effects (affected_item_id)
  where affected_item_id is not null;

commit;
