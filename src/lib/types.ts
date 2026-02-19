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
  houseProfile?: HouseProfile;
  serviceProfiles?: ServiceProfile[];
}

/** Semantic attributes — all optional, enriching match quality */
export type ItemIntent = "explore" | "open" | "committed" | "high_commitment";
export type ItemFlexibility = "strict" | "moderate" | "broad";
export type ItemPerceivedValue = "small" | "medium" | "large" | "sentimental";
export type ItemConditionImpact = "affects_value" | "affects_usage" | "affects_durability" | "affects_appearance";
export type ItemClarity = "exploring" | "have_idea" | "know_exactly";
export type ItemContext = "permanent" | "vacation" | "temporary" | "urgent";

export type ListingType = "object" | "property" | "service";

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  condition: "new" | "good" | "used";
  description: string;
  wishlist: string;
  status: "active" | "paused" | "reserved" | "swapped" | "archived";
  isDemo?: boolean;
  isActive: boolean;
  createdAt: string;
  location: string;
  aiSuggestedTags?: string[];
  userFinalTags?: string[];
  photos: string[];
  listingType?: ListingType;
  houseProfile?: HouseProfile;
  serviceProfile?: ServiceProfile;
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
  /** AI-enhanced fields (populated on demand) */
  aiAnalyzed?: boolean;
  aiScoreBoost?: number;
  aiSummary?: string;
  aiConfidence?: "high" | "medium" | "low";
  aiProvider?: string;
  /** v2: Distance & explanation fields */
  distanceKm?: number;
  explanations?: Array<{ icon: string; label: string; detail: string }>;
}

export type ChatMessageType = "text" | "location" | "image";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  translated?: boolean;
  attachments?: Array<{ id: string; name: string; safe: boolean }>;
  moderated?: boolean;
  messageType?: ChatMessageType;
  locationData?: { lat: number; lng: number; label?: string };
  reactions?: Record<string, string[]>; // emoji → userIds
  readBy?: string[];
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
  participantTyping?: boolean;
}

export type SwapType = "object" | "house" | "service" | "cross";

export interface SwapIntent {
  id: string;
  requesterId: string;
  responderId: string;
  requesterItemId: string;
  responderItemId: string;
  swapType?: SwapType;
  /** Cross-swap: additional item IDs from requester side */
  requesterBundleIds?: string[];
  /** Cross-swap: additional item IDs from responder side */
  responderBundleIds?: string[];
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
  cancelReason?: CancelReason;
  cancelNote?: string;
  createdAt?: string;
  updatedAt?: string;
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

/** Tier benefits definition */
export interface TierBenefits {
  mapPinVisible: boolean;
  priorityMatching: boolean;
  aiSuggestions: boolean;
  swapAnalytics: boolean;
  profileBadge: boolean;
  prioritySupport: boolean;
  monthlyTokens: number;
  boostSlots: number;
  adFree: boolean;
  extendedFilters: boolean;
  exportReports: boolean;
  auctionMode: boolean;
  itemLimit: number;
  featuredSlots: number;
}

/** Token ledger entry */
export interface TokenLedgerEntry {
  id: string;
  userId: string;
  amount: number;
  reason:
    | "swap_completed" | "monthly_grant" | "boost_spent" | "referral"
    | "signup_bonus" | "purchase" | "admin_grant" | "daily_streak"
    | "gift_sent" | "gift_received" | "insurance_spent" | "featured_spent"
    | "verified_spent" | "theme_spent" | "bundle_discount" | "business_upgrade"
    | "milestone_bonus" | "loyalty_reward" | "seasonal_bonus" | "auction_fee";
  description: string;
  createdAt: string;
}

/** Analytics event */
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

/* ─── Monetization Types ─── */

/** Token purchase packages (real money → tokens) */
export interface TokenPackage {
  id: string;
  tokens: number;
  priceUsd: number;
  label: string;
  popular?: boolean;
}

/** Subscription plan definition */
export interface SubscriptionPlan {
  id: "free" | "premium" | "platinum";
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  recommended?: boolean;
}

/** User subscription status */
export interface UserSubscription {
  planId: "free" | "premium" | "platinum";
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/** Referral tracking */
export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referredEmail: string;
  status: "pending" | "signed_up" | "first_swap";
  tokensEarned: number;
  createdAt: string;
}

/** Daily login streak */
export interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  todayClaimed: boolean;
  nextReward: number;
}

/** Featured listing */
export interface FeaturedListing {
  id: string;
  itemId: string;
  userId: string;
  position: number;
  expiresAt: string;
  createdAt: string;
}

/** Swap insurance policy */
export interface SwapInsurance {
  id: string;
  swapId: string;
  buyerId: string;
  cost: number;
  coverageAmount: string;
  status: "active" | "claimed" | "expired";
  expiresAt: string;
  createdAt: string;
}

/** Gift token transfer */
export interface TokenGift {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  message: string;
  createdAt: string;
}

/** Profile theme */
export interface ProfileTheme {
  id: string;
  name: string;
  colors: { primary: string; secondary: string; accent: string; bg: string };
  cost: number;
  icon: string;
}

