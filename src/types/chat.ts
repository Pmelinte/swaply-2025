export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "system"
  | "agenda_update"
  | "summary";

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  message_type: MessageType;
  media_url?: string;
  media_type?: string;
  translation_cache: Record<string, string>;
  moderation_status: string;
  read_by: string[];
  created_at: string;
}

export type ConversationStatus = "active" | "agreed" | "cancelled" | "completed";

export interface Conversation {
  id: string;
  swap_id?: string;
  participant_ids: string[];
  item_ids: string[];
  status: ConversationStatus;
  agenda_state: Record<string, unknown>;
  summary?: Record<string, unknown>;
  summary_approved_by?: string[];
  created_at: string;
  updated_at: string;
}
