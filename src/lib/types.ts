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
  username?: string;
  fullName?: string;
  displayName: string;
  firstName?: string;
  avatarUrl?: string;
  bio?: string;
  languages: LanguageCode[];
  badge: BadgeTier;
  role?: "user" | "admin" | "moderator";
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
  /** Stepped identity verification */
  phone?: string;
  phoneVerified?: boolean;
  idVerified?: boolean;
  selfieVerified?: boolean;
  /** Platform behaviour stats (0-100% where applicable) */
  responseRate?: number;
  completionRate?: number;
  noShowCount?: number;
  disputeRate?: number;
  createdAt?: string;
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
  condition: "new" | "good" | "used" | "used_good";
  description: string;
  wishlist: string;
  status: "active" | "paused" | "reserved" | "traded" | "archived";
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
  /* --- Boost / promotion --- */
  isBoosted?: boolean;
  boostExpiresAt?: string;
}

export type MatchTier = "weak" | "possible" | "good" | "strong";

export type NearMatchSuggestionType =
  | "add_bundle_item"
  | "accept_courier"
  | "extend_radius"
  | "add_photos"
  | "complete_description"
  | "lower_value"
  | "accept_flexible";

export interface NearMatchSuggestion {
  type: NearMatchSuggestionType;
  labelKey: string;
  scoreBoost: number;
  /** For radius suggestions */
  newRadiusKm?: number;
  /** How many new matches this would unlock */
  newMatchesCount?: number;
}

export interface MatchExplanation {
  score: number;
  positives: string[];
  negatives: string[];
  missing: string[];
  alternatives: NearMatchSuggestion[];
}

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
  /** v3: Structured match explanation with positives/negatives/suggestions */
  matchExplanation?: MatchExplanation;
  /** v4: pgvector semantic similarity (0-1) */
  semanticScore?: number;
  /** v4: weighted 9-factor score breakdown */
  weightedScore?: {
    total: number;
    factors: Array<{ key: string; raw: number; weighted: number; label: string }>;
    tooltipLines: string[];
  };
}

export type ChatMessageType = "text" | "location" | "image";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
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
  status: "pending" | "accepted" | "in_progress" | "delivered_by_a" | "delivered_by_b" | "rejected" | "cancelled" | "completed" | "expired" | "disputed" | "resolved";
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
  /** Confirmation flow: each party confirms delivery/receipt */
  requesterConfirmed?: boolean;
  responderConfirmed?: boolean;
  /** Dispute tracking */
  dispute?: {
    filedBy: string;
    reason: "item_not_received" | "wrong_item" | "damaged" | "condition_mismatch" | "no_show" | "other";
    description: string;
    evidencePhotos?: string[];
    status: "open" | "under_review" | "resolved_requester" | "resolved_responder" | "resolved_both";
    resolution?: string;
    filedAt: string;
    resolvedAt?: string;
  };
  cancelReason?: CancelReason;
  cancelNote?: string;
  /** Escrow guarantee for courier swaps */
  escrow?: {
    requesterStatus: "none" | "held" | "released" | "refunded" | "disputed";
    responderStatus: "none" | "held" | "released" | "refunded" | "disputed";
    amountRon: number;
  };
  /** Structured bundles */
  requesterBundle?: SwapBundle;
  responderBundle?: SwapBundle;
  createdAt?: string;
  updatedAt?: string;
}

/** Structured bundle for a swap side */
export interface SwapBundle {
  id: string;
  swapId: string;
  side: "requester" | "responder";
  itemIds: string[];
  notes?: string;
  totalEstimatedValue?: number;
  locked: boolean;
  lockedAt?: string;
  createdAt: string;
}

/** Shipment direction within a swap */
export type ShipmentDirection = "a_to_b" | "b_to_a";

/** Shipment status lifecycle */
export type ShipmentStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "failed";

/** Who pays for shipping */
export type ShipmentPaidBy = "sender" | "receiver" | "split";

