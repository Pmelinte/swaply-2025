# Train E / PR B — Supabase Production Parity Evidence

## Scope

This evidence closes the database parity gap identified after the Train E audit. It records the direct application and verification of the Train E migrations in the Supabase Production project `keaejxlwqtjjglijiplh`.

## Production migrations applied

The following migrations are present in Supabase Production migration history:

- `e3_1_multi_user_exchange_model`
- `e3_2_revision_unanimous_consent`
- `e3_3_circular_bundle_atomic_activation`
- `e3_4_multi_user_lifecycle`
- `e3_5_cancel_withdraw_dispute_authority`
- `e4_3_affiliate_attribution`
- `e4_4_service_payments_and_commissions`
- `e4_5_webhook_authority_reconciliation`
- `e4_7_campaigns_controlled_promotion`

## Migration correction discovered during Production application

The original E3.4 migration used a composite row variable together with additional scalar targets in one `SELECT ... INTO` list. PostgreSQL rejected that form with:

`record variable cannot be part of multiple-item INTO list`

The migration was corrected by separating:

1. the locked `swap_legs` row read;
2. the source and target participant user ID read.

The corrected migration was then applied successfully to Production.

## Schema parity verification

Direct Production inspection confirmed that all required Train E tables exist:

- `swap_participants`
- `swap_legs`
- `swap_revision_acceptances`
- `swap_item_reservations`
- `swap_authority_events`
- `affiliate_offers`
- `affiliate_clicks`
- `affiliate_conversions`
- `service_payment_orders`
- `service_payment_events`
- `service_payment_reconciliation_runs`
- `service_payment_reconciliation_items`
- `promotion_campaigns`
- `promotion_impressions`

RLS is enabled on every table above.

## RPC parity verification

Direct Production inspection confirmed the required server-authority functions exist:

- `is_swap_participant`
- `revise_swap_agreement`
- `accept_swap_revision`
- `activate_atomic_exchange`
- `confirm_swap_leg_progress`
- `apply_swap_authority_action`

## Commercial write-boundary verification

Direct privilege inspection confirmed that neither `anon` nor `authenticated` can write to:

- `affiliate_offers`
- `affiliate_clicks`
- `affiliate_conversions`
- `service_payment_orders`
- `service_payment_events`
- `service_payment_reconciliation_runs`
- `service_payment_reconciliation_items`
- `promotion_campaigns`
- `promotion_impressions`

This preserves server-side authority for affiliate ingestion, payments, webhook processing, reconciliation and promotion delivery evidence.

## Activation boundary

This PR does not activate a live payment provider, affiliate provider, checkout endpoint, webhook secret or paid promotion delivery. It establishes and verifies the Production schema and authority contracts only.

## Verdict

Supabase Production is now schema-aligned for the Train E E3.1–E3.5 and E4.3/E4.4/E4.5/E4.7 database scope.
