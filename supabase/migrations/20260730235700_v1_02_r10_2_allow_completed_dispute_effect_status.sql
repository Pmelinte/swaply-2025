-- V1-02-R10.2 — allow completed as the source status recorded for a legitimate
-- post-completion dispute effect.
-- Forward-only. Production application requires explicit owner authorisation.

begin;

alter table public.swap_dispute_effects
  drop constraint if exists swap_dispute_effects_from_status_check;

alter table public.swap_dispute_effects
  add constraint swap_dispute_effects_from_status_check
  check (from_status in ('accepted', 'in_progress', 'completed'));

comment on constraint swap_dispute_effects_from_status_check
  on public.swap_dispute_effects is
  'V1-02-R10.2 permits accepted, in_progress, or completed as the immutable source status of a canonical dispute opening.';

commit;
