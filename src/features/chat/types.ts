// src/features/chat/types.ts

export interface ChatMessage {
  id: string;
  matchId: string;        // legătura cu match-ul
  senderId: string;       // cine a trimis mesajul
  content: string;        // textul mesajului
  createdAt: string;      // timestamp ISO
}

export interface CreateMessageInput {
  matchId: string;
  content: string;
}

export interface ChatThread {
  matchId: string;
  messages: ChatMessage[];
}

export type MatchStatus = "pending" | "active" | "closed";

export interface MatchPreview {
  id: string;

  userAId: string;
  userBId: string;

  userAItemId: string | null;
  userBItemId: string | null;

  status: MatchStatus;

  createdAt: string;
  updatedAt: string;

  // UI helpers
  otherUserName?: string;
  otherUserAvatar?: string;

  lastMessage?: ChatMessage | null;
}
