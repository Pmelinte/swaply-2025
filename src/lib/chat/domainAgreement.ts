export const MATCH_AGREEMENT_DOMAINS = [
  "object",
  "property",
  "service",
  "event",
] as const;

export type MatchAgreementDomain =
  (typeof MATCH_AGREEMENT_DOMAINS)[number];

export type PropertyAgreementTerms = {
  period_start: string;
  period_end: string;
  timezone: string;
  exchange_mode: "simultaneous" | "non_simultaneous" | "vacation_handoff";
  guests: number;
  rules: string;
  security_deposit_eur: number;
  insurance_confirmed: boolean;
  check_in_time: string;
  check_out_time: string;
  handover_notes: string;
};

export type ServiceAgreementTerms = {
  delivery_mode: "remote" | "physical" | "hybrid";
  timezone: string;
  deliverables: string[];
  duration_hours: number;
  duration_days: number;
  deadline_at: string;
  milestones: string[];
  acceptance_criteria: string;
  no_show_terms: string;
  cancellation_terms: string;
  dispute_terms: string;
};

export type EventAgreementTerms = {
  quantity: number;
  transferable: boolean;
  issuer_rule_confirmed: boolean;
  issuer_rule_source: string;
  transfer_deadline_at: string;
  bundle: {
    ticket: boolean;
    accommodation: boolean;
    transport: boolean;
  };
  proof_required: boolean;
  transfer_notes: string;
};

export type MatchAgreementDomainTerm =
  | {
      item_id: string;
      domain: "property";
      terms: PropertyAgreementTerms;
    }
  | {
      item_id: string;
      domain: "service";
      terms: ServiceAgreementTerms;
    }
  | {
      item_id: string;
      domain: "event";
      terms: EventAgreementTerms;
    };

export type MatchAgreementItemContext = {
  item_id: string;
  owner_id: string;
  domain: MatchAgreementDomain;
  title: string;
  defaults: Record<string, unknown>;
};

export type MatchAgreementContext = {
  conversation_id: string;
  items: MatchAgreementItemContext[];
};