/** Seasonal promotion */
export interface SeasonalPromotion {
  id: string;
  name: string;
  description: string;
  type: "token_multiplier" | "shop_discount" | "bonus_tokens" | "free_boost";
  multiplier?: number;
  discountPercent?: number;
  bonusTokens?: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

/** Swap completion milestone */
export interface SwapMilestone {
  swapCount: number;
  bonusTokens: number;
  label: string;
  achieved: boolean;
}

/** Loyalty milestone */
export interface LoyaltyMilestone {
  daysActive: number;
  reward: string;
  rewardType: "premium_trial" | "permanent_badge" | "token_grant" | "free_month";
  tokenAmount?: number;
  trialDays?: number;
  achieved: boolean;
}

/** Business account features */
export interface BusinessAccount {
  enabled: boolean;
  companyName: string;
  bulkUploadLimit: number;
  brandingEnabled: boolean;
  analyticsEnabled: boolean;
  verifiedAt?: string;
}

/** Auction/bidding on an item */
export interface ItemAuction {
  id: string;
  itemId: string;
  ownerId: string;
  bids: AuctionBid[];
  endsAt: string;
  minBidTokens: number;
  status: "active" | "ended" | "canceled";
  createdAt: string;
}

export interface AuctionBid {
  id: string;
  bidderId: string;
  bidderName: string;
  offeredItemId: string;
  offeredItemTitle: string;
  tokenBid: number;
  message: string;
  createdAt: string;
}

/** Item analytics (premium feature) */
export interface ItemAnalytics {
  itemId: string;
  views: number;
  matches: number;
  inquiries: number;
  saves: number;
  avgResponseTime: string;
  viewsByDay: { date: string; count: number }[];
}

/* ─── House Swap Types ─── */

export type PropertyType = "apartment" | "house" | "villa" | "cabin" | "studio" | "room";
export type HouseSwapMode = "simultaneous" | "non_simultaneous" | "one_way_hosting" | "permanent";

export interface HouseProfile {
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  squareMeters?: number;
  amenities: HouseAmenity[];
  rules: HouseRule[];
  description: string;
  neighborhood: string;
  nearbyAttractions: string;
  transport: string;
  photos: string[];
  availableDates: { from: string; to: string }[];
  minStayDays: number;
  maxStayDays: number;
  swapMode: HouseSwapMode;
  verified: boolean;
  emergencyContact?: string;
  insuranceReminder: boolean;
}

export type HouseAmenity =
  | "wifi" | "parking" | "ac" | "heating" | "washer" | "dryer"
  | "kitchen" | "pool" | "garden" | "balcony" | "elevator"
  | "pet_friendly" | "wheelchair" | "tv" | "workspace";

export type HouseRule =
  | "no_smoking" | "no_pets" | "no_parties" | "no_shoes"
  | "quiet_hours" | "check_in_time" | "check_out_time" | "max_guests";

export interface HouseInspection {
  id: string;
  swapId: string;
  type: "before" | "after";
  photos: string[];
  notes: string;
  createdAt: string;
}

/* ─── Service Swap Types ─── */

export type ServiceCategory =
  | "creative" | "technical" | "education" | "physical" | "professional";

export type SkillLevel = "beginner" | "intermediate" | "expert";
export type ServiceDelivery = "remote" | "in_person" | "hybrid";

export interface ServiceProfile {
  category: ServiceCategory;
  skillName: string;
  skillLevel: SkillLevel;
  description: string;
  portfolio: string[];
  hoursPerWeek: number;
  delivery: ServiceDelivery;
  hourlyEquivalent: number;
}

export interface ServiceMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  confirmedByProvider: boolean;
  confirmedByReceiver: boolean;
  dueDate?: string;
}

export interface ServiceRating {
  quality: number;
  punctuality: number;
  communication: number;
  comment: string;
}

export interface TimeWallet {
  userId: string;
  hoursEarned: number;
  hoursSpent: number;
  balance: number;
  transactions: TimeTransaction[];
}

export interface TimeTransaction {
  id: string;
  type: "earned" | "spent";
  hours: number;
  serviceDescription: string;
  partnerId: string;
  partnerName: string;
  createdAt: string;
}

/* ─── Achievement System ─── */

export type AchievementId =
  | "first_swap" | "five_swaps" | "ten_swaps" | "twenty_five_swaps"
  | "first_listing" | "ten_listings" | "first_rating" | "five_star_rating"
  | "streak_7" | "streak_30" | "eco_warrior" | "house_swapper"
  | "service_provider" | "multilingual" | "community_helper"
  | "verified_profile" | "premium_member" | "early_adopter";

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  target: number;
  current: number;
}

/* ─── Cancel Reason ─── */

export type CancelReason =
  | "changed_mind" | "found_better" | "no_response" | "condition_mismatch"
  | "logistics_issue" | "safety_concern" | "other";

/* ─── Token Shop ─── */

export type TokenShopItem =
  | "boost_listing" | "premium_badge_7d" | "extra_listings_5"
  | "priority_matching_24h" | "highlight_profile_7d"
  | "featured_48h" | "swap_insurance" | "verified_badge"
  | "theme_ocean" | "theme_sunset" | "theme_forest" | "theme_midnight" | "theme_rose"
  | "bundle_boost_3" | "business_upgrade" | "auction_slot";

export interface ShopItem {
  id: TokenShopItem;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: "boost" | "badge" | "theme" | "premium" | "business";
}

/* ─── Trust & Safety ─── */

export type TrustLevelType = "new" | "basic" | "trusted" | "verified" | "ambassador";

export interface UserTrustInfo {
  score: number;
  level: TrustLevelType;
  reportsAgainst: number;
  autoHold: boolean;
  holdReason?: string;
}

/* ─── Account Status ─── */

export type AccountStatus = "active" | "paused" | "deleted";
