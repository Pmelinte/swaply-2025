"use client";

/**
 * Application state provider — orchestrates all state slice hooks.
 * Split from monolithic 1,752-line file into modular hooks:
 *   - useItemActions    (CRUD for items)
 *   - useChatActions    (conversations & messages)
 *   - useSwapActions    (swap lifecycle + disputes)
 *   - useSafetyActions  (reports, blocks, notifications)
 *   - useMonetization   (tokens, streaks, shop, achievements)
 */
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { nanoid } from "nanoid";
import { getSupabaseClient, resetSupabaseClient } from "../supabase/client";
import type {
  AccountStatus,
  Achievement,
  Announcement,
  Conversation,
  FeatureToggle,
  HouseProfile,
  Item,
  ItemImage,
  LanguageCode,
  MatchCandidate,
  Notification,
  Review,
  ReviewTag,
  SearchFilters,
  SearchResult,
  ServiceProfile,
  ShopItem,
  SwapChain,
  SwapChainLink,
  SwapIntent,
  SwapType,
  TierBenefits,
  TokenLedgerEntry,
  TokenShopItem,
  UserProfile,
  UserRating,
  Verification,
  VerificationBadges,
} from "../types";
import {
  mockAnnouncements,
  mockConversations,
  mockInfoStats,
  mockItems,
  mockSwaps,
  mockUser,
} from "../mock-data";
import { generateDemoData } from "../demo-generator";
import type { PremiumFeature } from "../monetization";
import type {
  FeaturedListing,
  LoginStreak,
  LoyaltyMilestone,
  Referral,
  SeasonalPromotion,
  SwapMilestone,
  UserSubscription,
} from "../types";
import type {
  TrustScore,
  FrictionLimits,
  ScamCheckResult,
} from "../trust";
import {
  buildTrustSignals,
  checkMessageForScam,
  computeFriction,
  computeTrustScore,
  SAFE_MEETING_CHECKLIST,
  TRUST_LEVEL_CONFIG,
} from "../trust";
import type { SafeMeetingChecklist } from "../trust";
import type {
  FeatureFlag,
  CronJob,
  MetricsFunnel,
} from "../feature-flags";
import {
  DEFAULT_CRON_JOBS,
  computeFunnelRates,
  computeMetricsFromState,
} from "../feature-flags";
import { useFeatureFlags } from "../use-feature-flags";
import { buildUserContext } from "./matching";
import type { MatchingUserContext } from "./matching";

// ── Extracted modules ──
import {
  computeFeatureToggles,
  computeTierBenefits,
  parseDmConversationId,
  safeBadgeTier,
  safeString,
  setLoggedIn,
} from "./helpers";
import { computeMatchesForUser } from "./matching";
import {
  createMapItem,
  createMapMessage,
  createMapNotification,
  createMapProfile,
  createMapSwapIntent,
} from "./mappers";
import { useRealtime } from "./useRealtime";

// ── Feature slice hooks ──
import { useItemActions } from "./useItemActions";
import { useChatActions } from "./useChatActions";
import { useSwapActions } from "./useSwapActions";
import { useSafetyActions } from "./useSafetyActions";
import { useMonetization } from "./useMonetization";
import { useReviews } from "./useReviews";
import { useSwapChains } from "./useSwapChains";
import { useVerification } from "./useVerification";
import { useSearch } from "./useSearch";
import { useImageGallery } from "./useImageGallery";
import {
  ensureOwnProfileWithCompatibility,
  updateOwnProfileWithCompatibility,
} from "../profile/profileCompatibilityBridge";

// ── Re-export for backwards compatibility ──
export { computeMatchesForUser } from "./matching";
export { computeTierBenefits } from "./helpers";

