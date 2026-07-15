import type { SwapStatus } from "./lifecycle";

export const CANCELLABLE_SWAP_STATUSES = [
  "pending",
  "accepted",
  "in_progress",
] as const satisfies readonly SwapStatus[];

export type CancellableSwapStatus =
  (typeof CANCELLABLE_SWAP_STATUSES)[number];

export type SwapParticipantRole = "requester" | "responder";

export function isCancellableSwapStatus(
  value: unknown,
): value is CancellableSwapStatus {
  return (
    typeof value === "string" &&
    (CANCELLABLE_SWAP_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeCancelReason(reason: string | null | undefined): string {
  return (reason ?? "").trim();
}

export function requiresCancelReason(status: CancellableSwapStatus): boolean {
  return status === "accepted" || status === "in_progress";
}

export function isCancellationCounted(
  status: CancellableSwapStatus,
): boolean {
  return status !== "pending";
}

export function canParticipantCancel(
  status: CancellableSwapStatus,
  role: SwapParticipantRole,
): boolean {
  if (status === "pending") return role === "requester";
  return true;
}

export function validateCancelReason(
  status: CancellableSwapStatus,
  reason: string | null | undefined,
): { ok: true; reason: string } | { ok: false; message: string } {
  const normalized = normalizeCancelReason(reason);

  if (normalized.length > 500) {
    return { ok: false, message: "Cancellation reason is too long" };
  }

  if (requiresCancelReason(status) && normalized.length < 3) {
    return {
      ok: false,
      message: "Cancellation reason is required after acceptance",
    };
  }

  return {
    ok: true,
    reason: normalized || "withdrawn",
  };
}
