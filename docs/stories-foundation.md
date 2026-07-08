# Swaply Stories foundation

Batch 6 adds the first safe foundation for Stories. Stories are separate from Blog.

## Product rule

Blog teaches. Stories inspire.

Stories are tied to real swaps, objects, services, properties, events or completed exchange context. They are not editorial articles and must not be published without consent.

## Publication requirements

A story can become public only when all of these are true:

1. Visibility is `public`.
2. Status is `pending_moderation` or `published`.
3. Author consent is true.
4. Partner consent is true.
5. Moderation consent is true.
6. Title and body do not contain exact addresses, direct contact details or obvious coordinate pairs.

## Statuses

- `draft`
- `pending_partner_consent`
- `pending_moderation`
- `published`
- `hidden`
- `disputed`
- `rejected`

## What this batch does not do

- It does not create Supabase migrations.
- It does not publish real user stories.
- It does not connect rewards or token ledger yet.
- It does not expose private chat, exact locations or partner identity.
- It does not mix Blog and Stories.

## Next implementation step

After this foundation is green, a later batch can add a `/stories` route or integrate safe story previews into Home/public pages. Real publishing should wait for RLS, consent storage and moderation workflow.