export type MatchAgreementConfirmation = {
  revision: number;
  content_hash: string;
  confirmed_at: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function integer(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isDomain(value: unknown): value is MatchAgreementDomain {
  return (
    typeof value === "string" &&
    MATCH_AGREEMENT_DOMAINS.includes(value as MatchAgreementDomain)
  );
}

function parsePropertyTerms(value: unknown): PropertyAgreementTerms {
  const terms = record(value);
  const exchangeMode = terms.exchange_mode;

  return {
    period_start: text(terms.period_start),
    period_end: text(terms.period_end),
    timezone: text(terms.timezone, "UTC"),
    exchange_mode:
      exchangeMode === "non_simultaneous" ||
      exchangeMode === "vacation_handoff"
        ? exchangeMode
        : "simultaneous",
    guests: Math.max(1, integer(terms.guests, 1)),
    rules: text(terms.rules),
    security_deposit_eur: Math.max(
      0,
      numberValue(terms.security_deposit_eur),
    ),
    insurance_confirmed: booleanValue(terms.insurance_confirmed),
    check_in_time: text(terms.check_in_time, "15:00"),
    check_out_time: text(terms.check_out_time, "11:00"),
    handover_notes: text(terms.handover_notes),
  };
}

function parseServiceTerms(value: unknown): ServiceAgreementTerms {
  const terms = record(value);
  const deliveryMode = terms.delivery_mode;

  return {
    delivery_mode:
      deliveryMode === "remote" || deliveryMode === "physical"
        ? deliveryMode
        : "hybrid",
    timezone: text(terms.timezone, "UTC"),
    deliverables: strings(terms.deliverables),
    duration_hours: Math.max(0, integer(terms.duration_hours)),
    duration_days: Math.max(0, integer(terms.duration_days)),
    deadline_at: text(terms.deadline_at),
    milestones: strings(terms.milestones),
    acceptance_criteria: text(terms.acceptance_criteria),
    no_show_terms: text(terms.no_show_terms),
    cancellation_terms: text(terms.cancellation_terms),
    dispute_terms: text(terms.dispute_terms),
  };
}

function parseEventTerms(value: unknown): EventAgreementTerms {
  const terms = record(value);
  const bundle = record(terms.bundle);

  return {
    quantity: Math.max(1, integer(terms.quantity, 1)),
    transferable: booleanValue(terms.transferable),
    issuer_rule_confirmed: booleanValue(terms.issuer_rule_confirmed),
    issuer_rule_source: text(terms.issuer_rule_source),
    transfer_deadline_at: text(terms.transfer_deadline_at),
    bundle: {
      ticket: booleanValue(bundle.ticket, true),
      accommodation: booleanValue(bundle.accommodation),
      transport: booleanValue(bundle.transport),
    },
    proof_required: booleanValue(terms.proof_required, true),
    transfer_notes: text(terms.transfer_notes),
  };
}

export function parseMatchAgreementDomainTerms(
  value: unknown,
): MatchAgreementDomainTerm[] {
  if (!Array.isArray(value)) return [];

  const result: MatchAgreementDomainTerm[] = [];
  const seen = new Set<string>();

  for (const entryValue of value) {
    const entry = record(entryValue);
    const itemId = text(entry.item_id);
    const domain = entry.domain;
    if (!itemId || seen.has(itemId)) continue;

    if (domain === "property") {
      result.push({
        item_id: itemId,
        domain,
        terms: parsePropertyTerms(entry.terms),
      });
      seen.add(itemId);
    } else if (domain === "service") {
      result.push({
        item_id: itemId,
        domain,
        terms: parseServiceTerms(entry.terms),
      });
      seen.add(itemId);
    } else if (domain === "event") {
      result.push({
        item_id: itemId,
        domain,
        terms: parseEventTerms(entry.terms),
      });
      seen.add(itemId);
    }
  }

  return result;
}

export function parseMatchAgreementContext(
  value: unknown,
): MatchAgreementContext | null {
  const context = record(value);
  const conversationId = text(context.conversation_id);
  if (!conversationId || !Array.isArray(context.items)) return null;

  const items: MatchAgreementItemContext[] = [];
  for (const itemValue of context.items) {
    const item = record(itemValue);
    const itemId = text(item.item_id);
    const ownerId = text(item.owner_id);
    const domain = item.domain;
    const title = text(item.title);
    if (!itemId || !ownerId || !title || !isDomain(domain)) continue;

    items.push({
      item_id: itemId,
      owner_id: ownerId,
      domain,
      title,
      defaults: record(item.defaults),
    });
  }

  return items.length === 2
    ? { conversation_id: conversationId, items }
    : null;
}

export function buildDomainTermsFromContext(
  context: MatchAgreementContext | null,
  savedTerms: MatchAgreementDomainTerm[] = [],
): MatchAgreementDomainTerm[] {
  if (!context) return savedTerms;
  const savedByItem = new Map(savedTerms.map((entry) => [entry.item_id, entry]));

  return context.items.flatMap((item): MatchAgreementDomainTerm[] => {
    if (item.domain === "object") return [];
    const saved = savedByItem.get(item.item_id);
    if (saved && saved.domain === item.domain) return [saved];

    if (item.domain === "property") {
      return [
        {
          item_id: item.item_id,
          domain: "property",
          terms: parsePropertyTerms(item.defaults),
        },
      ];
    }
    if (item.domain === "service") {
      return [
        {
          item_id: item.item_id,
          domain: "service",
          terms: parseServiceTerms(item.defaults),
        },
      ];
    }
    return [
      {
        item_id: item.item_id,
        domain: "event",
        terms: parseEventTerms(item.defaults),
      },
    ];
  });
}

export function domainTermsAreComplete(
  context: MatchAgreementContext | null,
  terms: MatchAgreementDomainTerm[],
): boolean {
  if (!context) return false;
  const termsByItem = new Map(terms.map((entry) => [entry.item_id, entry]));

  return context.items.every((item) => {
    if (item.domain === "object") return true;
    const entry = termsByItem.get(item.item_id);
    if (!entry || entry.domain !== item.domain) return false;

    if (entry.domain === "property") {
      const value = entry.terms;
      return Boolean(
        value.period_start &&
          value.period_end &&
          value.timezone &&
          value.guests >= 1 &&
          value.rules.trim() &&
          value.check_in_time &&
          value.check_out_time &&
          value.handover_notes.trim(),
      );
    }

    if (entry.domain === "service") {
      const value = entry.terms;
      return Boolean(
        value.timezone &&
          value.deliverables.length > 0 &&
          (value.duration_hours > 0 || value.duration_days > 0) &&
          value.deadline_at &&
          value.milestones.length > 0 &&
          value.acceptance_criteria.trim() &&
          value.no_show_terms.trim() &&
          value.cancellation_terms.trim() &&
          value.dispute_terms.trim(),
      );
    }

    const value = entry.terms;
    return Boolean(
      value.quantity >= 1 &&
        value.transferable &&
        value.issuer_rule_confirmed &&
        value.issuer_rule_source.trim() &&
        value.transfer_deadline_at &&
        (value.bundle.ticket ||
          value.bundle.accommodation ||
          value.bundle.transport) &&
        value.proof_required &&
        value.transfer_notes.trim(),
    );
  });
}

export function linesToList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function listToLines(value: string[]): string {
  return value.join("\n");
}
