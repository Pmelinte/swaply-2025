/**
 * Generate a structured swap summary from the agenda state.
 * The summary is stored as JSONB in conversations.summary.
 */

import type { AgendaState } from "./chatAgenda";
import { isItemAgreed, AGENDA_ITEMS } from "./chatAgenda";
import type { Item } from "../types";

export interface SwapSummary {
  generatedAt: string;
  swapTitle: string;
  itemA: { id: string; title: string; owner: string };
  itemB: { id: string; title: string; owner: string };
  agreedItems: string[];
  pendingItems: string[];
  services: {
    escrow: boolean;
    insurance: boolean;
  };
  logistics: {
    exchangeMode: boolean;
    location: boolean;
    inPerson: boolean;
    deliveryAddresses: boolean;
  };
  approvedBy: string[];
}

/**
 * Build a summary object from the current agenda state.
 */
export function buildSummary(
  agendaState: AgendaState,
  itemA: Item,
  itemB: Item,
  userAName: string,
  userBName: string,
  myRole: "userA" | "userB",
): SwapSummary {
  const agreedItems: string[] = [];
  const pendingItems: string[] = [];

  for (const def of AGENDA_ITEMS) {
    if (isItemAgreed(agendaState, def.key, myRole)) {
      agreedItems.push(def.key);
    } else {
      pendingItems.push(def.key);
    }
  }

  const nameA = userAName.split(" ")[0] ?? userAName;
  const nameB = userBName.split(" ")[0] ?? userBName;

  // Deduplicate title if names are the same
  const swapTitle =
    nameA !== nameB
      ? `${itemA.title} (${nameA}) ↔ ${itemB.title} (${nameB})`
      : `${itemA.title} (${userAName}) ↔ ${itemB.title} (${userBName})`;

  return {
    generatedAt: new Date().toISOString(),
    swapTitle,
    itemA: { id: itemA.id, title: itemA.title, owner: userAName },
    itemB: { id: itemB.id, title: itemB.title, owner: userBName },
    agreedItems,
    pendingItems,
    services: {
      escrow: isItemAgreed(agendaState, "escrow", myRole),
      insurance: isItemAgreed(agendaState, "insurance", myRole),
    },
    logistics: {
      exchangeMode: isItemAgreed(agendaState, "exchange_mode", myRole),
      location: isItemAgreed(agendaState, "location", myRole),
      inPerson: isItemAgreed(agendaState, "in_person", myRole),
      deliveryAddresses: isItemAgreed(agendaState, "delivery_addrs", myRole),
    },
    approvedBy: [],
  };
}

/**
 * Add a user's approval to the summary.
 */
export function approveSummary(
  summary: SwapSummary,
  userId: string,
): SwapSummary {
  if (summary.approvedBy.includes(userId)) return summary;
  return { ...summary, approvedBy: [...summary.approvedBy, userId] };
}

/**
 * Check if both participants have approved.
 */
export function isSummaryFullyApproved(
  summary: SwapSummary,
  participantIds: [string, string],
): boolean {
  return participantIds.every((id) => summary.approvedBy.includes(id));
}
