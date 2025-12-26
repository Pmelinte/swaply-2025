export type BadgeTier = "free" | "premium" | "platinum";

export type LanguageCode = "ro" | "en" | "es";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  avatarUrl?: string;
  bio?: string;
  languages: LanguageCode[];
  badge: BadgeTier;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    postalCode?: string;
    coordinates?: { lat: number; lng: number };
    travelRadiusKm?: number;
  };
  visibility: {
    publicProfile: boolean;
    itemsVisibility: "public" | "match_only";
    showExactLocation: boolean;
    showLastSeen: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    chat: boolean;
    matches: boolean;
    swapUpdates: boolean;
  };
  swapPreferences: {
    logistics: "in_person" | "courier" | "flexible";
    notes?: string;
  };
  security: {
    twoFactorEnabled: boolean;
    method: "totp" | "sms" | "passkey" | null;
    passkeysEnabled: boolean;
  };
  stats: {
    tokens: number;
    reputation: "starter" | "trusted" | "ambassador";
    completedSwaps: number;
    activeListings: number;
  };
}

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  condition: "new" | "good" | "used";
  description: string;
  wishlist: string;
  status: "active" | "reserved" | "swapped";
  isDemo?: boolean;
  isActive: boolean;
  createdAt: string;
  location: string;
  aiSuggestedTags?: string[];
  userFinalTags?: string[];
  photos: string[];
}

export interface MatchCandidate {
  id: string;
  itemOffered: Item;
  itemRequested: Item;
  compatibilityScore: number;
  reason: string;
  aiTrace?: string;
  manualFallbackReason?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  translated?: boolean;
  attachments?: Array<{ id: string; name: string; safe: boolean }>;
  moderated?: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantBadge: BadgeTier;
  lastMessage: string;
  updatedAt: string;
  messages: ChatMessage[];
  translationEnabled: boolean;
}

export interface SwapIntent {
  id: string;
  requesterId: string;
  responderId: string;
  requesterItemId: string;
  responderItemId: string;
  status: "proposed" | "scheduled" | "in_progress" | "completed" | "cancelled";
  logistics: {
    locationType: "public_spot" | "courier" | "pickup";
    meetupPoint?: string;
    courierTracking?: string;
  };
  notifications: string[];
  feedback?: {
    rating: number;
    comment: string;
  };
}

export interface Announcement {
  id: string;
  message: string;
  priority: "info" | "warning" | "success";
}

export interface InfoStats {
  globalSwaps: number;
  activeUsers: number;
  premiumShare: number;
  tokensIssued: number;
}

export interface FeatureToggle {
  aiEnabled: boolean;
  mapsEnabled: boolean;
  cloudinaryEnabled: boolean;
  supabaseConfigured: boolean;
}
