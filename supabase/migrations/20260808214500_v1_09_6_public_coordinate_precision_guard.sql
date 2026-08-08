-- V1-09.6 — Privacy hardening for public domain-listing coordinates.
--
-- Exact location belongs in public.domain_listing_private_data.exact_location.
-- Public latitude/longitude, where exposed for approximate map/matching use,
-- must never persist with more than two decimal places.
--
-- This is a forward-only storage invariant. It intentionally does not remove
-- public approximate coordinates or change public browsing/RLS semantics.

begin;

alter table public.properties
  drop constraint if exists properties_public_coordinates_approximate;

alter table public.properties
  add constraint properties_public_coordinates_approximate
  check (
    (lat is null or scale(lat) <= 2)
    and (lon is null or scale(lon) <= 2)
  ) not valid;

alter table public.properties
  validate constraint properties_public_coordinates_approximate;

alter table public.events_listings
  drop constraint if exists events_listings_public_coordinates_approximate;

alter table public.events_listings
  add constraint events_listings_public_coordinates_approximate
  check (
    (lat is null or scale(lat) <= 2)
    and (lon is null or scale(lon) <= 2)
  ) not valid;

alter table public.events_listings
  validate constraint events_listings_public_coordinates_approximate;

commit;
