export const SWAP_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
  "expired",
  "disputed",
] as const;

export type SwapStatus = (typeof SWAP_STATUSES)[number];

/**
 * Canonical global Swap/Exchange state graph.
 *
 * `accepted -> completed` remains as a temporary compatibility bridge until
 * Batch 61.3 moves completion behind bilateral server-side confirmation.
 * Logistics detail states and dispute resolution outcomes are intentionally
 * not global swap statuses.
 */
export const SWAP_TRANSITIONS = {
  pending: ["accepted", "rejected", "cancelled", "expired"],
  accepted: ["in_progress", "completed", "cancelled", "disputed"],
  in_progress: ["completed", "cancelled", "disputed"],
  completed: [],
  rejected: [],
  cancelled: [],
  expired: [],
  disputed: [],
} as const satisfies Record<SwapStatus, readonly SwapStatus[]>;

export const TERMINAL_SWAP_STATUSES = [
  "completed",
  "rejected",
  "cancelled",
  "expired",
  "disputed",
] as const satisfies readonly SwapStatus[];

export function isSwapStatus(value: unknown): value is SwapStatus {
  return typeof value === "string" &&
    (SWAP_STATUSES as readonly string[]).includes(value);
}

export function allowedSwapTransitions(status: SwapStatus): readonly SwapStatus[] {
  return SWAP_TRANSITIONS[status];
}

export function canTransitionSwap(
  fromStatus: SwapStatus,
  toStatus: SwapStatus,
): boolean {
  return (SWAP_TRANSITIONS[fromStatus] as readonly SwapStatus[]).includes(toStatus);
}

export function isTerminalSwapStatus(status: SwapStatus): boolean {
  return (TERMINAL_SWAP_STATUSES as readonly SwapStatus[]).includes(status);
}
