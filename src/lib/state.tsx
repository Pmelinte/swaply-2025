/**
 * Re-export from modular state management.
 * This file preserves backwards compatibility — all existing imports
 * from "@/lib/state" continue to work unchanged.
 *
 * The actual implementation is now split across:
 * - state/index.tsx    — AppStateProvider + useAppState (orchestrator)
 * - state/helpers.ts   — Utility functions (safe*, session, feature toggles)
 * - state/mappers.ts   — Supabase row → typed object mappers
 * - state/matching.ts  — Item matching algorithm
 * - state/useRealtime.ts — Supabase Realtime subscriptions
 */
export { AppStateProvider, useAppState, computeMatchesForUser, computeTierBenefits } from "./state/index";
