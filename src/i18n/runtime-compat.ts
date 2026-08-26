type Messages = Record<string, unknown>;

function getPath(source: Messages, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return (value as Messages)[key];
  }, source);
}

function setPath(target: Messages, path: string, value: unknown): void {
  if (value === undefined) return;
  const parts = path.split(".");
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    const current = cursor[key];
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Messages;
  }
  cursor[parts[parts.length - 1]] = value;
}

function alias(target: Messages, source: Messages, to: string, from: string): void {
  if (getPath(target, to) !== undefined) return;
  setPath(target, to, getPath(source, from));
}

const CHAT_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["chat.agenda.title", "chatAgenda.title"],
  ["chat.agenda.you", "chatAgenda.you"],
  ["chat.agenda.generateSummary", "chatAgenda.generateSummary"],
  ["chat.agenda.generateSummaryHint", "chatAgenda.generateSummaryHint"],
  ["chat.agenda.progress", "chatAgenda.progress"],
  ["chat.agenda.sections.items", "chatAgenda.agendaGroupItems"],
  ["chat.agenda.sections.exchange", "chatAgenda.agendaGroupExchange"],
  ["chat.agenda.sections.bilateral", "chatAgenda.agendaGroupServices"],
  ["chat.agenda.sections.individual", "chatAgenda.agendaGroupLogistics"],
  ["chat.agenda.sections.final", "chatAgenda.agendaGroupCompletion"],
  ["chat.agenda.agendaItemADetails", "chatAgenda.agendaItemADetails"],
  ["chat.agenda.agendaItemAMedia", "chatAgenda.agendaItemAMedia"],
  ["chat.agenda.agendaItemBDetails", "chatAgenda.agendaItemBDetails"],
  ["chat.agenda.agendaItemBMedia", "chatAgenda.agendaItemBMedia"],
  ["chat.agenda.agendaExchangeMode", "chatAgenda.agendaExchangeMode"],
  ["chat.agenda.agendaLocation", "chatAgenda.agendaLocation"],
  ["chat.agenda.agendaPackaging", "chatAgenda.agendaPackaging"],
  ["chat.agenda.agendaEscrow", "chatAgenda.agendaEscrow"],
  ["chat.agenda.agendaInsurance", "chatAgenda.agendaInsurance"],
  ["chat.agenda.agendaTransportA", "chatAgenda.agendaTransportA"],
  ["chat.agenda.agendaTransportB", "chatAgenda.agendaTransportB"],
  ["chat.agenda.agendaAccommodationA", "chatAgenda.agendaAccommodationA"],
  ["chat.agenda.agendaAccommodationB", "chatAgenda.agendaAccommodationB"],
  ["chat.agenda.agendaRestaurant", "chatAgenda.agendaRestaurant"],
  ["chat.agenda.agendaInPerson", "chatAgenda.agendaInPerson"],
  ["chat.agenda.agendaDeliveryAddresses", "chatAgenda.agendaDeliveryAddresses"],
  ["chat.summary.title", "chatSummary.title"],
  ["chat.summary.itemA", "chatSummary.itemA"],
  ["chat.summary.itemB", "chatSummary.itemB"],
  ["chat.summary.escrow", "chatSummary.escrow"],
  ["chat.summary.insurance", "chatSummary.insurance"],
  ["chat.summary.inPerson", "chatSummary.inPerson"],
  ["chat.summary.youApproved", "chatSummary.youApproved"],
  ["chat.summary.waitingYou", "chatSummary.waitingYou"],
  ["chat.summary.approved", "chatSummary.approved"],
  ["chat.summary.waitingPartner", "chatSummary.waitingPartner"],
  ["chat.summary.approve", "chatSummary.approve"],
  ["chat.summary.goToExchange", "chatSummary.goToExchange"],
  ["chat.drawer.history", "chatDrawer.tabHistory"],
  ["chat.drawer.documents", "chatDrawer.tabDocuments"],
  ["chat.drawer.profile", "chatDrawer.tabProfile"],
  ["chat.drawer.agreements", "chatDrawer.tabAgreements"],
  ["chat.drawer.noHistory", "chatDrawer.noHistory"],
  ["chat.drawer.withSameUser", "chatDrawer.withSameUser"],
  ["chat.drawer.otherConversations", "chatDrawer.otherConversations"],
  ["chat.drawer.noDocuments", "chatDrawer.noDocuments"],
  ["chat.drawer.images", "chatDrawer.images"],
  ["chat.drawer.audio", "chatDrawer.audio"],
  ["chat.drawer.video", "chatDrawer.video"],
  ["chat.drawer.noProfile", "chatDrawer.noProfile"],
  ["chat.drawer.verifications", "chatDrawer.verifications"],
  ["chat.drawer.phone", "chatDrawer.phone"],
  ["chat.drawer.idVerified", "chatDrawer.idVerified"],
  ["chat.drawer.completedSwaps", "chatDrawer.completedSwaps"],
  ["chat.drawer.responseRate", "chatDrawer.responseRate"],
  ["chat.drawer.progress", "chatDrawer.progress"],
  ["chat.drawer.noMessages", "chatDrawer.noMessages"],
];

const MATCHING_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["matching.pageTitle", "match.pageTitle"],
  ["matching.score_detail", "match.scoreDetails"],
  ["matching.ignore", "match.ignore"],
  ["matching.express_interest", "match.expressInterest"],
  ["matching.map_title", "match.mapTitle"],
  ["matching.map_no_candidates", "match.noPins"],
  ["matching.ai_title", "match.aiTitle"],
  ["matching.ai_button", "match.aiButton"],
  ["matching.ai_loading", "match.aiLoading"],
  ["matching.ai_slots_full", "match.aiDisabledFull"],
  ["matching.selected_title", "match.selectedTitle"],
  ["matching.selected_empty", "match.noSelectedYet"],
  ["matching.selected_refuse", "match.refuse"],
  ["matching.selected_chat", "match.goToChat"],
];

export function applyLegacyI18nAliases(localeMessages: Messages): Messages {
  const result: Messages = structuredClone(localeMessages);
  for (const [to, from] of CHAT_ALIASES) alias(result, localeMessages, to, from);
  for (const [to, from] of MATCHING_ALIASES) alias(result, localeMessages, to, from);
  return result;
}
