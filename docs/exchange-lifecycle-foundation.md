# Exchange lifecycle foundation

Batch 12 adds a safe foundation for Exchange lifecycle logic.

## Statuses

- `proposed`
- `accepted`
- `in_progress`
- `shipped`
- `received`
- `completed`
- `cancelled`
- `disputed`

## Logistics modes

- local handover
- national courier
- international courier
- vacation handover
- property exchange
- service exchange
- event/reservation transfer

## Required checklist

Before completion, the exchange needs:

- condition confirmed;
- packaging confirmed or explicitly not applicable;
- handoff/shipment confirmed;
- received confirmed.

Completion also needs participant confirmations. The completion gate always includes `requiresHumanConfirmation: true`.

## Safety rules

- Exchange cannot jump directly from proposed to completed.
- Completed, cancelled and disputed exchanges are terminal in this foundation.
- Exchange cannot auto-complete.
- Cancelled exchanges can reactivate linked items.
- Disputed exchanges suspend stories.
- Feedback is prompted after completion.
- Story prompt appears only after feedback is submitted.

## What this batch does not do

- It does not change the live Exchange UI.
- It does not change database tables.
- It does not create Supabase migrations.
- It does not ship courier integrations.
- It does not award tokens.
- It does not publish stories.
- It does not make dispute decisions.

## Next safe step

A later batch can connect these gates to UI status cards and the Exchange drawer while keeping destructive actions disabled until server-side authorization and RLS are audited.