interface AppStateContextProps {
  user: UserProfile | null;
  dataSource: "supabase" | "mock";
  loading: { profile: boolean; items: boolean; auth: boolean };
  lastError: string | null;
  announcements: Announcement[];
  notifications: Notification[];
  items: Item[];
  matches: MatchCandidate[];
  conversations: Conversation[];
  swaps: SwapIntent[];
  featureToggles: FeatureToggle;
  language: LanguageCode;
  setLanguage: (next: LanguageCode) => void;
  login: (email: string, password?: string, acceptTerms?: boolean) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password?: string, acceptTerms?: boolean) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<UserProfile>, options?: { persist?: boolean }) => Promise<void>;
  upsertItem: (item: Item) => Promise<Item | null>;
  deleteItem: (id: string) => Promise<void>;
  duplicateItem: (id: string) => Promise<Item | null>;
  setItemStatus: (id: string, status: Item["status"]) => Promise<void>;
  ensureConversation: (participantId: string) => Promise<string | null>;
  addMessage: (conversationId: string, content: string) => Promise<void>;
  toggleConversationTranslation: (conversationId: string) => void;
  proposeSwap: (params: {
    requesterItemId: string;
    responderItemId: string;
    responderId: string;
    swapType?: SwapType;
    requesterBundleIds?: string[];
    responderBundleIds?: string[];
  }) => Promise<SwapIntent | null>;
  updateSwapStatus: (swapId: string, status: SwapIntent["status"]) => Promise<void>;
  addSwapFeedback: (swapId: string, rating: number, comment: string) => Promise<void>;
  updateSwapLogistics: (swapId: string, logistics: SwapIntent["logistics"]) => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
  changeEmail: (newEmail: string) => Promise<{ error?: string }>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
  reportUser: (params: { reportedUserId: string; reportedItemId?: string; reason: string; description?: string }) => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  blockedUsers: string[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => void;
  startNewItem: () => Item | null;
  infoStats: typeof mockInfoStats;
  tierBenefits: TierBenefits;
  tokenLedger: TokenLedgerEntry[];
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
  achievements: Achievement[];
  shopItems: ShopItem[];
  purchaseShopItem: (itemId: TokenShopItem) => Promise<{ error?: string }>;
  exportUserData: () => Promise<string>;
  accountStatus: AccountStatus;
  pauseAccount: () => Promise<void>;
  resumeAccount: () => Promise<void>;
  itemLimitReached: boolean;
  updateHouseProfile: (profile: HouseProfile) => Promise<void>;
  addServiceProfile: (profile: ServiceProfile) => Promise<void>;
  removeServiceProfile: (skillName: string) => Promise<void>;
  demoMode: boolean;
  demoItemCount: number;
  activateDemoMode: (count: number) => void;
  deactivateDemoMode: () => void;
  // Real-time additions
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  markMessagesRead: (conversationId: string) => Promise<void>;
  // ── Monetization (20 capabilities) ──
  loginStreak: LoginStreak;
  claimDailyReward: () => Promise<{ tokens: number } | { error: string }>;
  referralCode: string;
  referrals: Referral[];
  sendReferralInvite: (email: string) => Promise<{ error?: string }>;
  giftTokens: (recipientId: string, amount: number, message: string) => Promise<{ error?: string }>;
  purchaseFeaturedSlot: (itemId: string) => Promise<{ error?: string }>;
  purchaseInsurance: (swapId: string) => Promise<{ error?: string }>;
  purchaseVerifiedBadge: () => Promise<{ error?: string }>;
  purchaseTheme: (themeId: string) => Promise<{ error?: string }>;
  activateTheme: (themeId: string) => void;
  purchaseBusinessUpgrade: (companyName: string) => Promise<{ error?: string }>;
  subscription: UserSubscription;
  activePromotions: SeasonalPromotion[];
  featuredListings: FeaturedListing[];
  swapMilestones: SwapMilestone[];
  loyaltyMilestones: LoyaltyMilestone[];
  tokenBalance: number;
  hasFeature: (feature: PremiumFeature) => boolean;
  activeTheme: string | null;
  isVerified: boolean;
  isBusiness: boolean;
  // ── Dispute / Confirmation ──
  confirmDelivery: (swapId: string, side: "requester" | "responder") => Promise<void>;
  fileDispute: (swapId: string, reason: SwapIntent["dispute"] extends undefined ? never : NonNullable<SwapIntent["dispute"]>["reason"], description: string, photos?: string[]) => Promise<void>;
  // ── Trust & Safety ──
  trustScore: TrustScore;
  frictionLimits: FrictionLimits;
  checkScam: (text: string) => ScamCheckResult;
  safeMeetingChecklist: SafeMeetingChecklist[];
  trustLevelConfig: typeof TRUST_LEVEL_CONFIG;
  // ── Product Control ──
  featureFlags: FeatureFlag[];
  setFeatureFlag: (flagId: string, enabled: boolean) => void;
  isFeatureEnabled: (flagId: string) => boolean;
  cronJobs: CronJob[];
  metricsFunnel: MetricsFunnel;
  funnelRates: ReturnType<typeof computeFunnelRates>;
  // ── Reviews ──
  reviews: Review[];
  myReviews: Review[];
  receivedReviews: Review[];
  submitReview: (params: { swapId: string; reviewedId: string; rating: number; comment: string; tags?: ReviewTag[]; photos?: string[] }) => Promise<{ error?: string }>;
  respondToReview: (reviewId: string, response: string) => Promise<{ error?: string }>;
  getUserRating: (targetUserId: string) => UserRating;
  canReview: (swapId: string) => boolean;
  // ── Swap Chains ──
  swapChains: SwapChain[];
  myChains: SwapChain[];
  pendingChainConfirmations: Array<{ chain: SwapChain; link: SwapChainLink }>;
  detectedChainOpportunities: Array<{ participants: Array<{ userId: string; userName: string; givesItemId: string; givesItemTitle: string; receivesItemId: string; receivesItemTitle: string }>; score: number }>;
  detectingChains: boolean;
  createChain: (name: string, links: Omit<SwapChainLink, "id" | "chainId" | "confirmed" | "createdAt">[]) => Promise<SwapChain | null>;
  confirmChainLink: (chainId: string, linkId: string) => Promise<{ error?: string }>;
  startChain: (chainId: string) => Promise<{ error?: string }>;
  completeChain: (chainId: string) => Promise<{ error?: string }>;
  cancelChain: (chainId: string) => Promise<{ error?: string }>;
  detectChains: () => Promise<void>;
  // ── Search & Discovery ──
  searchFilters: SearchFilters;
  searchResults: SearchResult[];
  searchTotalResults: number;
  searchCategoryCounts: Array<{ category: string; count: number }>;
  searchLocationCounts: Array<{ location: string; count: number }>;
  savedSearches: SearchFilters[];
  updateSearchFilters: (updates: Partial<SearchFilters>) => void;
  clearSearchFilters: () => void;
  saveSearch: () => void;
  removeSavedSearch: (index: number) => void;
  // ── Image Gallery ──
  imageUploading: boolean;
  imageUploadProgress: number;
  maxImagesPerItem: number;
  uploadImages: (itemId: string, files: File[], existing?: ItemImage[]) => Promise<{ images: ItemImage[]; errors: string[] }>;
  deleteImage: (image: ItemImage) => Promise<void>;
  reorderImages: (images: ItemImage[], from: number, to: number) => ItemImage[];
  updateImageCaption: (images: ItemImage[], imageId: string, caption: string) => ItemImage[];
  setImageAsCover: (images: ItemImage[], imageId: string) => ItemImage[];
  // ── Verification ──
  verifications: Verification[];
  verificationBadges: VerificationBadges;
  requestEmailVerification: () => Promise<{ error?: string }>;
  verifyEmailCode: (code: string) => Promise<{ error?: string }>;
  requestPhoneVerification: (phone: string) => Promise<{ error?: string }>;
  verifyPhoneCode: (code: string) => Promise<{ error?: string }>;
  submitIdDocument: (url: string, type: string) => Promise<{ error?: string }>;
  submitSelfie: (url: string) => Promise<{ error?: string }>;
}

const AppStateContext = createContext<AppStateContextProps | undefined>(undefined);

