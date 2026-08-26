type Messages = Record<string, unknown>;

const UNSAFE_PATH_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

function safePathParts(path: string): string[] | null {
  const parts = path.split(".");
  return parts.some((part) => UNSAFE_PATH_SEGMENTS.has(part)) ? null : parts;
}

function getPath(source: Messages, path: string): unknown {
  const parts = safePathParts(path);
  if (!parts) return undefined;

  return parts.reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return Object.prototype.hasOwnProperty.call(value, key)
      ? (value as Messages)[key]
      : undefined;
  }, source);
}

function setPath(target: Messages, path: string, value: unknown): void {
  if (value === undefined) return;
  const parts = safePathParts(path);
  if (!parts || parts.length === 0) return;

  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    const current = cursor[key];
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      cursor[key] = Object.create(null) as Messages;
    }
    cursor = cursor[key] as Messages;
  }
  cursor[parts[parts.length - 1]] = value;
}

function alias(target: Messages, source: Messages, to: string, from: string): void {
  if (getPath(target, to) !== undefined) return;
  setPath(target, to, getPath(source, from));
}

function repairKnownIcuDebt(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replaceAll("{oggetto}", "{item}")
      .replaceAll("{skupno}", "{total}")
      .replaceAll("{trenutni}", "{current}");
  }
  if (Array.isArray(value)) return value.map(repairKnownIcuDebt);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Messages).map(([key, child]) => [
        key,
        repairKnownIcuDebt(child),
      ]),
    );
  }
  return value;
}

const GENERAL_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["common.apply", "explore.filterDrawer.apply"],
  ["common.saved", "savedSearches.searchSaved"],
];

const CHAT_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["chat.inbox.title", "chat.conversations"],
  ["chat.inbox.empty", "chat.noConversations"],
  ["chat.inbox.lastMessage", "nav.messages"],
  ["chat.page.back", "common.back"],
  ["chat.page.online", "chat.on"],
  ["chat.page.offline", "chat.off"],
  ["chat.input.placeholder", "chat.writeMessage"],
  ["chat.input.send", "common.send"],
  ["chat.input.loginRequired", "chat.signInRequired"],
  ["chat.message.you", "chat.you"],
  ["chat.message.read", "chat.readReceipt"],
  ["chat.message.delivered", "chat.delivered"],
  ["chat.moderation", "chat.moderated"],
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
  ["chat.agenda.status.unchecked", "common.loading"],
  ["chat.agenda.status.in_discussion", "chat.pendingItems"],
  ["chat.agenda.status.agreed", "chat.agreedItems"],
  ["chat.agenda.bilateral.youAgreed", "chatSummary.youApproved"],
  ["chat.agenda.bilateral.waitingFor", "chatSummary.waitingPartner"],
  ["chat.agenda.summaryDisabled", "chat.aiSummaryDesc"],
  ["chat.agenda.approveSummary", "chatSummary.approve"],
  ["chat.agenda.approved", "chatSummary.approved"],
  ["chat.agenda.waitingApproval", "chatSummary.waitingYou"],
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
  ["chat.summary.exchangeMode", "exchangePage.exchangeMode"],
  ["chat.summary.location", "exchangePage.location"],
  ["chat.summary.services", "exchangePage.servicesTitle"],
  ["chat.summary.date", "exchangePage.agreedDate"],
  ["chat.summary.youApproved", "chatSummary.youApproved"],
  ["chat.summary.waitingYou", "chatSummary.waitingYou"],
  ["chat.summary.approved", "chatSummary.approved"],
  ["chat.summary.approvedSuffix", "chatSummary.approved"],
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
  ["matching.slot_add", "match.addObject"],
  ["matching.slot_loading", "common.loading"],
  ["matching.slot_remove_confirm", "common.delete"],
  ["matching.slot_avg_score", "match.cumulativeScore"],
  ["matching.browse_no_slot_banner", "match.addObjectDescription"],
  ["matching.browse_general_title", "nav.objects"],
  ["matching.browse_load_more", "matchList.loadMore"],
  ["matching.sort_relevant", "match.sortScore"],
  ["matching.sort_newest", "myObjects.sortNewest"],
  ["matching.sort_value_asc", "objectDetail.perceivedValue"],
  ["matching.sort_value_desc", "objectDetail.perceivedValue"],
  ["matching.score_detail", "matchList.scoreBreakdown"],
  ["matching.score_category", "matchList.factor_category"],
  ["matching.score_value", "matchList.factor_value"],
  ["matching.score_geo", "matchList.factor_location"],
  ["matching.score_trust", "trustScore.trustScoreTitle"],
  ["matching.score_activity", "matchList.factor_activity"],
  ["matching.score_total", "matchList.totalScore"],
  ["matching.ignore", "matchList.reasonSkip"],
  ["matching.express_interest", "matchList.accept"],
  ["matching.map_title", "match.mapProposals"],
  ["matching.map_no_candidates", "match.noMatchesNow"],
  ["matching.map_you_are_here", "match.yourLocation"],
  ["matching.ai_title", "match.autoModeTitle"],
  ["matching.ai_button", "match.autoModeTitle"],
  ["matching.ai_loading", "match.analyzingCompatibility"],
  ["matching.ai_badge", "match.autoModeTitle"],
  ["matching.ai_other", "match.manualModeTitle"],
  ["matching.ai_no_slot", "match.addObjectDescription"],
  ["matching.ai_slots_full", "match.noMatchesNow"],
  ["matching.selected_title", "matchList.swapProposal"],
  ["matching.selected_empty", "match.noMatchesNow"],
  ["matching.selected_refuse", "matchList.reject"],
  ["matching.selected_chat", "matchList.sendMessage"],
  ["matching.chat_coming_soon", "matchList.sendMessage"],
  ["matching.filter_i_offer", "matchList.iOffer"],
  ["matching.filter_i_seek", "matchList.iGet"],
  ["matching.filter_save", "savedSearches.saveSearch"],
  ["matching.filter_save_btn", "savedSearches.saveAlert"],
  ["matching.filter_notify", "notificationSettings.type_match_new_desc"],
  ["matching.filter_distance", "match.maxDistance"],
  ["matching.filter_category", "match.sortCategory"],
  ["matching.filter_type", "match.swapTypeFilter"],
  ["matching.filter_cross_category", "match.flexible"],
];

export function applyLegacyI18nAliases(localeMessages: Messages): Messages {
  const repaired = repairKnownIcuDebt(localeMessages) as Messages;
  const result: Messages = structuredClone(repaired);
  for (const [to, from] of GENERAL_ALIASES) alias(result, repaired, to, from);
  for (const [to, from] of CHAT_ALIASES) alias(result, repaired, to, from);
  for (const [to, from] of MATCHING_ALIASES) alias(result, repaired, to, from);
  return result;
}
