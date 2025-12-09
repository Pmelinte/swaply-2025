// src/features/chat/types.ts

/**
 * Mesaj într-o conversație (match 1-la-1)
 */
export interface ChatMessage {
  id: string;
  matchId: string;          // identificatorul conversației (match)
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
  matchId: string;
  content: string;
}

/**
 * Reprezentarea completă a firului de conversație într-un match.
 */
export interface ChatThread {
  matchId: string;
  messages: ChatMessage[];

  // Optional – pentru pagination
  hasMore?: boolean;
  nextCursor?: string;
}

/**
 * Preview pentru lista de match-uri (folosit în UI).
 */
export interface MatchPreview {
  id: string;

  userAId: string;
  userBId: string;

  userAItemId: string | null;
  userBItemId: string | null;

  status: "pending" | "active" | "closed";

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
export interface CreateMatchInput {
  userAId: string;
  userBId: string;

  userAItemId?: string | null;
  userBItemId?: string | null;
}
