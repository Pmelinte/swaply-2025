import type { UserProfile } from "@/lib/types";
import type { GlobalProfileContract } from "./profileContract";

/**
 * Runtime profile shape after the Batch 65 mapper has reconciled the legacy
 * profile row with the canonical global-first contract.
 *
 * It remains assignable to UserProfile so existing Train C consumers do not
 * need to change during the Batch 65 rollout.
 */
export type GlobalUserProfile = UserProfile & {
  globalProfile: GlobalProfileContract;
  profileRevision: number;
};
