begin;

alter table public.domain_listing_private_data
  drop constraint if exists domain_listing_private_editor_payload_bounded;

alter table public.domain_listing_private_data
  add constraint domain_listing_private_editor_payload_bounded
  check (
    jsonb_typeof(editor_payload) = 'object'
    and jsonb_object_length(editor_payload) = 2
    and editor_payload ->> 'schema_version' = '1.0'
    and editor_payload ->> 'source' = domain || '_wizard'
  );

comment on constraint domain_listing_private_editor_payload_bounded
  on public.domain_listing_private_data is
  'V1-05.3 fail-closed editor metadata: exactly schema_version and domain-bound source.';

commit;
