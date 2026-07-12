-- Batch 53 — explicit table grants hardening
-- Keep table privileges aligned with the RLS contract.

begin;

revoke all privileges on table public.wanted_requests from anon;
revoke all privileges on table public.wanted_requests from authenticated;

grant select on table public.wanted_requests to anon;
grant select, insert, update, delete on table public.wanted_requests to authenticated;

commit;
