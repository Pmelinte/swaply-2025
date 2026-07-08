# Advanced swap modes foundation

Batch 9 adds the architectural foundation for advanced Swaply exchange modes.

## Supported modes

1. `one_to_one`
2. `one_to_many`
3. `many_to_one`
4. `object_for_service`
5. `object_for_property`
6. `object_for_event`
7. `service_for_service`
8. `property_for_property`
9. `event_bundle_swap`
10. `circular_swap_3_users`
11. `swap_chain_4_or_5_users`
12. `token_adjusted_swap`

## Core safety rule

AI can propose and explain advanced swaps, but it cannot finalize them.

Every advanced proposal has `requiresAllParticipantConsent: true`. Moving into exchange requires:

- correct participant count for the selected mode;
- every participant has accepted/confirmed/completed status;
- every participant has at least one give leg and one receive leg;
- token-adjusted swaps include an explicit token adjustment record;
- proposal is not cancelled or disputed.

## Circular swap example

- A gives a bike and wants a laptop.
- B gives a laptop and wants a camera.
- C gives a camera and wants a bike.

AI may detect the cycle, but all three people must consent before the proposal can move to Exchange.

## Token-adjusted swap

`token_adjusted_swap` allows a value gap to be represented with swapleni. This batch only models the adjustment. It does not implement ledger debits, credits, payment, escrow or rank changes.

## What this batch does not do

- It does not change the live matching algorithm.
- It does not add Supabase migrations.
- It does not change Exchange runtime behavior.
- It does not add UI controls to the Matching drawer yet.
- It does not auto-confirm or auto-finalize any swap.
- It does not make tokens equivalent to trust rank.

## Next safe step

A later batch can expose these modes in the Matching drawer as filters and labels, while keeping unfinished actions disabled until Exchange supports the selected mode end-to-end.
