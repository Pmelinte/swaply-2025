/**
 * Agenda state management for structured swap negotiation.
 *
 * Each agenda item can be bilateral (both must agree) or individual.
 * Status per user: unchecked → in_discussion → agreed
 */

export type AgendaStatus = "unchecked" | "in_discussion" | "agreed";

export interface AgendaItemDef {
  key: string;
  group: string;
  bilateral: boolean;
  labelKey: string;
}

export interface AgendaItemState {
  userA: AgendaStatus;
  userB: AgendaStatus;
  bilateral: boolean;
}

export type AgendaState = Record<string, AgendaItemState>;

// ── Agenda definition ──

export type AgendaGroup = "items" | "exchange" | "bilateral" | "individual" | "final";

export const AGENDA_ITEMS: AgendaItemDef[] = [
  // Group 1: Items
  { key: "item_a_details",  group: "items",      bilateral: false, labelKey: "agendaItemADetails" },
  { key: "item_a_media",    group: "items",      bilateral: false, labelKey: "agendaItemAMedia" },
  { key: "item_b_details",  group: "items",      bilateral: false, labelKey: "agendaItemBDetails" },
  { key: "item_b_media",    group: "items",      bilateral: false, labelKey: "agendaItemBMedia" },
  // Group 2: Exchange
  { key: "exchange_mode",   group: "exchange",   bilateral: true,  labelKey: "agendaExchangeMode" },
  { key: "location",        group: "exchange",   bilateral: true,  labelKey: "agendaLocation" },
  { key: "packaging",       group: "exchange",   bilateral: true,  labelKey: "agendaPackaging" },
  // Group 3: Bilateral (both must agree)
  { key: "escrow",          group: "bilateral",  bilateral: true,  labelKey: "agendaEscrow" },
  { key: "insurance",       group: "bilateral",  bilateral: true,  labelKey: "agendaInsurance" },
  // Group 4: Individual
  { key: "transport_a",     group: "individual", bilateral: false, labelKey: "agendaTransportA" },
  { key: "transport_b",     group: "individual", bilateral: false, labelKey: "agendaTransportB" },
  { key: "accommodation_a", group: "individual", bilateral: false, labelKey: "agendaAccommodationA" },
  { key: "accommodation_b", group: "individual", bilateral: false, labelKey: "agendaAccommodationB" },
  { key: "restaurant",      group: "individual", bilateral: false, labelKey: "agendaRestaurant" },
  // Group 5: Final
  { key: "in_person",       group: "final",      bilateral: true,  labelKey: "agendaInPerson" },
  { key: "delivery_addrs",  group: "final",      bilateral: true,  labelKey: "agendaDeliveryAddresses" },
];

export const BILATERAL_REQUIRED = AGENDA_ITEMS
  .filter((i) => i.bilateral)
  .map((i) => i.key);

/** Build the initial agenda state (all unchecked). */
export function buildInitialAgenda(): AgendaState {
  const state: AgendaState = {};
  for (const item of AGENDA_ITEMS) {
    state[item.key] = { userA: "unchecked", userB: "unchecked", bilateral: item.bilateral };
  }
  return state;
}

/** Advance the status of an item for a user (unchecked → in_discussion → agreed). */
export function advanceAgendaItem(
  state: AgendaState,
  key: string,
  side: "userA" | "userB",
): AgendaState {
  const current = state[key];
  if (!current) return state;

  const nextStatus: Record<AgendaStatus, AgendaStatus> = {
    unchecked: "in_discussion",
    in_discussion: "agreed",
    agreed: "agreed",
  };

  return {
    ...state,
    [key]: { ...current, [side]: nextStatus[current[side]] },
  };
}

/** Set an exact status value for an item/side (used for direct checkbox toggle). */
export function setAgendaItemStatus(
  state: AgendaState,
  key: string,
  side: "userA" | "userB",
  status: AgendaStatus,
): AgendaState {
  const current = state[key];
  if (!current) return state;
  return { ...state, [key]: { ...current, [side]: status } };
}

/** Check if an item is fully agreed (both sides = agreed for bilateral, or side = agreed for unilateral). */
export function isItemAgreed(state: AgendaState, key: string, myRole: "userA" | "userB"): boolean {
  const item = state[key];
  if (!item) return false;
  if (item.bilateral) return item.userA === "agreed" && item.userB === "agreed";
  return item[myRole] === "agreed";
}

/** Count agreed bilateral items out of total bilateral. */
export function agendaProgress(state: AgendaState): { agreed: number; total: number } {
  const required = BILATERAL_REQUIRED;
  const agreed = required.filter((k) => {
    const item = state[k];
    return item && item.userA === "agreed" && item.userB === "agreed";
  }).length;
  return { agreed, total: required.length };
}

/** Are all required (bilateral) items fully agreed? */
export function allRequiredAgreed(state: AgendaState): boolean {
  const { agreed, total } = agendaProgress(state);
  return agreed === total;
}
