# Photo discovery foundation

Batch 10 adds the safe foundation for photo-based discovery.

## Product directions

### Search by photo

A user can provide a photo of an object they want. AI may later detect:

- likely object title;
- category and subcategory;
- tags;
- similar objects;
- compatible alternatives.

### Reverse discovery

A user can ask: "I have this object. Who wants it?"

AI may later detect likely matches, wishlist terms, compatible users or circular swap options.

## Safety rule

Photo discovery must never block manual item creation.

If AI is unavailable, slow, expensive or uncertain, the user can continue with:

- manual title;
- manual category;
- text search;
- category browsing;
- normal item creation.

## Current implementation

This batch adds:

- `PhotoDiscoveryRequest`
- `PhotoDiscoveryResult`
- image quality issue detection
- fallback result builder
- reverse discovery fallback suggestions
- safe demo requests
- tests for non-blocking behavior

## What this batch does not do

- It does not connect a vision model.
- It does not expose API keys.
- It does not create an upload endpoint.
- It does not change the live item form.
- It does not run real visual search.
- It does not create Supabase migrations.
- It does not claim AI recognition when fallback is used.

## Next safe step

A later batch can add a UI entry point in the contextual drawer or Objects page. The UI should say that photo search is optional and that manual search remains available.
