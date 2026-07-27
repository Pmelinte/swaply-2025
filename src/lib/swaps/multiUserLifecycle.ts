export const MULTI_USER_LEG_PROGRESS_STATES = [
  "reserved",
  "sender_confirmed",
  "receiver_confirmed",
  "fulfilled",
  "disputed",
  "cancelled",
] as const;

export type MultiUserLegProgressState = (typeof MULTI_USER_LEG_PROGRESS_STATES)[number];

export interface MultiUserLifecycleLeg {
  id: string;
  fromUserId: string;
  toUserId: string;
  state: MultiUserLegProgressState;
}

export interface MultiUserLifecycleSnapshot {
  revision: number;
  swapStatus: "in_progress" | "completed" | "cancelled" | "disputed";
  legs: MultiUserLifecycleLeg[];
}

export interface MultiUserLifecycleSummary {
  totalLegs: number;
  senderConfirmedLegs: number;
  receiverConfirmedLegs: number;
  fulfilledLegs: number;
  disputedLegs: number;
  cancelledLegs: number;
  completionEligible: boolean;
  blocked: boolean;
}

export function summarizeMultiUserLifecycle(snapshot: MultiUserLifecycleSnapshot): MultiUserLifecycleSummary {
  const totalLegs = snapshot.legs.length;
  const senderConfirmedLegs = snapshot.legs.filter((leg) =>
    ["sender_confirmed", "receiver_confirmed", "fulfilled"].includes(leg.state),
  ).length;
  const receiverConfirmedLegs = snapshot.legs.filter((leg) =>
    ["receiver_confirmed", "fulfilled"].includes(leg.state),
  ).length;
  const fulfilledLegs = snapshot.legs.filter((leg) => leg.state === "fulfilled").length;
  const disputedLegs = snapshot.legs.filter((leg) => leg.state === "disputed").length;
  const cancelledLegs = snapshot.legs.filter((leg) => leg.state === "cancelled").length;
  const blocked = disputedLegs > 0 || cancelledLegs > 0;

  return {
    totalLegs,
    senderConfirmedLegs,
    receiverConfirmedLegs,
    fulfilledLegs,
    disputedLegs,
    cancelledLegs,
    completionEligible:
      snapshot.swapStatus === "in_progress" &&
      totalLegs > 0 &&
      fulfilledLegs === totalLegs &&
      !blocked,
    blocked,
  };
}

export function canActorConfirmLeg(
  leg: MultiUserLifecycleLeg,
  actorUserId: string,
  action: "sender_confirm" | "receiver_confirm",
): boolean {
  if (action === "sender_confirm") {
    return actorUserId === leg.fromUserId && leg.state === "reserved";
  }

  return actorUserId === leg.toUserId && leg.state === "sender_confirmed";
}
