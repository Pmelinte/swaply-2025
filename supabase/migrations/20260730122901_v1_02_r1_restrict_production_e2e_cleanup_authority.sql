revoke all on function public.cleanup_c3_e2e_fixture_v1(uuid)
  from public, anon, authenticated, service_role;

comment on function public.cleanup_c3_e2e_fixture_v1(uuid) is
  'Production-retained E2E cleanup helper. V1-02-R1: executable only by the PostgreSQL owner; unavailable to PUBLIC, anon, authenticated and service_role.';
