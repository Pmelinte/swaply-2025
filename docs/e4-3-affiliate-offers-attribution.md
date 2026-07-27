# Train E — E4.3 Affiliate Offers & Attribution

## Scope

E4.3 introduces the canonical contract for affiliate offers, clicks and conversions without enabling any affiliate programme in Production.

## Existing legacy surface

The repository already contains direct Booking.com, Airbnb and VRBO deeplink generation. That code may append provider identifiers, but it does not provide a canonical disclosure, campaign window, attribution identifier, expiration, conversion deduplication or audit trail.

E4.3 does not remove or activate the legacy links. It creates the safety boundary required before a legacy link may be migrated to the provider registry.

## Contract

An affiliate offer must declare:

- provider and campaign identifiers;
- destination URL;
- lifecycle status;
- visible affiliate/sponsored disclosure;
- attribution window;
- campaign start and end;
- allowed locales;
- explicit Production approval.

The contract fails closed when disclosure, campaign dates, locale, identity or Production approval is missing.

## Attribution

Each accepted click receives an immutable attribution ID and expiration timestamp. The click records only a user ID or a privacy-minimised anonymous session hash, never raw browsing secrets.

Conversions require both:

- a unique provider conversion ID;
- a unique request deduplication key.

Conversions outside the attribution window are rejected.

## Database safety

The additive migration creates:

- `affiliate_offers`;
- `affiliate_clicks`;
- `affiliate_conversions`.

All tables have RLS enabled. Browser-side writes are revoked. Authenticated users may read only their own click attribution history. Campaign management and conversion ingestion remain server/service-role responsibilities.

## Non-goals

E4.3 does not:

- activate Booking.com, Airbnb, VRBO or another affiliate programme;
- add secrets;
- change organic ranking;
- change trust rank;
- charge the core exchange;
- create payouts;
- recognise revenue;
- implement payment or webhook authority.

## Closure gate

E4.3 is ready when:

- missing disclosure is rejected;
- unapproved Production activation is rejected;
- click attribution expires deterministically;
- locale constraints are enforced;
- duplicate conversions are rejected;
- expired conversions are rejected;
- existing destination query parameters survive redirect construction;
- CI and Vercel Preview are green.
