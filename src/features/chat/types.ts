// src/features/chat/types.ts

/**
 * Mesaj într-o conversație (match 1-la-1)
 */
export interface ChatMessage {
  id: string;
  swapId: string;          // identificatorul conversației (swap)
  senderId: string;         // cine trimite
  content: string;          // textul mesajului
  createdAt: string;        // timestamp ISO

  // Optional – pentru funcționalități moderne:
  status?: "sent" | "delivered" | "read";
  metadata?: Record<string, any>;
}

/**
 * Payload folosit la crearea unui mesaj nou.
 */
export interface CreateMessageInput {
  swapId: string;
  content: string;
}

/**
 * Reprezentarea completă a firului de conversație într-un match.
 */
export interface ChatThread {
  swapId: string;
  messages: ChatMessage[];

  // Optional – pentru pagination
  hasMore?: boolean;
  nextCursor?: string;
}

/**
 * Preview pentru lista de match-uri (folosit în UI).
 */
export interface SwapPreview {
  id: string;

  fromUserId: string;
  toUserId: string;

  fromItemId: string | null;
  toItemId: string | null;

  status: "pending" | "accepted" | "rejected" | "complete" | "cancelled";

  createdAt: string;
  updatedAt: string;

  // Date pentru UI
  otherUserName?: string;
  otherUserAvatar?: string;

  lastMessage?: ChatMessage | null;

  // Optional – pentru afișări viitoare (ex: unread count)
  unreadCount?: number;
}

/**
 * Structură pentru creare de match nou (opțional util în backend).
 */
export interface CreateSwapInput {
  fromUserId: string;
  toUserId: string;

  fromItemId?: string | null;
  toItemId?: string | null;
}
