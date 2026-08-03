begin;

-- Supplemental V1-05.4.7 current-contract fixture.
--
-- Production's canonical accept_matching_interest authority clears historical
-- dismissal metadata when a Match is accepted. The isolated foundation keeps
-- those columns separate so the matching migration is compiled against the
-- same runtime shape without changing any Production schema.
alter table public.matches
  add column if not exists dismissed_by uuid references auth.users(id) on delete set null,
  add column if not exists dismissed_at timestamptz,
  add column if not exists dismiss_reason text;

commit;