/** Courier shipment tracking — persisted in swap_shipments table */
export interface SwapShipment {
  id: string;
  swapId: string;
  direction: ShipmentDirection;
  courier?: string;
  awb?: string;
  trackingUrl?: string;
  estimatedCost?: number;
  paidBy?: ShipmentPaidBy;
  status: ShipmentStatus;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

/** Delivery type selector options */
export type DeliveryType = "face_to_face" | "courier_same_city" | "courier_national" | "courier_international" | "locker_pickup";

/** House swap terms — persisted in swap_house_terms table */
export interface SwapHouseTerms {
  id: string;
  swapId: string;
  propertyType?: string;
  rooms?: number;
  rules?: string;
  intervalStart?: string;
  intervalEnd?: string;
  simultaneous?: boolean;
  inventory?: string;
  emergencyContact?: string;
  inspectionNotes?: string;
  createdAt?: string;
}

/** Service swap terms — persisted in swap_service_terms table */
export interface SwapServiceTerms {
  id: string;
  swapId: string;
  skill: string;
  level?: "beginner" | "intermediate" | "expert";
  deliveryMode?: "remote" | "in_person" | "hybrid";
  milestones?: Array<{ title: string; done: boolean }>;
  portfolioUrl?: string;
  estimatedHours?: number;
  createdAt?: string;
}

/** Audit trail event — persisted in swap_events table */
export interface SwapEvent {
  id: string;
  swapId: string;
  actorId: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

/** Typed metadata stored in swaps.swap_metadata */
export interface SwapMetadata {
  objectDetails?: { condition: string; accessories: string[] };
  houseDetails?: Omit<SwapHouseTerms, "id" | "swapId" | "createdAt">;
  serviceDetails?: Omit<SwapServiceTerms, "id" | "swapId" | "createdAt">;
}

/** Meeting session — safe meeting with confirmation code */
export type MeetingStatus = "scheduled" | "confirmed_a" | "confirmed_b" | "completed" | "no_show";

export interface MeetingSession {
  id: string;
  swapId: string;
  proposerId: string;
  locationName: string;
  locationAddress?: string;
  scheduledAt: string;
  confirmationCode: string;
  status: MeetingStatus;
  aCheckedInAt?: string;
  bCheckedInAt?: string;
  createdAt: string;
}

/** No-show report for a meeting */
export interface MeetingNoShowReport {
  id: string;
  meetingId: string;
  reporterId: string;
  reportedUserId: string;
  notes?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  message: string;
  priority: "info" | "warning" | "success";
}

export type NotificationType =
  | "match_new" | "message" | "swap_proposed" | "swap_accepted"
  | "logistics_updated" | "meeting_reminder" | "dispute_update"
  | "favorite_updated" | "saved_search_result" | "feedback_requested";

export type NotificationPriority = "low" | "normal" | "high" | "urgent" | "info" | "warning" | "success";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title?: string;
  message: string;
  body?: string;
  data?: Record<string, unknown>;
  read: boolean;
  priority: NotificationPriority;
  createdAt: string;
}

export type NotificationChannel = "inapp" | "email" | "push";

export interface NotificationPreferences {
  userId: string;
  match_new_inapp: boolean;
  match_new_email: boolean;
  match_new_push: boolean;
  message_inapp: boolean;
  message_email: boolean;
  message_push: boolean;
  swap_proposed_inapp: boolean;
  swap_proposed_email: boolean;
  swap_proposed_push: boolean;
  swap_accepted_inapp: boolean;
  swap_accepted_email: boolean;
  swap_accepted_push: boolean;
  logistics_updated_inapp: boolean;
  logistics_updated_email: boolean;
  logistics_updated_push: boolean;
  meeting_reminder_inapp: boolean;
  meeting_reminder_email: boolean;
  meeting_reminder_push: boolean;
  dispute_update_inapp: boolean;
  dispute_update_email: boolean;
  dispute_update_push: boolean;
  favorite_updated_inapp: boolean;
  favorite_updated_email: boolean;
  favorite_updated_push: boolean;
  saved_search_result_inapp: boolean;
  saved_search_result_email: boolean;
  saved_search_result_push: boolean;
  feedback_requested_inapp: boolean;
  feedback_requested_email: boolean;
  feedback_requested_push: boolean;
  updatedAt?: string;
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
    | "milestone_bonus" | "loyalty_reward" | "seasonal_bonus" | "auction_fee"
    | "welcome_bonus" | "add_item" | "complete_swap" | "review" | "daily_login" | "boost_item";
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
  priceEur: number;
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

/* ─── Dispute Workflow ─── */

export type DisputeStatus =
  | "open" | "waiting_evidence" | "under_review"
  | "resolved_requester" | "resolved_responder"
  | "resolved_split" | "rejected";

export type DisputeReason =
  | "item_not_received" | "wrong_item" | "damaged"
  | "condition_mismatch" | "no_show" | "other";

export type EvidenceType =
  | "photo" | "chat_screenshot" | "tracking"
  | "meeting_code" | "location_proof" | "note";

export interface Dispute {
  id: string;
  swapId: string;
  initiatorId: string;
  respondentId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  submittedBy: string;
  evidenceType: EvidenceType;
  content: string;
  createdAt: string;
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

/* ─── Reviews ─── */

export type ReviewTag =
  | "punctual" | "honest" | "communicative" | "generous"
  | "professional" | "friendly" | "flexible" | "reliable";

export interface Review {
  id: string;
  swapId: string;
  reviewerId: string;
  reviewedId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  tags: ReviewTag[];
  photos: string[];
  response?: string;
  createdAt: string;
}

export interface UserRating {
  avgRating: number;
  reviewCount: number;
  reviews: Review[];
  tagCounts: Partial<Record<ReviewTag, number>>;
}

/* ─── Swap Chains ─── */

export type SwapChainStatus = "forming" | "confirmed" | "locked" | "in_progress" | "completed" | "cancelled";

export interface SwapChainLink {
  id: string;
  chainId: string;
  position: number;
  giverId: string;
  receiverId: string;
  giverName?: string;
  receiverName?: string;
  itemId: string;
  itemTitle?: string;
  confirmed: boolean;
  createdAt: string;
}

export interface SwapChain {
  id: string;
  name: string;
  status: SwapChainStatus;
  initiatorId: string;
  links: SwapChainLink[];
  createdAt: string;
  updatedAt: string;
}

/* ─── Wanted Requests ─── */

export type WantedRequestStatus = "active" | "fulfilled" | "expired" | "cancelled";

export interface WantedRequest {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  description?: string;
  category?: string;
  city?: string;
  offerDescription?: string;
  offerItemIds?: string[];
  status: WantedRequestStatus;
  expiresAt: string;
  createdAt: string;
}

/* ─── Identity Verification ─── */

export type VerificationType = "email" | "phone" | "id_document" | "selfie" | "address";
export type VerificationStatus = "pending" | "verified" | "rejected" | "expired";

export interface Verification {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus;
  verifiedAt?: string;
  expiresAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface VerificationBadges {
  email: boolean;
  phone: boolean;
  idDocument: boolean;
  selfie: boolean;
  address: boolean;
  count: number;
  level: "none" | "basic" | "standard" | "full";
}

/* ─── Image Gallery ─── */

export interface ItemImage {
  id: string;
  itemId: string;
  url: string;
  position: number;
  caption: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  uploadedAt: string;
}

/* ─── Search ─── */

export interface SearchFilters {
  query: string;
  category?: string;
  condition?: Item["condition"];
  location?: string;
  sortBy: "relevance" | "date" | "distance";
  listingType?: ListingType;
  maxDistance?: number;
}

export interface SearchResult {
  item: Item;
  relevance: number;
}

/* ─── Weekly Events ─── */

export interface WeeklyEvent {
  id: string;
  weekNumber: number;
  year: number;
  title: string;
  emoji: string;
  description: string;
  focusCategories: string[];
  challengeDescription: string;
  challengeBadgeName: string;
  hashtags: string[];
  sponsorName?: string;
  sponsorLogoUrl?: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

/* ─── Account Status ─── */

export type AccountStatus = "active" | "paused" | "deleted";
