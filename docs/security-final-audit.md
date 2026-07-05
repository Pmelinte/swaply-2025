# Swaply security and release audit

## Scope

This checklist covers the current real exchange flow:

- persistent matching;
- swap lifecycle;
- real chat;
- exchange logistics;
- feedback and reputation;
- notifications;
- moderation and trust;
- chat translation foundation;
- public trust profile.

## API route protections

The following route families must require an authenticated user and participant ownership where applicable:

- `/api/swaps/[id]/decision`
- `/api/swaps/[id]/complete`
- `/api/swaps/[id]/logistics`
- `/api/swaps/[id]/feedback`
- `/api/messages/[id]/translate`
- `/api/notifications`

Expected rule: user must be authenticated and must be either the actor, participant, sender, recipient, or notification owner.

## Database/RLS expectations

The production Supabase project should enforce these principles:

- profiles: public read for safe display fields; owner-only update;
- items: public read only for active public items; owner-only write;
- matches: visible only to participants;
- swaps: visible only to participants;
- conversations: visible only to participants;
- messages: visible only to sender/recipient/participants;
- notifications: visible only to notification owner;
- feedback: insert only by swap participants after completed status;
- feedback public read should expose only safe review fields.

## Release smoke pages

The following localized pages must render without fatal errors:

- `/en/`
- `/en/explore`
- `/en/matching`
- `/en/chat`
- `/en/exchange`
- `/en/notifications`
- `/en/profile`
- `/en/objects`
- `/en/properties`
- `/en/services`
- `/en/events`

## Known follow-ups

- replace fallback chat translation with a real provider;
- run Supabase SQL policy inspection in production;
- run authenticated Playwright with stable demo IDs;
- confirm Vercel build after merge;
- confirm all required environment variables exist in Vercel.
