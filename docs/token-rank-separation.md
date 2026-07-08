# Token and rank separation foundation

Batch 13 defines a clear product boundary between swapleni tokens and user rank.

## Product rule

Tokens are utility. Rank is trust.

A user can earn or spend swapleni for platform utility, but they cannot buy reputation.

## Tokens

Tokens can represent:

- welcome grants;
- story rewards;
- exchange completion rewards;
- premium packs;
- AI feature usage;
- listing boosts;
- courier support;
- manual adjustments.

## Rank

Rank is based on trust signals, not token balance.

Supported ranks:

- `free`
- `silver`
- `gold`
- `platinum`

Rank evaluation can consider:

- completed exchanges;
- positive feedback;
- verified profile;
- disputes;
- policy violations;
- long-term good behavior.

## Non-negotiable rules

- Rank cannot be purchased.
- Tokens cannot be converted into rank.
- Token balance is ignored for rank evaluation.
- Unresolved disputes require human review.
- Severe policy violations require human review.
- Utility spending must not imply trust.

## What this batch does not do

- It does not create a token ledger table.
- It does not create payments.
- It does not connect Stripe.
- It does not award real tokens.
- It does not change user profiles.
- It does not change public UI.
- It does not migrate ranks.

## Next safe step

A later batch can add UI explanations and disabled premium/token actions, while keeping the trust-rank model protected from monetization abuse.