export function AppStateProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: string }) {
  const supabase = getSupabaseClient();
  const supabaseConfigured = Boolean(supabase);

  const [dataSource, setDataSource] = useState<"supabase" | "mock">(
    supabaseConfigured ? "supabase" : "mock",
  );
  const [loading, setLoading] = useState({
    profile: supabaseConfigured,
    items: supabaseConfigured,
    auth: true,
  });
  const [lastError, setLastError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const userRef = useRef<UserProfile | null>(null);
  const hydratingRef = useRef<string | null>(null);
  const profileRevisionRef = useRef(1);

  const announcements = useMemo<Announcement[]>(() => {
    return mockAnnouncements.filter((ann) => {
      if (ann.id === "ann-2" && user?.location?.city && user?.location?.country) return false;
      return true;
    });
  }, [user?.location?.city, user?.location?.country]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [swaps, setSwaps] = useState<SwapIntent[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [featureToggles] = useState<FeatureToggle>(computeFeatureToggles());
  const [demoMode, setDemoMode] = useState(false);
  const [demoItemCount, setDemoItemCount] = useState(0);

  // Fire-and-forget audit log via /api/audit (server-side uses service role)
  const sendAuditLog = useCallback((params: {
    userId: string; action: string; entityType: string;
    entityId?: string; oldData?: Record<string, unknown>; newData?: Record<string, unknown>;
  }) => {
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    }).catch(() => { /* audit is best-effort */ });
  }, []);

  const [language, setLanguage] = useState<LanguageCode>(
    (initialLocale as LanguageCode) || "en",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("swaply_language", language);
  }, [language]);

  useEffect(() => { userRef.current = user; }, [user]);

  // ── Mappers (use useCallback for stable references) ──
  const mapProfile = useCallback(createMapProfile(userRef), []);
  const mapItem = useCallback(createMapItem(userRef), []);
  const mapMessage = useCallback(createMapMessage(), []);
  const mapSwapIntent = useCallback(createMapSwapIntent(), []);
  const mapNotification = useCallback(createMapNotification(), []);

  // ── Analytics ──
  const analyticsBuffer = useRef<{ event: string; properties?: Record<string, string | number | boolean>; timestamp: string }[]>([]);
  const trackEvent = useCallback((event: string, properties?: Record<string, string | number | boolean>) => {
    analyticsBuffer.current.push({ event, properties, timestamp: new Date().toISOString() });
    if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, properties ?? "");
  }, []);

  // ── Matching (with user context for distance/blocked) ──
  const matchingContext = useMemo<MatchingUserContext | undefined>(
    () => user ? buildUserContext(user, blockedUsers) : undefined,
    [user, blockedUsers],
  );
  const prevMatchCountRef = useRef(0);

  useEffect(() => {
    if (!user?.id) {
      setMatches([]);
      prevMatchCountRef.current = 0;
      return;
    }
    const newMatches = computeMatchesForUser(user.id, items, matchingContext);
    const prevCount = prevMatchCountRef.current;
    setMatches(newMatches);

    if (prevCount > 0 && newMatches.length > prevCount) {
      const diff = newMatches.length - prevCount;
      const hasGood = newMatches.slice(0, diff).some((m) => m.tier === "good" || m.tier === "strong");
      if (hasGood) {
        setNotifications((prev) => [{
          id: `match-new-${Date.now()}`,
          userId: user.id,
          type: "new_match",
          message: `${diff} potrivir${diff === 1 ? "e nouă" : "i noi"} disponibil${diff === 1 ? "ă" : "e"}!`,
          read: false,
          priority: "success",
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
    }
    prevMatchCountRef.current = newMatches.length;
  }, [items, user?.id, matchingContext]);

  // ── Session restore ──
  useEffect(() => {
    if (!supabaseConfigured) {
      setDataSource("mock");
      setUser(mockUser);
      setItems(mockItems);
      setConversations(mockConversations);
      setSwaps(mockSwaps);
      setNotifications([]);
      setLoading({ profile: false, items: false, auth: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Supabase hydration ──
  const hydrateSupabase = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      // Prevent concurrent hydrations for the same user.
      // If already hydrating this user, wait for the in-flight one to finish (max 15s).
      if (hydratingRef.current === userId) {
        const deadline = Date.now() + 15_000;
        while (hydratingRef.current === userId && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 80));
        }
        return;
      }
      hydratingRef.current = userId;
      setLastError(null);
      setLoading((prev) => ({ ...prev, profile: true, items: true }));
      try {

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) setLastError(profileError.message);

      if (profileData) {
        const rawRevision = (profileData as Record<string, unknown>).profile_revision;
        profileRevisionRef.current =
          typeof rawRevision === "number" && Number.isInteger(rawRevision) && rawRevision > 0
            ? rawRevision
            : 1;
        setUser(mapProfile(profileData));
      } else if (supabaseConfigured) {
        const session = await supabase.auth.getSession();
        const email = session.data.session?.user.email ?? "";
        const newProfile = mapProfile({ id: userId, email });
        const emailLocal = email.split("@")[0] || "user";
        const legacyPayload: Record<string, unknown> = {
          user_id: userId,
          email,
          username: emailLocal,
          full_name: emailLocal,
          display_name: emailLocal,
          badge: "free",
          languages: [language],
          location: {},
          visibility: newProfile.visibility,
          notifications: newProfile.notifications,
          swap_preferences: newProfile.swapPreferences,
          security: newProfile.security,
          stats: newProfile.stats,
        };

        setUser(newProfile);
        try {
          const ensured = await ensureOwnProfileWithCompatibility(supabase, {
            routeLocale: language,
            legacyPayload,
          });
          profileRevisionRef.current = ensured.profileRevision;
          setUser(mapProfile(ensured.profileRow));
        } catch (error) {
          const message = error instanceof Error
            ? error.message
            : "Profile bootstrap failed.";
          setLastError(message);
        }
      }

      const [
        { data: itemsData, error: itemsError },
        { data: swapsData, error: swapsError },
        { data: notificationsData, error: notificationsError },
        { data: messagesData, error: messagesError },
      ] = await Promise.all([
        supabase.from("items").select("*")
          .or(`is_active.eq.true,owner_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(2000),
        supabase.from("swaps").select("*")
          .or(`requester_id.eq.${userId},responder_id.eq.${userId}`)
          .order("updated_at", { ascending: false }),
        supabase.from("notifications").select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("messages").select("*")
          .or(`sender_id.eq.${userId},conversation_id.ilike.%${userId}%`)
          .order("created_at", { ascending: true })
          .limit(1000),
      ]);

      if (itemsError) setLastError(itemsError.message);
      if (itemsData) {
        const mapped = itemsData.map(mapItem);
        // Fetch active boosts to mark boosted items
        try {
          const { data: activeBoosts } = await supabase
            .from("item_boosts")
            .select("item_id, expires_at")
            .eq("stripe_payment_status", "succeeded")
            .gt("expires_at", new Date().toISOString());
          if (activeBoosts && activeBoosts.length > 0) {
            const boostMap = new Map(activeBoosts.map((b: { item_id: string; expires_at: string }) => [b.item_id, b.expires_at]));
            for (const item of mapped) {
              const exp = boostMap.get(item.id);
              if (exp) { item.isBoosted = true; item.boostExpiresAt = exp; }
            }
          }
        } catch { /* item_boosts table may not exist yet */ }
        setItems(mapped);
      }

      if (swapsError) setLastError(swapsError.message);
      if (swapsData) setSwaps(swapsData.map(mapSwapIntent));

      if (notificationsError) setLastError(notificationsError.message);
      if (notificationsData) setNotifications(notificationsData.map(mapNotification));

      if (messagesError) setLastError(messagesError.message);
      if (messagesData) {
        const mappedMessages = messagesData.map(mapMessage);
        const byConversation = new Map<string, import("../types").ChatMessage[]>();
        for (const msg of mappedMessages) {
          const list = byConversation.get(msg.conversationId) ?? [];
          list.push(msg);
          byConversation.set(msg.conversationId, list);
        }

        const conversationIds = Array.from(byConversation.keys());
        const participantIds = Array.from(
          new Set(
            conversationIds
              .map((cid) => {
                const parsed = parseDmConversationId(cid);
                if (!parsed) return null;
                return parsed.a === userId ? parsed.b : parsed.b === userId ? parsed.a : null;
              })
              .filter(Boolean),
          ),
        ) as string[];

        const profilesById = new Map<string, { displayName: string; badge: UserProfile["badge"] }>();

        if (participantIds.length) {
          const { data: participantProfiles, error: ppError } = await supabase
            .from("public_profiles").select("user_id, display_name, badge")
            .in("user_id", participantIds);
          if (ppError) setLastError(ppError.message);

          for (const row of participantProfiles ?? []) {
            const id = safeString(row.user_id);
            if (!id) continue;
            profilesById.set(id, {
              displayName: safeString(row.display_name, "Utilizator"),
              badge: safeBadgeTier(row.badge, "free"),
            });
          }
        }

        const nextConversations = conversationIds
          .map((cid) => {
            const parsed = parseDmConversationId(cid);
            const participantId = parsed?.a === userId ? parsed.b : parsed?.b === userId ? parsed.a : "unknown";
            const participantProfile = profilesById.get(participantId);
            const messages = byConversation.get(cid) ?? [];
            const lastMessage = messages[messages.length - 1];
            return {
              id: cid,
              participantId,
              participantName: participantProfile?.displayName ?? (participantId === "unknown" ? "Conversație" : `Utilizator ${participantId.slice(0, 8)}`),
              participantBadge: participantProfile?.badge ?? "free",
              lastMessage: lastMessage?.content ?? "",
              updatedAt: lastMessage?.createdAt ?? new Date().toISOString(),
              messages,
              translationEnabled: false,
            } satisfies Conversation;
          })
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

        setConversations(nextConversations);
      }

      setLoading((prev) => ({ ...prev, profile: false, items: false, auth: false }));
      } finally {
        hydratingRef.current = null;
      }
    },
    [mapItem, mapMessage, mapNotification, mapProfile, mapSwapIntent, supabase, supabaseConfigured],
  );

  // ── Auth listener ──
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    let unsubscribe: (() => void) | undefined;
    const init = async () => {
      // Use getSession() — reads JWT locally from cookies, zero network calls.
      // getUser() makes an HTTP call that can fail/timeout and previously
      // triggered signOut() which nuked valid cookies, breaking session persistence.
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setLastError(error.message);
      }

      const session = data?.session;
      if (session?.user?.id) {
        setDataSource("supabase");
        setLoggedIn(true);
        await hydrateSupabase(session.user.id);
      } else {
        setLoggedIn(false);
        setUser(null);
        setConversations([]);
        setSwaps([]);
        setNotifications([]);
        // Public fetch: load active items for guest browsing
        setLoading((prev) => ({ ...prev, items: true }));
        const { data: publicItems } = await supabase
          .from("items")
          .select("*")
          .eq("is_active", true)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(2000);
        if (publicItems) {
          const mapped = publicItems.map(mapItem);
          // Mark boosted items for guest view
          try {
            const { data: guestBoosts } = await supabase
              .from("item_boosts")
              .select("item_id, expires_at")
              .eq("stripe_payment_status", "succeeded")
              .gt("expires_at", new Date().toISOString());
            if (guestBoosts && guestBoosts.length > 0) {
              const boostMap = new Map(guestBoosts.map((b: { item_id: string; expires_at: string }) => [b.item_id, b.expires_at]));
              for (const item of mapped) {
                const exp = boostMap.get(item.id);
                if (exp) { item.isBoosted = true; item.boostExpiresAt = exp; }
              }
            }
          } catch { /* item_boosts table may not exist yet */ }
          setItems(mapped);
        } else setItems([]);
        setLoading((prev) => ({ ...prev, auth: false, profile: false, items: false }));
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        if (nextSession?.user?.id) {
          // Only hydrate on TOKEN_REFRESHED or INITIAL_SESSION events from the listener.
          // SIGNED_IN is handled by login() directly to avoid race conditions.
          if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
            setDataSource("supabase");
            setLoggedIn(true);
            await hydrateSupabase(nextSession.user.id);
          }
        } else {
          setLoggedIn(false);
          setUser(null);
          setConversations([]);
          setSwaps([]);
          setNotifications([]);
          setLoading({ profile: false, items: false, auth: false });
          // Re-fetch public items on logout
          const { data: publicItems } = await supabase
            .from("items")
            .select("*")
            .eq("is_active", true)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(100);
          if (publicItems) setItems(publicItems.map(mapItem));
          else setItems([]);
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    };

    void init();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [hydrateSupabase, supabase, supabaseConfigured]);

  // ── Real-time chat + swaps ──
  const { setTyping, markMessagesRead } = useRealtime({
    supabase,
    userId: user?.id ?? null,
    conversations,
    setConversations,
    setNotifications,
    setSwaps,
    mapSwapIntent,
  });

  // ── Auth actions ──
  const login = useCallback(
    async (email: string, password = "", acceptTerms = false): Promise<{ error?: string }> => {
      setLastError(null);
      if (!acceptTerms) {
        const error = "Bifează acceptarea Termeni & GDPR pentru a continua.";
        setLastError(error);
        return { error };
      }
      if (supabaseConfigured && supabase) {
        // signInWithPassword can deadlock on stale Navigator Locks.
        // Race it with a 8s timeout; on timeout, create a fresh client and retry once.
        const signIn = async (client: typeof supabase) => {
          const result = await Promise.race([
            client.auth.signInWithPassword({ email, password }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("signIn timeout")), 8_000),
            ),
          ]);
          return result;
        };

        let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
        try {
          result = await signIn(supabase);
        } catch {
          // Likely Navigator Lock deadlock — reset client and retry with a fresh instance
          console.warn("[login] signInWithPassword timed out, resetting Supabase client");
          resetSupabaseClient();
          const freshClient = getSupabaseClient();
          if (!freshClient) return { error: "Supabase client unavailable" };
          try {
            result = await signIn(freshClient);
          } catch {
            return { error: "Login timed out. Please refresh the page and try again." };
          }
        }

        const { data, error } = result;
        if (error) { setLastError(error.message); return { error: error.message }; }
        if (data.session?.user.id) {
          setLoggedIn(true);
          setDataSource("supabase");
          // Hydrate with a 10s timeout so login never hangs indefinitely
          try {
            await Promise.race([
              hydrateSupabase(data.session.user.id),
              new Promise((_, reject) => setTimeout(() => reject(new Error("hydration timeout")), 10_000)),
            ]);
          } catch (e) {
            console.warn("[login] hydration issue:", e);
            // Even if hydration fails/times out, the session is valid — clear loading so the UI proceeds
            setLoading((prev) => ({ ...prev, profile: false, items: false, auth: false }));
          }
        }
        return {};
      }
      setLoggedIn(true);
      setUser({ ...mockUser, email });
      setItems(mockItems);
      setConversations(mockConversations);
      setSwaps(mockSwaps);
      setNotifications([]);
      setLoading({ profile: false, items: false, auth: false });
      return {};
    },
    [supabaseConfigured, hydrateSupabase, supabase],
  );

  const logout = useCallback(async () => {
    // Clear any in-flight hydration lock first
    hydratingRef.current = null;
    setLoggedIn(false);
    setUser(null);
    setItems([]);
    setConversations([]);
    setSwaps([]);
    setNotifications([]);
    setLoading({ profile: false, items: false, auth: false });
    setLastError(null);
    if (dataSource === "supabase" && supabase) {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
      // Discard the Supabase client so the next login gets a fresh
      // instance without any stale Navigator Locks that could deadlock.
      resetSupabaseClient();
    }
    setDataSource(supabaseConfigured ? "supabase" : "mock");
  }, [dataSource, supabase, supabaseConfigured]);

  const register = useCallback(
    async (email: string, password = "", acceptTerms = false): Promise<{ error?: string }> => {
      setLastError(null);
      if (!acceptTerms) {
        const error = "Bifează acceptarea Termeni & GDPR pentru a continua.";
        setLastError(error);
        return { error };
      }
      if (supabaseConfigured && supabase) {
        const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { accepted_terms: acceptTerms, language },
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        });
        if (error) {
          // Supabase gateway timeout — the account is usually created despite the 504.
          // Tell the user to check their email instead of showing a cryptic error.
          const isTimeout =
            error.status === 504 ||
            error.message?.toLowerCase().includes("timeout") ||
            error.message?.toLowerCase().includes("gateway");
          if (isTimeout) {
            const msg =
              "Account may have been created. Please check your email for the confirmation link, then come back to log in. If you don't receive an email within a few minutes, try registering again.";
            setLastError(msg);
            return { error: msg };
          }
          setLastError(error.message); return { error: error.message };
        }
        // Detect fake success for already-registered emails (empty identities)
        if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
          const msg = "An account with this email may already exist. Try logging in or resetting your password.";
          setLastError(msg);
          return { error: msg };
        }
        if (data.session?.user.id) {
          setDataSource("supabase");
          await hydrateSupabase(data.session.user.id);
          // Send welcome email only when session exists (email auto-confirmed)
          try {
            await fetch("/api/email/welcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, name: email.split("@")[0] }),
            });
          } catch {
            // Welcome email is non-critical — don't block registration
          }
        }
        return {};
      }
      setUser({ ...mockUser, id: nanoid(), email, displayName: email.split("@")[0], badge: "free",
        stats: { ...mockUser.stats, tokens: 0, completedSwaps: 0, activeListings: 0 } });
      return {};
    },
    [supabaseConfigured, hydrateSupabase, language, supabase],
  );

  const changeEmail = useCallback(async (newEmail: string): Promise<{ error?: string }> => {
    setLastError(null);
    if (!newEmail.trim()) { const error = "Email-ul nu poate fi gol."; setLastError(error); return { error }; }
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) { setLastError(error.message); return { error: error.message }; }
      return {};
    }
    if (user) setUser({ ...user, email: newEmail });
    return {};
  }, [supabaseConfigured, supabase, user]);

  const changePassword = useCallback(async (newPassword: string): Promise<{ error?: string }> => {
    setLastError(null);
    if (newPassword.length < 6) { const error = "Parola trebuie să aibă cel puțin 6 caractere."; setLastError(error); return { error }; }
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setLastError(error.message); return { error: error.message }; }
      return {};
    }
    return {};
  }, [supabaseConfigured, supabase]);

  const resetPassword = useCallback(async (email: string): Promise<{ error?: string }> => {
    setLastError(null);
    if (!email.trim()) { const error = "Introduceți adresa de email."; setLastError(error); return { error }; }
    if (supabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/login`,
      });
      if (error) { setLastError(error.message); return { error: error.message }; }
      return {};
    }
    return {};
  }, [supabaseConfigured, supabase]);

  const deleteAccount = useCallback(async (): Promise<{ error?: string }> => {
    setLastError(null);
    if (supabaseConfigured && supabase && user?.id) {
      await supabase.from("items").delete().eq("owner_id", user.id);
      await supabase.from("notifications").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      await supabase.auth.signOut();
    }
    setLoggedIn(false);
    setUser(null);
    setItems([]);
    setConversations([]);
    setSwaps([]);
    setNotifications([]);
    return {};
  }, [supabaseConfigured, supabase, user?.id]);

  // ── Profile ──
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>, options?: { persist?: boolean }) => {
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));
      const currentUser = userRef.current;

      if (!options?.persist || !supabaseConfigured || !supabase) return;

      const userId = currentUser?.id ?? updates.id;
      if (!userId) {
        const message = "Cannot save profile: user not loaded yet.";
        setLastError(message);
        throw new Error(message);
      }

      setLastError(null);
      const merged = { ...currentUser, ...updates } as UserProfile;
      const emailLocal = (merged.email ?? "").split("@")[0] || "user";
      const username = merged.username
        || merged.displayName?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        || emailLocal;
      const fullName = merged.fullName
        || [merged.displayName, merged.firstName].filter(Boolean).join(" ")
        || merged.displayName
        || emailLocal;
      const orderedLanguages = Array.from(new Set(
        (merged.languages ?? []).filter(Boolean),
      )).slice(0, 3);
      if (orderedLanguages.length === 0) orderedLanguages.push(language);

      const legacyPayload: Record<string, unknown> = {
        user_id: userId,
        email: merged.email,
        username,
        full_name: fullName,
        display_name: merged.displayName,
        first_name: merged.firstName ?? null,
        avatar_url: merged.avatarUrl ?? null,
        bio: merged.bio ?? null,
        badge: merged.badge,
        languages: orderedLanguages,
        location: merged.location ?? {},
        location_text: [merged.location?.city, merged.location?.country]
          .filter(Boolean)
          .join(", ") || null,
        visibility: merged.visibility,
        notifications: merged.notifications,
        swap_preferences: merged.swapPreferences,
        security: merged.security,
        stats: merged.stats,
        updated_at: new Date().toISOString(),
      };
      const canonicalPayload: Record<string, unknown> = {
        username,
        full_name: fullName,
        display_name: merged.displayName,
        first_name: merged.firstName ?? null,
        avatar_url: merged.avatarUrl ?? null,
        bio: merged.bio ?? null,
        primary_language: orderedLanguages[0],
        secondary_language: orderedLanguages[1] ?? null,
        tertiary_language: orderedLanguages[2] ?? null,
        location: merged.location ?? {},
        location_text: [merged.location?.city, merged.location?.country]
          .filter(Boolean)
          .join(", ") || null,
        visibility: merged.visibility,
        notifications: merged.notifications,
        swap_preferences: merged.swapPreferences,
      };

      try {
        const saved = await updateOwnProfileWithCompatibility(supabase, {
          expectedRevision: profileRevisionRef.current,
          canonicalPayload,
          legacyPayload,
        });
        profileRevisionRef.current = saved.profileRevision;
        setUser(mapProfile(saved.profileRow));
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "Profile save failed.";
        setLastError(message);
        throw error;
      }

      if (merged.fullName && merged.avatarUrl && merged.location?.city) {
        supabase.rpc("complete_onboarding_step", {
          p_user_id: userId,
          p_step: "profile",
        }).then(({ error: rpcErr }) => {
          if (rpcErr) {
            console.error("[onboarding] complete_onboarding_step error:", rpcErr.message);
          }
        });
        supabase.from("onboarding_progress").upsert(
          { user_id: userId, step_profile: true },
          { onConflict: "user_id" },
        ).then(({ error: obErr }) => {
          if (obErr) {
            console.error("[onboarding] step_profile update error:", obErr.message);
          }
        });
      }
    },
    [language, mapProfile, supabase, supabaseConfigured],
  );

  // ── Feature slice hooks ──
  const itemActions = useItemActions({
    user, dataSource, supabase, setLastError, mapItem, items, setItems,
  });

  const chatActions = useChatActions({
    user, dataSource, supabase, setLastError, mapMessage, conversations, setConversations,
  });

  const swapActions = useSwapActions({
    user, dataSource, supabase, setLastError, mapSwapIntent,
    swaps, setSwaps, items, setNotifications, sendAuditLog, trackEvent,
  });

  const safetyActions = useSafetyActions({
    user, dataSource, supabase, setLastError, sendAuditLog,
    setNotifications, setBlockedUsers,
  });

  const monetization = useMonetization({
    user, items, swaps, trackEvent,
  });

  // ── New feature hooks ──
  const reviewsHook = useReviews({
    userId: user?.id ?? null,
    swaps,
    trackEvent,
  });

  const chainsHook = useSwapChains({
    userId: user?.id ?? null,
    trackEvent,
  });

  const verificationHook = useVerification({
    userId: user?.id ?? null,
    userEmail: user?.email,
    trackEvent,
  });

  const searchHook = useSearch({
    items,
    userId: user?.id ?? null,
    userCoordinates: user?.location?.coordinates,
  });

  const galleryHook = useImageGallery({
    userId: user?.id ?? null,
    trackEvent,
  });

  // ── Tier benefits ──
  const tierBenefits = useMemo(() => computeTierBenefits(user?.badge ?? "free"), [user?.badge]);

  // ── GDPR ──
  const exportUserData = useCallback(async (): Promise<string> => {
    if (!user) return "{}";
    return JSON.stringify({
      profile: user, items: items.filter((i) => i.ownerId === user.id),
      conversations, swaps: swaps.filter((s) => s.requesterId === user.id || s.responderId === user.id),
      notifications: notifications.filter((n) => n.userId === user.id),
      tokenLedger: monetization.tokenLedger.filter((t) => t.userId === user.id),
      achievements: monetization.achievements.filter((a) => a.unlockedAt),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }, [user, items, conversations, swaps, notifications, monetization.tokenLedger, monetization.achievements]);

  // ── Account management ──
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("active");

  const pauseAccount = useCallback(async () => {
    setAccountStatus("paused");
    for (const item of items.filter((i) => i.ownerId === user?.id && i.status === "active")) {
      await itemActions.setItemStatus(item.id, "paused");
    }
    trackEvent("account_paused");
  }, [items, user?.id, itemActions.setItemStatus, trackEvent]);

  const resumeAccount = useCallback(async () => {
    setAccountStatus("active");
    trackEvent("account_resumed");
  }, [trackEvent]);

  // ── House & Service profiles ──
  const updateHouseProfile = useCallback(async (profile: HouseProfile) => {
    if (!user) return;
    setUser((prev) => prev ? { ...prev, houseProfile: profile } : prev);
    trackEvent("house_profile_updated", { propertyType: profile.propertyType, swapMode: profile.swapMode });
  }, [user, trackEvent]);

  const addServiceProfile = useCallback(async (profile: ServiceProfile) => {
    if (!user) return;
    setUser((prev) => {
      if (!prev) return prev;
      const existing = prev.serviceProfiles ?? [];
      const idx = existing.findIndex((s) => s.skillName === profile.skillName);
      if (idx >= 0) { const updated = [...existing]; updated[idx] = profile; return { ...prev, serviceProfiles: updated }; }
      return { ...prev, serviceProfiles: [...existing, profile] };
    });
    trackEvent("service_profile_added", { category: profile.category, skill: profile.skillName });
  }, [user, trackEvent]);

  const removeServiceProfile = useCallback(async (skillName: string) => {
    if (!user) return;
    setUser((prev) => prev ? { ...prev, serviceProfiles: (prev.serviceProfiles ?? []).filter((s) => s.skillName !== skillName) } : prev);
    trackEvent("service_profile_removed", { skill: skillName });
  }, [user, trackEvent]);

  // ── Item limit ──
  const itemLimitReached = useMemo(() => {
    if (!user) return false;
    const ownItems = items.filter((i) => i.ownerId === user.id && i.status !== "archived");
    const limit = monetization.isBusiness ? 200 : tierBenefits.itemLimit;
    return ownItems.length >= limit;
  }, [user, items, monetization.isBusiness, tierBenefits.itemLimit]);

  // ── Demo mode ──
  const activateDemoMode = useCallback((count: number) => {
    const clamped = Math.max(100, Math.min(50_000, count));
    const demo = generateDemoData(clamped);
    setItems((prev) => [...prev, ...demo.items]);
    setMatches(demo.matches);
    setDemoMode(true);
    setDemoItemCount(clamped);
  }, []);

  const deactivateDemoMode = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.isDemo));
    setMatches([]);
    setDemoMode(false);
    setDemoItemCount(0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get("demo");
    if (demoParam) {
      const count = parseInt(demoParam, 10);
      if (!isNaN(count) && count > 0) activateDemoMode(count);
    }
  }, [activateDemoMode]);

  // ── Trust & Safety ──
  const trustScore = useMemo<TrustScore>(() => {
    if (!user) {
      return computeTrustScore({
        accountAgeDays: 0, emailVerified: false, phoneVerified: false,
        completedSwaps: 0, averageRating: 0, totalRatingsReceived: 0,
        reportsAgainst: 0, reportsDismissed: 0, noShowReportsAgainst: 0,
        isBlocked: false, profileCompleteness: 0, hasAvatar: false,
        hasLocation: false, consecutiveLoginDays: 0,
      });
    }
    const signals = buildTrustSignals(user, {
      accountAgeDays: user.createdAt
        ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000)
        : 0,
      emailVerified: true,
      reportsAgainst: 0,
      averageRating: 4.0,
      totalRatingsReceived: user.stats.completedSwaps,
      consecutiveLoginDays: monetization.loginStreak.currentStreak,
    });
    return computeTrustScore(signals);
  }, [user, monetization.loginStreak.currentStreak]);

  const frictionLimits = useMemo<FrictionLimits>(() => {
    return computeFriction(trustScore.score, 0);
  }, [trustScore.score]);

  const checkScam = useCallback((text: string) => checkMessageForScam(text), []);
  const safeMeetingChecklistVal = useMemo(() => SAFE_MEETING_CHECKLIST, []);
  const trustLevelConfigVal = useMemo(() => TRUST_LEVEL_CONFIG, []);

  // ── Feature Flags (Product Control) — loaded from Supabase with 5-min cache ──
  const {
    flags: featureFlags,
    isEnabled: isFeatureFlagEnabled,
    setFlag: setFeatureFlagRaw,
  } = useFeatureFlags(user?.id);
  const cronJobs = useMemo(() => DEFAULT_CRON_JOBS, []);

  const setFeatureFlag = useCallback((flagId: string, enabled: boolean) => {
    setFeatureFlagRaw(flagId, enabled);
    trackEvent("feature_flag_toggled", { flagId, enabled });
  }, [setFeatureFlagRaw, trackEvent]);

  const isFeatureEnabled = useCallback((flagId: string) => {
    return isFeatureFlagEnabled(flagId);
  }, [isFeatureFlagEnabled]);

  // ── Metrics Funnel ──
  const metricsFunnel = useMemo<MetricsFunnel>(() => {
    const usersWithItems = items.filter((i) => i.ownerId === user?.id).length > 0 ? 1 : 0;
    const usersWithChats = conversations.length > 0 ? 1 : 0;
    const usersWithSwaps = swaps.filter((s) => s.status === "pending" || s.status === "accepted").length > 0 ? 1 : 0;
    const completedSwaps = swaps.filter((s) => s.status === "completed").length;
    return computeMetricsFromState({
      totalUsers: user ? 1 : 0,
      usersWithItems,
      usersWithChats,
      usersWithSwaps,
      completedSwaps,
    });
  }, [user, items, conversations, swaps]);

  const funnelRates = useMemo(() => computeFunnelRates(metricsFunnel), [metricsFunnel]);

  // ── Context value ──
  const value = useMemo(() => ({
    user, dataSource, loading, lastError, announcements, notifications, items, matches,
    conversations, swaps, featureToggles, language, setLanguage, login, logout, register,
    resetPassword, deleteAccount, changeEmail, changePassword, updateProfile,
    // Item actions (from hook)
    upsertItem: itemActions.upsertItem,
    deleteItem: itemActions.deleteItem,
    duplicateItem: itemActions.duplicateItem,
    setItemStatus: itemActions.setItemStatus,
    startNewItem: itemActions.startNewItem,
    // Chat actions (from hook)
    ensureConversation: chatActions.ensureConversation,
    addMessage: chatActions.addMessage,
    toggleConversationTranslation: chatActions.toggleConversationTranslation,
    // Swap actions (from hook)
    proposeSwap: swapActions.proposeSwap,
    updateSwapStatus: swapActions.updateSwapStatus,
    addSwapFeedback: swapActions.addSwapFeedback,
    updateSwapLogistics: swapActions.updateSwapLogistics,
    confirmDelivery: swapActions.confirmDelivery,
    fileDispute: swapActions.fileDispute,
    // Safety actions (from hook)
    reportUser: safetyActions.reportUser,
    blockUser: safetyActions.blockUser,
    unblockUser: safetyActions.unblockUser,
    markNotificationRead: safetyActions.markNotificationRead,
    clearNotifications: safetyActions.clearNotifications,
    blockedUsers,
    // Monetization (from hook)
    tokenLedger: monetization.tokenLedger,
    tokenBalance: monetization.tokenBalance,
    loginStreak: monetization.loginStreak,
    claimDailyReward: monetization.claimDailyReward,
    referralCode: monetization.referralCode,
    referrals: monetization.referrals,
    sendReferralInvite: monetization.sendReferralInvite,
    giftTokens: monetization.giftTokens,
    featuredListings: monetization.featuredListings,
    purchaseFeaturedSlot: monetization.purchaseFeaturedSlot,
    purchaseInsurance: monetization.purchaseInsurance,
    isVerified: monetization.isVerified,
    purchaseVerifiedBadge: monetization.purchaseVerifiedBadge,
    activeTheme: monetization.activeTheme,
    purchaseTheme: monetization.purchaseTheme,
    activateTheme: monetization.activateTheme,
    isBusiness: monetization.isBusiness,
    purchaseBusinessUpgrade: monetization.purchaseBusinessUpgrade,
    subscription: monetization.subscription,
    activePromotions: monetization.activePromotions,
    swapMilestones: monetization.swapMilestones,
    loyaltyMilestones: monetization.loyaltyMilestones,
    hasFeature: monetization.hasFeature,
    achievements: monetization.achievements,
    shopItems: monetization.shopItems,
    purchaseShopItem: monetization.purchaseShopItem,
    // Remaining
    infoStats: mockInfoStats, tierBenefits, trackEvent,
    exportUserData, accountStatus, pauseAccount, resumeAccount, itemLimitReached,
    updateHouseProfile, addServiceProfile, removeServiceProfile,
    demoMode, demoItemCount, activateDemoMode, deactivateDemoMode,
    setTyping, markMessagesRead,
    // Trust & Safety
    trustScore, frictionLimits, checkScam,
    safeMeetingChecklist: safeMeetingChecklistVal,
    trustLevelConfig: trustLevelConfigVal,
    // Product Control
    featureFlags, setFeatureFlag, isFeatureEnabled,
    cronJobs, metricsFunnel, funnelRates,
    // ── Reviews ──
    reviews: reviewsHook.reviews,
    myReviews: reviewsHook.myReviews,
    receivedReviews: reviewsHook.receivedReviews,
    submitReview: reviewsHook.submitReview,
    respondToReview: reviewsHook.respondToReview,
    getUserRating: reviewsHook.getUserRating,
    canReview: reviewsHook.canReview,
    // ── Swap Chains ──
    swapChains: chainsHook.chains,
    myChains: chainsHook.myChains,
    pendingChainConfirmations: chainsHook.pendingConfirmations,
    detectedChainOpportunities: chainsHook.detectedOpportunities,
    detectingChains: chainsHook.detecting,
    createChain: chainsHook.createChain,
    confirmChainLink: chainsHook.confirmChainLink,
    startChain: chainsHook.startChain,
    completeChain: chainsHook.completeChain,
    cancelChain: chainsHook.cancelChain,
    detectChains: chainsHook.detectChains,
    // ── Search & Discovery ──
    searchFilters: searchHook.filters,
    searchResults: searchHook.results,
    searchTotalResults: searchHook.totalResults,
    searchCategoryCounts: searchHook.categoryCounts,
    searchLocationCounts: searchHook.locationCounts,
    savedSearches: searchHook.savedSearches,
    updateSearchFilters: searchHook.updateFilters,
    clearSearchFilters: searchHook.clearFilters,
    saveSearch: searchHook.saveSearch,
    removeSavedSearch: searchHook.removeSavedSearch,
    // ── Image Gallery ──
    imageUploading: galleryHook.uploading,
    imageUploadProgress: galleryHook.uploadProgress,
    maxImagesPerItem: galleryHook.maxImages,
    uploadImages: galleryHook.uploadImages,
    deleteImage: galleryHook.deleteImage,
    reorderImages: galleryHook.reorderImages,
    updateImageCaption: galleryHook.updateCaption,
    setImageAsCover: galleryHook.setAsCover,
    // ── Verification ──
    verifications: verificationHook.verifications,
    verificationBadges: verificationHook.badges,
    requestEmailVerification: verificationHook.requestEmailVerification,
    verifyEmailCode: verificationHook.verifyEmailCode,
    requestPhoneVerification: verificationHook.requestPhoneVerification,
    verifyPhoneCode: verificationHook.verifyPhoneCode,
    submitIdDocument: verificationHook.submitIdDocument,
    submitSelfie: verificationHook.submitSelfie,
  }), [
    dataSource, loading, lastError, announcements, notifications, conversations,
    featureToggles, items, login, resetPassword, deleteAccount, changeEmail,
    changePassword, logout, matches, register, swaps,
    updateProfile, blockedUsers,
    // Item actions
    itemActions.upsertItem, itemActions.deleteItem, itemActions.duplicateItem,
    itemActions.setItemStatus, itemActions.startNewItem,
    // Chat actions
    chatActions.ensureConversation, chatActions.addMessage, chatActions.toggleConversationTranslation,
    // Swap actions
    swapActions.proposeSwap, swapActions.updateSwapStatus, swapActions.addSwapFeedback,
    swapActions.updateSwapLogistics, swapActions.confirmDelivery, swapActions.fileDispute,
    // Safety actions
    safetyActions.reportUser, safetyActions.blockUser, safetyActions.unblockUser,
    safetyActions.markNotificationRead, safetyActions.clearNotifications,
    // Monetization
    monetization.tokenLedger, monetization.tokenBalance, monetization.loginStreak,
    monetization.claimDailyReward, monetization.referralCode, monetization.referrals,
    monetization.sendReferralInvite, monetization.giftTokens, monetization.featuredListings,
    monetization.purchaseFeaturedSlot, monetization.purchaseInsurance, monetization.isVerified,
    monetization.purchaseVerifiedBadge, monetization.activeTheme, monetization.purchaseTheme,
    monetization.activateTheme, monetization.isBusiness, monetization.purchaseBusinessUpgrade,
    monetization.subscription, monetization.activePromotions, monetization.swapMilestones,
    monetization.loyaltyMilestones, monetization.hasFeature, monetization.achievements,
    monetization.shopItems, monetization.purchaseShopItem,
    // Reviews
    reviewsHook.reviews, reviewsHook.myReviews, reviewsHook.receivedReviews,
    reviewsHook.submitReview, reviewsHook.respondToReview, reviewsHook.getUserRating, reviewsHook.canReview,
    // Swap Chains
    chainsHook.chains, chainsHook.myChains, chainsHook.pendingConfirmations,
    chainsHook.createChain, chainsHook.confirmChainLink, chainsHook.startChain,
    chainsHook.completeChain, chainsHook.cancelChain,
    // Search
    searchHook.filters, searchHook.results, searchHook.totalResults,
    searchHook.categoryCounts, searchHook.locationCounts, searchHook.savedSearches,
    searchHook.updateFilters, searchHook.clearFilters, searchHook.saveSearch, searchHook.removeSavedSearch,
    // Gallery
    galleryHook.uploading, galleryHook.uploadProgress, galleryHook.maxImages,
    galleryHook.uploadImages, galleryHook.deleteImage, galleryHook.reorderImages,
    galleryHook.updateCaption, galleryHook.setAsCover,
    // Verification
    verificationHook.verifications, verificationHook.badges,
    verificationHook.requestEmailVerification, verificationHook.verifyEmailCode,
    verificationHook.requestPhoneVerification, verificationHook.verifyPhoneCode,
    verificationHook.submitIdDocument, verificationHook.submitSelfie,
    // Remaining
    language, setLanguage, user, tierBenefits, trackEvent,
    exportUserData, accountStatus, pauseAccount, resumeAccount, itemLimitReached,
    updateHouseProfile, addServiceProfile, removeServiceProfile,
    demoMode, demoItemCount, activateDemoMode, deactivateDemoMode,
    setTyping, markMessagesRead, trustScore, frictionLimits, checkScam,
    safeMeetingChecklistVal, trustLevelConfigVal,
    featureFlags, setFeatureFlag, isFeatureEnabled, cronJobs, metricsFunnel, funnelRates,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
