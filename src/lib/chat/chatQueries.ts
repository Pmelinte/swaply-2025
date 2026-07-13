import type { SupabaseClient } from "@supabase/supabase-js";
import { moderateText } from "@/lib/moderation/moderationEngine";

export const MATCH_CONVERSATION_STAGES = [
  "interest",
  "condition",
  "offer",
  "logistics",
  "agreement",
] as const;

export const MATCH_AGREEMENT_LOGISTICS_METHODS = [
  "local_handover",
  "national_courier",
  "international_courier",
  "other",
] as const;

export type MatchConversationStage =
  (typeof MATCH_CONVERSATION_STAGES)[number];

export type MatchAgreementLogisticsMethod =
  (typeof MATCH_AGREEMENT_LOGISTICS_METHODS)[number];

export type MatchAgreementAction = "save" | "confirm" | "withdraw";

export type MatchConversationAgreement = {
  revision: number;
  condition_notes: string;
  offer_notes: string;
  logistics_method: MatchAgreementLogisticsMethod | null;
  logistics_notes: string;
  additional_terms: string;
  confirmed_by: string[];
  updated_by: string | null;
  updated_at: string | null;
};

export type MatchConversationAgendaState = {
  version: number;
  conversation_id: string | null;
  active_stage: MatchConversationStage;
  completed_stages: MatchConversationStage[];
  agreement: MatchConversationAgreement;
  updated_by: string | null;
  updated_at: string | null;
};

export type ConversationRow = {
  id: string;
  swap_id: string | null;
  match_id: string | null;
  participant_ids: string[];
  item_ids: string[];
  status: string | null;
  agenda_state: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type MessageRow = {
  id: string;
  swap_id: string | null;
  match_id: string | null;
  sender_id: string;
  recipient_id: string;
  content: string;
  attachments: unknown[] | null;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  is_read: boolean;
  conversation_id: string | null;
  message_type: string | null;
};

const CONVERSATION_SELECT =
  "id, swap_id, match_id, participant_ids, item_ids, status, agenda_state, created_at, updated_at";

const MESSAGE_SELECT =
  "id, swap_id, match_id, sender_id, recipient_id, content, attachments, read_at, metadata, created_at, is_read, conversation_id, message_type";

function isMatchConversationStage(
  value: unknown,
): value is MatchConversationStage {
  return (
    typeof value === "string" &&
    MATCH_CONVERSATION_STAGES.includes(value as MatchConversationStage)
  );
}

function isMatchAgreementLogisticsMethod(
  value: unknown,
): value is MatchAgreementLogisticsMethod {
  return (
    typeof value === "string" &&
    MATCH_AGREEMENT_LOGISTICS_METHODS.includes(
      value as MatchAgreementLogisticsMethod,
    )
  );
}

function agendaTimestamp(value: string | null): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function parseNonNegativeInteger(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

function parseAgreementText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseMatchConversationAgreement(
  value: unknown,
): MatchConversationAgreement {
  const agreement =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    revision: parseNonNegativeInteger(agreement.revision),
    condition_notes: parseAgreementText(agreement.condition_notes),
    offer_notes: parseAgreementText(agreement.offer_notes),
    logistics_method: isMatchAgreementLogisticsMethod(
      agreement.logistics_method,
    )
      ? agreement.logistics_method
      : null,
    logistics_notes: parseAgreementText(agreement.logistics_notes),
    additional_terms: parseAgreementText(agreement.additional_terms),
    confirmed_by: Array.isArray(agreement.confirmed_by)
      ? Array.from(
          new Set(
            agreement.confirmed_by.filter(
              (entry): entry is string => typeof entry === "string",
            ),
          ),
        )
      : [],
    updated_by:
      typeof agreement.updated_by === "string"
        ? agreement.updated_by
        : null,
    updated_at:
      typeof agreement.updated_at === "string"
        ? agreement.updated_at
        : null,
  };
}

export function parseMatchConversationAgenda(
  value: Record<string, unknown> | null | undefined,
): MatchConversationAgendaState {
  const activeStage = isMatchConversationStage(value?.active_stage)
    ? value.active_stage
    : "interest";
  const completedStages = Array.isArray(value?.completed_stages)
    ? Array.from(
        new Set(
          value.completed_stages.filter(isMatchConversationStage),
        ),
      )
    : [];
  const parsedVersion = Number(value?.version);
  const version =
    Number.isFinite(parsedVersion) && parsedVersion >= 1
      ? Math.trunc(parsedVersion)
      : 1;

  return {
    version,
    conversation_id:
      typeof value?.conversation_id === "string"
        ? value.conversation_id
        : null,
    active_stage: activeStage,
    completed_stages: completedStages,
    agreement: parseMatchConversationAgreement(value?.agreement),
    updated_by:
      typeof value?.updated_by === "string" ? value.updated_by : null,
    updated_at:
      typeof value?.updated_at === "string" ? value.updated_at : null,
  };
}

export function hasMatchConversationAgreementContent(
  agreement: MatchConversationAgreement,
): boolean {
  return Boolean(
    agreement.condition_notes.trim() ||
      agreement.offer_notes.trim() ||
      agreement.logistics_method ||
      agreement.logistics_notes.trim() ||
      agreement.additional_terms.trim(),
  );
}

export function isMatchConversationAgreementConfirmedByBoth(
  agreement: MatchConversationAgreement,
  participantIds: string[],
): boolean {
  return (
    participantIds.length === 2 &&
    participantIds.every((participantId) =>
      agreement.confirmed_by.includes(participantId),
    )
  );
}

export function shouldApplyMatchConversationAgenda(
  current: MatchConversationAgendaState,
  next: MatchConversationAgendaState,
): boolean {
  const currentTimestamp = agendaTimestamp(current.updated_at);
  const nextTimestamp = agendaTimestamp(next.updated_at);

  if (nextTimestamp === null) return currentTimestamp === null;
  if (currentTimestamp === null) return true;
  return nextTimestamp >= currentTimestamp;
}

export async function fetchUserConversations(
  supabase: SupabaseClient,
  userId: string,
): Promise<ConversationRow[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .contains("participant_ids", [userId])
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("fetchUserConversations failed", error);
    return [];
  }

  return (data ?? []) as ConversationRow[];
}

