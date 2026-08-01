-- V1-05.2 — final fail-closed hardening after automated review.
--
-- This wrapper keeps the existing validated RPC intact in the private schema,
-- exposes a narrower public entry point, bounds editor metadata to two exact
-- server-generated fields, and requires canonical value tiers for Services and
-- Events before any persistence can occur.

begin;

alter function public.create_domain_listing_v1(text, jsonb, text)
  set schema private;

alter function private.create_domain_listing_v1(text, jsonb, text)
  rename to create_domain_listing_v1_validated_core;

revoke all on function private.create_domain_listing_v1_validated_core(text, jsonb, text)
  from public, anon, authenticated;

create or replace function public.create_domain_listing_v1(
  p_domain text,
  p_payload jsonb,
  p_idempotency_key text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, extensions, private
as $function$
declare
  v_actor uuid := auth.uid();
  v_domain text := lower(btrim(coalesce(p_domain, '')));
  v_item jsonb;
  v_listing jsonb;
  v_editor jsonb;
  v_unknown_key text;
  v_expected_source text;
  v_allowed_editor_keys constant text[] := array[
    'schema_version', 'source'
  ];
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;

  if v_domain not in ('property', 'service', 'event') then
    raise exception using errcode = '22023', message = 'Unsupported listing domain.';
  end if;

  if jsonb_typeof(p_payload) is distinct from 'object'
    or jsonb_typeof(p_payload -> 'item') is distinct from 'object'
    or jsonb_typeof(p_payload -> 'listing') is distinct from 'object'
    or jsonb_typeof(p_payload #> '{private,editor_payload}') is distinct from 'object'
  then
    raise exception using errcode = '22023', message = 'Invalid domain listing payload.';
  end if;

  v_item := p_payload -> 'item';
  v_listing := p_payload -> 'listing';
  v_editor := p_payload #> '{private,editor_payload}';
  v_expected_source := v_domain || '_wizard';

  select keys.key
  into v_unknown_key
  from jsonb_object_keys(v_editor) as keys(key)
  where not (keys.key = any(v_allowed_editor_keys))
  limit 1;

  if v_unknown_key is not null then
    raise exception using
      errcode = '22023',
      message = format('Unsupported editor metadata field: %s', v_unknown_key);
  end if;

  if not (v_editor ?& v_allowed_editor_keys)
    or jsonb_typeof(v_editor -> 'schema_version') is distinct from 'string'
    or v_editor ->> 'schema_version' is distinct from '1.0'
    or jsonb_typeof(v_editor -> 'source') is distinct from 'string'
    or v_editor ->> 'source' is distinct from v_expected_source
  then
    raise exception using errcode = '22023', message = 'Invalid editor metadata.';
  end if;

  if lower(v_editor::text) ~ '(wifi|wi-fi|password|passcode|credential|secret|token|api[_ -]?key)'
  then
    raise exception using errcode = '22023', message = 'Credential-bearing editor metadata is forbidden.';
  end if;

  if v_domain in ('service', 'event') then
    if v_item ->> 'perceived_value_tier' not in ('small', 'medium', 'large', 'special')
      or v_item ->> 'swap_wants_value_tier' not in ('small', 'medium', 'large', 'special')
      or v_listing ->> 'swap_wants_value_tier' not in ('small', 'medium', 'large', 'special')
    then
      raise exception using errcode = '22023', message = 'Canonical value tiers are required.';
    end if;
  end if;

  return private.create_domain_listing_v1_validated_core(
    p_domain,
    p_payload,
    p_idempotency_key
  );
end;
$function$;

revoke all on function public.create_domain_listing_v1(text, jsonb, text)
  from public, anon;
grant execute on function public.create_domain_listing_v1(text, jsonb, text)
  to authenticated;

comment on function private.create_domain_listing_v1_validated_core(text, jsonb, text) is
  'V1-05.2 private validated create core; direct client execution is revoked.';
comment on function public.create_domain_listing_v1(text, jsonb, text) is
  'V1-05.2 final fail-closed public wrapper with bounded editor metadata and required value tiers.';

commit;
