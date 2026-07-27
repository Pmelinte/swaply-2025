import { describe, expect, it } from "vitest";
import {
  summarizeMultiUserLifecycle,
  type MultiUserLifecycleSnapshot,
} from "@/lib/swaps/multiUserLifecycle";

describe("E3.4 lifecycle regression", () => {
  it("never completes an empty exchange", () => {
    const snapshot: MultiUserLifecycleSnapshot = {
      revision: 1,
      swapStatus: "in_progress",
      legs: [],
    };

    expect(summarizeMultiUserLifecycle(snapshot).completionEligible).toBe(false);
  });

  it("does not reopen a completed exchange", () => {
    const snapshot: MultiUserLifecycleSnapshot = {
      revision: 1,
      swapStatus: "completed",
      legs: [{ id: "leg", fromUserId: "a", toUserId: "b", state: "fulfilled" }],
    };

    expect(summarizeMultiUserLifecycle(snapshot).completionEligible).toBe(false);
  });
});
