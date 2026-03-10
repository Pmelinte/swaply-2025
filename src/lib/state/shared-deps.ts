/**
 * Shared dependencies passed to each state slice hook.
 * Keeps the interface DRY across all slice hooks.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";
import type {
  Item,
  Notification,
  SwapIntent,
  Conversation,
  UserProfile,
  ChatMessage,
} from "../types";

export interface SharedDeps {
  user: UserProfile | null;
  userRef: React.MutableRefObject<UserProfile | null>;
  dataSource: "supabase" | "mock";
  supabase: SupabaseClient | null;
  supabaseConfigured: boolean;
  setLastError: Dispatch<SetStateAction<string | null>>;
  setUser: Dispatch<SetStateAction<UserProfile | null>>;
  setItems: Dispatch<SetStateAction<Item[]>>;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  setSwaps: Dispatch<SetStateAction<SwapIntent[]>>;
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  items: Item[];
  swaps: SwapIntent[];
  conversations: Conversation[];
  notifications: Notification[];
  sendAuditLog: (params: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
  }) => void;
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
  mapItem: (row: Partial<Item> & Record<string, unknown>) => Item;
  mapMessage: (row: Partial<ChatMessage> & Record<string, unknown>) => ChatMessage;
  mapSwapIntent: (row: Partial<SwapIntent> & Record<string, unknown>) => SwapIntent;
  mapProfile: (data: Partial<UserProfile> & Record<string, unknown>) => UserProfile;
}