export async function fetchConversationById(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<ConversationRow | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error("fetchConversationById failed", error);
    return null;
  }

  return (data as ConversationRow | null) ?? null;
}

export async function fetchConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("fetchConversationMessages failed", error);
    return [];
  }

  return (data ?? []) as MessageRow[];
}

export async function updateMatchConversationAgenda(
  supabase: SupabaseClient,
  input: {
    conversationId: string;
    stage: MatchConversationStage;
    completed?: boolean | null;
  },
): Promise<MatchConversationAgendaState | null> {
  const { data, error } = await supabase.rpc(
    "update_match_conversation_agenda",
    {
      p_conversation_id: input.conversationId,
      p_stage: input.stage,
      p_completed: input.completed ?? null,
    },
  );

  if (error) {
    console.error("updateMatchConversationAgenda failed", error);
    return null;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    console.error("updateMatchConversationAgenda returned invalid data", data);
    return null;
  }

  return parseMatchConversationAgenda(data as Record<string, unknown>);
}

export async function updateMatchConversationAgreement(
  supabase: SupabaseClient,
  input: {
    conversationId: string;
    action: MatchAgreementAction;
    expectedRevision: number;
    agreement?: Pick<
      MatchConversationAgreement,
      | "condition_notes"
      | "offer_notes"
      | "logistics_method"
      | "logistics_notes"
      | "additional_terms"
    >;
  },
): Promise<MatchConversationAgendaState | null> {
  const { data, error } = await supabase.rpc(
    "update_match_conversation_agreement",
    {
      p_conversation_id: input.conversationId,
      p_action: input.action,
      p_expected_revision: input.expectedRevision,
      p_payload: input.agreement ?? {},
    },
  );

  if (error) {
    console.error("updateMatchConversationAgreement failed", error);
    return null;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    console.error(
      "updateMatchConversationAgreement returned invalid data",
      data,
    );
    return null;
  }

  return parseMatchConversationAgenda(data as Record<string, unknown>);
}

export async function sendConversationMessage(
  supabase: SupabaseClient,
  input: {
    conversation: ConversationRow;
    senderId: string;
    content: string;
  },
): Promise<MessageRow | null> {
  const recipientId = input.conversation.participant_ids.find(
    (id) => id !== input.senderId,
  );
  const content = input.content.trim();
  const isMatchConversation = Boolean(input.conversation.match_id);

  if (
    !recipientId ||
    content.length === 0 ||
    content.length > 4000 ||
    (!input.conversation.swap_id && !input.conversation.match_id)
  ) {
    return null;
  }

  const moderation = isMatchConversation ? null : moderateText(content);
  if (moderation?.recommended_action === "block") {
    console.error("Blocked moderated message", moderation);
    return null;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      swap_id: input.conversation.swap_id,
      match_id: input.conversation.match_id,
      sender_id: input.senderId,
      recipient_id: recipientId,
      content,
      conversation_id: input.conversation.id,
      message_type: "text",
      metadata: isMatchConversation
        ? {
            source: "match_conversation",
          }
        : {
            source: "chat_page",
            moderation,
          },
      is_read: false,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) {
    console.error("sendConversationMessage failed", error);
    return null;
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversation.id);

  if (!isMatchConversation && input.conversation.swap_id && moderation) {
    await supabase.from("notifications").insert({
      user_id: recipientId,
      type: moderation.risk_score >= 30 ? "message_flagged" : "message",
      title:
        moderation.risk_score >= 30
          ? "Potentially risky message"
          : "New Swaply message",
      body: content.slice(0, 140),
      data: {
        conversation_id: input.conversation.id,
        swap_id: input.conversation.swap_id,
        message_id: data.id,
        moderation,
      },
      read: false,
      is_read: false,
      priority: moderation.risk_score >= 50 ? "high" : "normal",
    });

    if (moderation.risk_score >= 50) {
      await supabase.from("notifications").insert({
        user_id: input.senderId,
        type: "trust_warning",
        title: "Message flagged by safety systems",
        body: "Your recent message triggered Swaply safety checks.",
        data: {
          conversation_id: input.conversation.id,
          moderation,
        },
        read: false,
        is_read: false,
        priority: "high",
      });
    }
  }

  return data as MessageRow;
}
