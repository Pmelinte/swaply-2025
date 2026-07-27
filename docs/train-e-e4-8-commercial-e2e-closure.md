# Train E / E4.8 — Commercial E2E & Closure

## Scope

E4.8 closes the commercial foundation introduced by E4.1–E4.7. The closure is contract-level and regression-gated. It does not activate a real payment provider, advertiser network, affiliate programme, wallet, credit product or monetary escrow.

## Closure matrix

The closure gate requires immutable evidence for all of the following scenarios:

1. the swap itself remains free;
2. paid services remain optional and visibly disclosed;
3. an unavailable provider never blocks the swap;
4. affiliate clicks are deduplicated;
5. expired affiliate attribution cannot convert;
6. payment creation is idempotent;
7. declined payment produces no commercial entitlement;
8. an invalid webhook signature produces zero payment effects;
9. webhook replay produces exactly-once effects;
10. stale and out-of-order events cannot overwrite authoritative state;
11. refunds reconcile against provider state;
12. campaigns require moderation approval;
13. campaign frequency limits are enforced;
14. campaign budget limits are enforced;
15. the campaign kill switch stops delivery;
16. outsiders cannot access participant commercial history;
17. participants receive read-only, deterministic order history;
18. test cleanup uses immutable identifiers.

Every scenario must pass and every failure path must preserve zero unintended side effects. Missing, duplicate or malformed evidence fails the gate closed.

## Milestone

Successful evaluation produces:

`MONETIZATION_AND_EXTERNAL_INTEGRATIONS_READY`

This milestone means the repository contains the canonical safety contracts and regression gates needed before provider-specific sandbox adapters are activated. It does not mean that Production payments or advertising are enabled.

## Cumulative E4 result

- E4.1 — commercial contract and inventory;
- E4.2 — provider registry and integration layer;
- E4.3 — affiliate offers and attribution;
- E4.4 — service payments and commissions;
- E4.5 — webhook authority and reconciliation;
- E4.6 — commercial UI and Exchange boundary;
- E4.7 — controlled campaigns and promotion;
- E4.8 — cumulative closure gate.

## Production safety boundary

- no payment provider is activated by this batch;
- no payment secret is added;
- no real charge, refund or payout is created;
- no advertiser receives viewer identity;
- no sponsored placement affects trust or reputation;
- no legacy boost, Stripe, PayPal or escrow path is automatically legitimised;
- the swap remains free.

## Closure condition

E4 may be declared closed only after the pull request CI, AI regression gate, Vercel Preview and post-merge Production deployment are green.
