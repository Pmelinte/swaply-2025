# Swaply — Commercial provider outage runbook

## 1. Current boundary

Payment, escrow/custody, affiliate, courier and other commercial providers remain inactive unless separately approved and verified. An inactive provider must remain fail closed and must not create a charge, booking, payout, attribution or promotion side effect.

## 2. Trigger

Use this runbook for provider outage, webhook failure, reconciliation mismatch, duplicate event, credential failure, elevated fraud signal or an unplanned live-traffic path.

## 3. Containment

1. Disable initiation of new provider operations.
2. Preserve provider event IDs, Swaply authority IDs and timestamps.
3. Do not retry non-idempotent calls blindly.
4. Keep exchange negotiation available where safe, but label the commercial step unavailable.
5. Prevent completion/reward side effects when the provider outcome is uncertain.
6. Escalate possible financial or personal-data exposure as `SEV-1`.

## 4. Inactive-provider response

If the provider is not authorised for live traffic:

- confirm the commercial closure gate remains blocked;
- confirm no live credential or webhook endpoint is processing public traffic;
- treat any observed live operation as a security incident;
- do not activate a substitute provider.

## 5. Active-provider response, only after future authorisation

- verify idempotency key and webhook signature;
- compare provider records with the canonical Swaply ledger;
- quarantine ambiguous operations for human review;
- refund/cancel only through provider-supported authority;
- never mutate trust rank directly from a payment result;
- reopen after reconciliation, recovery drill and zero P0/P1 blockers.

## 6. Evidence

Record provider, environment, event IDs, affected Swaply IDs, state before/after, reconciliation output, operator, approver and residual risk. Never place credentials or complete payment payloads in public artifacts.

## 7. Reopening gate

The repository commercial closure gate must remain fail closed unless provider activation, live traffic, reconciliation, recovery drills and blocker review are all explicitly true. This runbook does not satisfy or bypass those gates by itself.
