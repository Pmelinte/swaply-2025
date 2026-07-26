# Train E — E2.1 Item Classification and Enrichment

## Objective

Provide a server-side, confirmation-first proposal for item metadata using the E1 gateway. The service suggests metadata but never writes or publishes it.

## Delivered

- concrete input and output schemas for item classification and description generation;
- support for text and bounded image references in the classification contract;
- deterministic fallback when no provider is available;
- a single `proposeItemEnrichment` orchestration service;
- suggested title, description, category, subcategory and tags;
- confidence, provenance and warnings;
- mandatory `requiresHumanConfirmation: true`;
- tests for fallback, image-only input, invalid input and zero mutation.

## Safety rules

- no database writes;
- no automatic publication;
- no paid provider activation;
- no raw image bytes;
- no claim that images were analysed when no vision provider is active;
- low-confidence and fallback results are explicitly flagged for review.

## Out of scope

- item form UI;
- persistence of accepted suggestions;
- active vision provider;
- value estimation;
- translation;
- semantic matching;
- moderation changes.

## Closure evidence

E2.1 may close only after Unit Tests, Lint & Type, Build and Vercel are green and the PR is merged with explicit owner approval.