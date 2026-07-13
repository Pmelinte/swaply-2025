# Batch 59 — Bilateral Match Agreement

## Scope

- extend the shared guided match agenda to version 2;
- store a structured agreement summary inside `conversations.agenda_state`;
- save agreement revisions with optimistic revision conflict protection;
- let each of the two match participants confirm or withdraw independently;
- mark the `agreement` stage complete only when both participants confirm the same revision;
- reset both confirmations whenever the agreement terms are edited;
- reuse the existing `real-chat:{conversationId}` Realtime channel.

## Agreement fields

- item condition notes;
- what each participant gives and receives;
- logistics method;
- logistics details;
- additional agreed terms.

## Guardrails

- accepted direct match with exactly two participants is required;
- participant-only `SECURITY DEFINER` RPC;
- `PUBLIC` and `anon` cannot execute the RPC;
- manual stage completion cannot bypass bilateral agreement confirmation;
- no automatic message;
- no automatic Exchange creation;
- no match status change;
- no item status change;
- no notification, token, rank, translation, or AI-provider side effect.

## Concurrency

Every save includes the agreement revision currently shown to the user. The database locks the conversation row and rejects stale saves. Confirmation does not increment the content revision, so both participants can confirm the same saved version. Any later save increments the revision and clears confirmations.

## Validation target

- parser and helper unit tests;
- two authenticated participants see agreement changes through existing Realtime;
- first confirmation is visible to the partner without reload;
- second confirmation completes the agreement stage;
- editing creates a new revision and clears both confirmations;
- reload preserves the final snapshot;
- anonymous and unrelated callers remain denied;
- no message, Exchange, token, notification, or match-status side effect.
