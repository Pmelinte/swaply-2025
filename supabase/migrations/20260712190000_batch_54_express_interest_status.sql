-- Train C / Batch 54 — Express Interest lifecycle foundation
--
-- The matches.status column is intentionally TEXT in the current schema.
-- Batch 54 introduces `interest_expressed` as the first explicit lifecycle state,
-- before any chat, accepted match, conversation, or swap transition.
--
-- No existing rows are rewritten here. This keeps the migration backward-compatible
-- with legacy statuses already present in production.

COMMENT ON COLUMN public.matches.status IS
  'Lifecycle state. Batch 54 starts with interest_expressed; later states may include pending_chat, accepted, converted_to_swap, and dismissed.';
