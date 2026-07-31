-- V1-04.2B.5.1 — Trigger execute hardening

revoke all on function public.require_message_immutability_v1() from public;
revoke all on function public.require_message_immutability_v1() from anon;
revoke all on function public.require_message_immutability_v1() from authenticated;
