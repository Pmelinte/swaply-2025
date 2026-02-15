export type BadgeTier = "free" | "premium" | "platinum";

export type LanguageCode =
  | "en" | "ro" | "fr" | "de" | "es" | "it" | "pt" | "nl" | "pl" | "el"
  | "hu" | "bg" | "cs" | "sk" | "hr" | "sl" | "sr" | "sv" | "da" | "fi"
  | "no" | "lt" | "lv" | "et" | "ga" | "mt" | "ru" | "tr" | "ar" | "zh"
  | "hi" | "bn" | "ja" | "ko" | "vi" | "th" | "id" | "ms" | "fil" | "fa"
  | "mn" | "uk";

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

/** Semantic attributes — all optional, enriching match quality */
export type ItemIntent = "explore" | "open" | "committed" | "high_commitment";
export type ItemFlexibility = "strict" | "moderate" | "broad";
export type ItemPerceivedValue = "small" | "medium" | "large" | "sentimental";
export type ItemConditionImpact = "affects_value" | "affects_usage" | "affects_durability" | "affects_appearance";
export type ItemClarity = "exploring" | "have_idea" | "know_exactly";
export type ItemContext = "permanent" | "vacation" | "temporary" | "urgent";

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
  /* --- Semantic contract fields (all optional) --- */
  intent?: ItemIntent;
  flexibility?: ItemFlexibility;
  perceivedValue?: ItemPerceivedValue;
  conditionImpact?: ItemConditionImpact[];
  acceptsBundle?: boolean;
  recipientMatters?: boolean;
  clarity?: ItemClarity;
  context?: ItemContext;
  aiNote?: string;
}

export type MatchTier = "weak" | "possible" | "good" | "strong";

export interface MatchCandidate {
  id: string;
  itemOffered: Item;
  itemRequested: Item;
  compatibilityScore: number;
  tier: MatchTier;
  reasons: string[];
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

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  priority: "info" | "warning" | "success";
  createdAt: string;
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
