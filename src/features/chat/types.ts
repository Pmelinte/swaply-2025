// src/features/chat/types.ts

// Un mesaj într-o conversație 1-la-1
export interface ChatMessage {
  id: string;
  matchId: string;      // conversația dintre doi useri
  senderId: string;     // user-ul care trimite mesajul
  content: string;      // textul mesajului
  createdAt: string;    // timestamp
}

// Payload pentru creare mesaj
export interface CreateMessageInput {
  matchId: string;
  content: string;
}

// Model pentru afișarea conversației în UI
export interface ChatThread {
  matchId: string;
  messages: ChatMessage[];
}

// Un "match" în UI (folosit și în listarea match-uri)
export interface MatchPreview {
  id: string;

  userAId: string;
  userBId: string;

  userAItemId: string | null;
  userBItemId: string | null;

  status: "pending" | "active" | "closed";

  createdAt: string;
  updatedAt: string;

  // pentru UI – numele interlocutorului, avatar, ultimul mesaj
  otherUserName?: string;
  otherUserAvatar?: string;

  lastMessage?: ChatMessage | null;
}
