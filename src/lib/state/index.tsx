"use client";

/**
 * Application state provider — orchestrates all state modules.
 * Refactored from monolithic state.tsx into modular imports.
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
import { getSupabaseClient } from "../supabase/client";
import type {
  AccountStatus,
  Achievement,
  AchievementId,
  AnalyticsEvent,
  Announcement,
  ChatMessage,
  Conversation,
  FeatureToggle,
  HouseProfile,
  Item,
  LanguageCode,
  MatchCandidate,
  Notification,
  ServiceProfile,
  ShopItem,
  SwapIntent,
  SwapType,
  TierBenefits,
  TokenLedgerEntry,
  TokenShopItem,
  UserProfile,
} from "../types";
import {
  createEmptyItem,
  mockAnnouncements,
  mockConversations,
  mockFeatureToggles,
  mockInfoStats,
  mockItems,
  mockSwaps,
  mockUser,
} from "../mock-data";
import { generateDemoData } from "../demo-generator";
import {
  ALL_SHOP_ITEMS,
  applyPromoDiscount,
  computeBalance,
  computeStreak,
  generateReferralCode,
  getActivePromotions,
  getStreakReward,
  getSwapMilestones,
  getTokenMultiplier,
  getUnclaimedMilestoneBonus,
  getLoyaltyMilestones,
  computeDaysActive,
  GIFT_MIN,
  GIFT_MAX,
  INSURANCE_COST,
  FEATURED_COST,
  FEATURED_DURATION_HOURS,
  REFERRAL_REWARD_REFERRED,
  REFERRAL_REWARD_REFERRER,
  VERIFIED_BADGE_COST,
  BUSINESS_UPGRADE_COST,
  validateGiftAmount,
  hasFeatureAccess,
  TOKEN_PACKAGES,
  SUBSCRIPTION_PLANS,
  PROFILE_THEMES,
  LOYALTY_MILESTONES,
  SWAP_MILESTONES,
  DEFAULT_PROMOTIONS,
} from "../monetization";
import type {
  FeaturedListing,
  LoginStreak,
  LoyaltyMilestone,
  Referral,
  SeasonalPromotion,
  SwapInsurance,
  SwapMilestone,
  TokenGift,
  UserSubscription,
} from "../types";
import type { PremiumFeature } from "../monetization";
import type {
  TrustScore,
  FrictionLimits,
  ScamCheckResult,
  TrustSignals,
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
import type { MatchingUserContext, OwnerCoordinatesMap } from "./matching";

// ── Extracted modules ──
import {
  computeFeatureToggles,
  computeTierBenefits,
  makeDmConversationId,
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
}

const AppStateContext = createContext<AppStateContextProps | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
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

  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("swaply_language");
    if (saved) {
      const locales: string[] = [
        "en","ro","fr","de","es","it","pt","nl","pl","el",
        "hu","bg","cs","sk","hr","sl","sr","sv","da","fi",
        "no","lt","lv","et","ga","mt","ru","tr","ar","zh",
        "hi","bn","ja","ko","vi","th","id","ms","fil","fa",
        "mn","uk",
      ];
      if (locales.includes(saved)) return saved as LanguageCode;
    }
    return "en";
  });

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
      setLastError(null);
      setLoading((prev) => ({ ...prev, profile: true, items: true }));

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) setLastError(profileError.message);

      if (profileData) {
        setUser(mapProfile(profileData));
      } else if (supabaseConfigured) {
        const session = await supabase.auth.getSession();
        const email = session.data.session?.user.email ?? "";
        const newProfile = mapProfile({ id: userId, email });
        setUser(newProfile);

        const emailLocal = email.split("@")[0] || "user";
        const { error: insertError } = await supabase.from("profiles").upsert({
          user_id: userId,
          email,
          username: emailLocal,
          full_name: emailLocal,
          display_name: emailLocal,
          badge: "free",
          languages: ["ro"],
          location: {},
          visibility: newProfile.visibility,
          notifications: newProfile.notifications,
          swap_preferences: newProfile.swapPreferences,
          security: newProfile.security,
          stats: newProfile.stats,
        }, { onConflict: "user_id" });
        if (insertError) setLastError(insertError.message);
      }

      const [
        { data: itemsData, error: itemsError },
        { data: swapsData, error: swapsError },
        { data: notificationsData, error: notificationsError },
        { data: messagesData, error: messagesError },
      ] = await Promise.all([
        supabase.from("items").select("*")
          .is("deleted_at", null)
          .or(`is_active.eq.true,owner_id.eq.${userId}`)
          .order("created_at", { ascending: false }),
        supabase.from("swap_intents").select("*")
          .or(`requester_id.eq.${userId},responder_id.eq.${userId}`)
          .order("updated_at", { ascending: false }),
        supabase.from("notifications").select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("messages").select("*")
          .ilike("conversation_id", `%${userId}%`)
          .order("created_at", { ascending: true })
          .limit(1000),
      ]);

      if (itemsError) setLastError(itemsError.message);
      if (itemsData) setItems(itemsData.map(mapItem));

      if (swapsError) setLastError(swapsError.message);
      if (swapsData) setSwaps(swapsData.map(mapSwapIntent));

      if (notificationsError) setLastError(notificationsError.message);
      if (notificationsData) setNotifications(notificationsData.map(mapNotification));

      if (messagesError) setLastError(messagesError.message);
      if (messagesData) {
        const mappedMessages = messagesData.map(mapMessage);
        const byConversation = new Map<string, ChatMessage[]>();
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
            .from("profiles").select("user_id, display_name, badge")
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
    },
    [mapItem, mapMessage, mapNotification, mapProfile, mapSwapIntent, supabase, supabaseConfigured],
  );

  // ── Auth listener ──
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    let unsubscribe: (() => void) | undefined;
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setLastError(error.message);
        setDataSource("mock");
        setUser(mockUser);
        setItems(mockItems);
        setConversations(mockConversations);
        setSwaps(mockSwaps);
        setNotifications([]);
        setLoading({ profile: false, items: false, auth: false });
        return;
      }

      const session = data.session;
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
          .is("deleted_at", null)
          .eq("is_active", true)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(100);
        if (publicItems) setItems(publicItems.map(mapItem));
        else setItems([]);
        setLoading((prev) => ({ ...prev, auth: false, profile: false, items: false }));
      }

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (nextSession?.user?.id) {
          setDataSource("supabase");
          setLoggedIn(true);
          await hydrateSupabase(nextSession.user.id);
        } else {
          setLoggedIn(false);
          setUser(null);
          setConversations([]);
          setSwaps([]);
          setNotifications([]);
          // Re-fetch public items on logout
          const { data: publicItems } = await supabase
            .from("items")
            .select("*")
            .is("deleted_at", null)
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

  // ── Real-time chat ──
  const { setTyping, markMessagesRead } = useRealtime({
    supabase,
    userId: user?.id ?? null,
    conversations,
    setConversations,
    setNotifications,
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setLastError(error.message); return { error: error.message }; }
        if (data.session?.user.id) {
          setLoggedIn(true);
          setDataSource("supabase");
          await hydrateSupabase(data.session.user.id);
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
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { accepted_terms: acceptTerms, language } },
        });
        if (error) { setLastError(error.message); return { error: error.message }; }
        if (data.session?.user.id) {
          setDataSource("supabase");
          await hydrateSupabase(data.session.user.id);
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
      if (options?.persist && supabaseConfigured && supabase) {
        const userId = currentUser?.id ?? updates.id;
        if (!userId) {
          const msg = "Cannot save profile: user not loaded yet.";
          setLastError(msg);
          throw new Error(msg);
        }
        setLastError(null);
        const merged = { ...currentUser, ...updates };
        const emailLocal = (merged.email ?? "").split("@")[0] || "user";
        const payload: Record<string, unknown> = {
          user_id: userId, email: merged.email,
          username: merged.username || merged.displayName?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || emailLocal,
          full_name: merged.fullName || [merged.displayName, merged.firstName].filter(Boolean).join(" ") || merged.displayName || emailLocal,
          display_name: merged.displayName,
          first_name: merged.firstName ?? null, avatar_url: merged.avatarUrl ?? null,
          bio: merged.bio ?? null, badge: merged.badge, languages: merged.languages,
          location: merged.location ?? {},
          location_text: [merged.location?.city, merged.location?.country].filter(Boolean).join(", ") || null,
          visibility: merged.visibility,
          notifications: merged.notifications, swap_preferences: merged.swapPreferences,
          security: merged.security, stats: merged.stats,
          updated_at: new Date().toISOString(),
        };
        const { error, data } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" }).select().maybeSingle();
        if (error) { setLastError(error.message); throw new Error(error.message); }
        else if (data) setUser(mapProfile(data));

        // Mark onboarding step_profile when avatar + bio + location are all present
        if (merged.avatarUrl && merged.bio && merged.location?.city) {
          supabase.rpc("complete_onboarding_step", { p_user_id: userId, p_step: "profile" }).then(({ error: rpcErr }) => {
            if (rpcErr) console.error("[onboarding] complete_onboarding_step error:", rpcErr.message);
          });
        }
      }
    },
    [supabaseConfigured, mapProfile, supabase],
  );

  // ── Items (with optimistic updates + soft delete) ──
  const upsertItem = useCallback(
    async (item: Item) => {
      // Optimistic update — apply immediately
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = item; return next; }
        return [item, ...prev];
      });

      if (dataSource === "supabase" && supabase && user?.id) {
        const payload = {
          id: item.id, owner_id: user.id, title: item.title,
          category: item.category, condition: item.condition,
          description: item.description, wishlist: item.wishlist,
          status: item.status, is_active: item.isActive ?? true,
          is_demo: item.isDemo ?? false, location: item.location,
          ai_suggested_tags: item.aiSuggestedTags ?? [],
          user_final_tags: item.userFinalTags ?? [], photos: item.photos ?? [],
          ai_metadata: {
            intent: item.intent ?? null, flexibility: item.flexibility ?? null,
            perceivedValue: item.perceivedValue ?? null, clarity: item.clarity ?? null,
            context: item.context ?? null, acceptsBundle: item.acceptsBundle ?? false,
            recipientMatters: item.recipientMatters ?? false,
            conditionImpact: item.conditionImpact ?? [], aiNote: item.aiNote ?? null,
          },
          updated_at: new Date().toISOString(),
        };

        const query = item.id
          ? supabase.from("items").upsert(payload).select().maybeSingle()
          : supabase.from("items").insert(payload).select().maybeSingle();

        const { data, error } = await query;
        if (error) {
          setLastError(error.message);
          // Revert optimistic update on error
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          return null;
        }
        if (data) {
          const mapped = mapItem(data);
          setItems((prev) => {
            const idx = prev.findIndex((i) => i.id === mapped.id);
            if (idx >= 0) { const next = [...prev]; next[idx] = mapped; return next; }
            return [mapped, ...prev];
          });
          return mapped;
        }
      }
      return item;
    },
    [dataSource, mapItem, supabase, user],
  );

  // Soft delete: set deleted_at instead of hard delete
  const deleteItem = useCallback(
    async (id: string) => {
      // Optimistic: remove from list immediately
      const previousItems = items;
      setItems((prev) => prev.filter((i) => i.id !== id));

      if (dataSource === "supabase" && supabase) {
        const { error } = await supabase
          .from("items")
          .update({ deleted_at: new Date().toISOString(), is_active: false })
          .eq("id", id);
        if (error) {
          setLastError(error.message);
          // Revert on error
          setItems(previousItems);
        }
      }
    },
    [dataSource, items, supabase],
  );

  const duplicateItem = useCallback(async (id: string) => {
    const source = items.find((i) => i.id === id);
    if (!source || !user?.id) return null;
    const copy: Item = { ...source, id: crypto.randomUUID(), title: `${source.title} (copy)`,
      status: "active", isActive: true, createdAt: new Date().toISOString() };
    return upsertItem(copy);
  }, [items, upsertItem, user]);

  const setItemStatus = useCallback(async (id: string, status: Item["status"]) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await upsertItem({ ...item, status, isActive: status === "active" });
  }, [items, upsertItem]);

  // ── Chat ──
  const ensureConversation = useCallback(
    async (participantId: string) => {
      if (!user?.id || !participantId || participantId === user.id) return null;
      const conversationId = makeDmConversationId(user.id, participantId);
      if (conversations.some((c) => c.id === conversationId)) return conversationId;

      let participantName = `Utilizator ${participantId.slice(0, 8)}`;
      let participantBadge: UserProfile["badge"] = "free";

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("profiles")
          .select("user_id, display_name, badge").eq("user_id", participantId).maybeSingle();
        if (error) setLastError(error.message);
        else if (data) {
          participantName = safeString(data.display_name, participantName);
          participantBadge = safeBadgeTier(data.badge, participantBadge);
        }
      }

      setConversations((prev) => [{
        id: conversationId, participantId, participantName, participantBadge,
        lastMessage: "", updatedAt: new Date().toISOString(), messages: [], translationEnabled: false,
      }, ...prev]);
      return conversationId;
    },
    [conversations, dataSource, supabase, user?.id],
  );

  const addMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!user?.id) return;
      setLastError(null);

      const now = new Date().toISOString();
      const optimisticMessage: ChatMessage = {
        id: nanoid(), conversationId, senderId: user.id, content, createdAt: now, attachments: [],
      };

      // Optimistic: add message immediately
      setConversations((prev) => prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, optimisticMessage], lastMessage: content, updatedAt: now }
          : c,
      ));

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("messages")
          .insert({ conversation_id: conversationId, sender_id: user.id, content,
            attachments: [], translated: false, moderated: false })
          .select("*").maybeSingle();

        if (error) {
          setLastError(error.message);
          // Revert optimistic message on error
          setConversations((prev) => prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.filter((m) => m.id !== optimisticMessage.id) }
              : c,
          ));
          return;
        }

        if (data) {
          const inserted = mapMessage(data);
          // Replace optimistic message with server response
          setConversations((prev) => prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.map((m) => m.id === optimisticMessage.id ? inserted : m),
                  lastMessage: inserted.content, updatedAt: inserted.createdAt }
              : c,
          ));
        }
      }
    },
    [dataSource, mapMessage, supabase, user?.id],
  );

  const toggleConversationTranslation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.map((c) =>
      c.id === conversationId ? { ...c, translationEnabled: !c.translationEnabled } : c,
    ));
  }, []);

  // ── Swaps ──
  const proposeSwap = useCallback(
    async ({ requesterItemId, responderItemId, responderId, swapType, requesterBundleIds, responderBundleIds }: {
      requesterItemId: string; responderItemId: string; responderId: string;
      swapType?: SwapType; requesterBundleIds?: string[]; responderBundleIds?: string[];
    }) => {
      if (!user?.id || !requesterItemId || !responderItemId || !responderId || responderId === user.id) return null;
      setLastError(null);

      const logistics: SwapIntent["logistics"] = {
        locationType: user.swapPreferences.logistics === "courier" ? "courier" : "public_spot",
      };

      if (dataSource === "supabase" && supabase) {
        // Check item availability (lock status) before proposing swap
        const [reqAvail, resAvail] = await Promise.all([
          supabase.rpc("is_item_available", { item_uuid: requesterItemId }),
          supabase.rpc("is_item_available", { item_uuid: responderItemId }),
        ]);
        if (reqAvail.data === false) {
          setLastError("Obiectul tău nu mai este disponibil");
          return null;
        }
        if (resAvail.data === false) {
          setLastError("Obiectul nu mai este disponibil");
          return null;
        }

        const { data, error } = await supabase.from("swap_intents")
          .insert({ requester_id: user.id, responder_id: responderId,
            requester_item_id: requesterItemId, responder_item_id: responderItemId,
            status: "proposed", logistics, notifications: ["Propunere swap trimisă."],
            updated_at: new Date().toISOString() })
          .select("*").maybeSingle();
        if (error) { setLastError(error.message); return null; }
        if (!data) return null;
        const mapped = mapSwapIntent(data);
        setSwaps((prev) => [mapped, ...prev.filter((s) => s.id !== mapped.id)]);
        return mapped;
      }

      const now = new Date().toISOString();
      const localSwap: SwapIntent = {
        id: nanoid(), requesterId: user.id, responderId, requesterItemId, responderItemId,
        swapType: swapType ?? "object", requesterBundleIds, responderBundleIds,
        status: "proposed", logistics, notifications: ["Propunere swap trimisă."], createdAt: now, updatedAt: now,
      };
      setSwaps((prev) => [localSwap, ...prev]);

      const reqItem = items.find((i) => i.id === requesterItemId);
      const resItem = items.find((i) => i.id === responderItemId);
      setNotifications((prev) => [{
        id: `swap-new-${localSwap.id}`, userId: user.id, type: "swap_proposed",
        message: `Propunere de schimb trimisă: ${reqItem?.title ?? "?"} ↔ ${resItem?.title ?? "?"}`,
        read: false, priority: "info", createdAt: now,
      }, ...prev]);
      return localSwap;
    },
    [dataSource, items, mapSwapIntent, supabase, user],
  );

  const updateSwapStatus = useCallback(
    async (swapId: string, status: SwapIntent["status"]) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((s) => s.id === swapId);
      const nextNotifications = [...(existing?.notifications ?? []), `Status actualizat: ${status}`];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("swap_intents")
          .update({ status, notifications: nextNotifications, updated_at: new Date().toISOString() })
          .eq("id", swapId).select("*").maybeSingle();
        if (error) { setLastError(error.message); return; }
        if (data) { const mapped = mapSwapIntent(data); setSwaps((prev) => prev.map((s) => s.id === swapId ? mapped : s)); }
        sendAuditLog({ userId: user?.id ?? "", action: "swap.status_changed", entityType: "swap", entityId: swapId, oldData: { status: existing?.status }, newData: { status } });
        return;
      }

      setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status, notifications: nextNotifications } : s));
      sendAuditLog({ userId: user?.id ?? "", action: "swap.status_changed", entityType: "swap", entityId: swapId, oldData: { status: existing?.status }, newData: { status } });

      const statusMessages: Record<string, string> = {
        scheduled: "Schimbul a fost programat!",
        in_progress: "Schimbul este în desfășurare.",
        completed: "Schimbul a fost finalizat cu succes!",
        cancelled: "Schimbul a fost anulat.",
      };
      if (statusMessages[status]) {
        const reqItem = items.find((i) => i.id === existing?.requesterItemId);
        const resItem = items.find((i) => i.id === existing?.responderItemId);
        setNotifications((prev) => [{
          id: `swap-${swapId}-${status}-${Date.now()}`, userId: user?.id ?? "", type: "swap_update",
          message: `${statusMessages[status]} (${reqItem?.title ?? "?"} ↔ ${resItem?.title ?? "?"})`,
          read: false,
          priority: status === "completed" ? "success" : status === "cancelled" ? "warning" : "info",
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
    },
    [dataSource, items, mapSwapIntent, sendAuditLog, supabase, swaps, user?.id],
  );

  const addSwapFeedback = useCallback(
    async (swapId: string, rating: number, comment: string) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((s) => s.id === swapId);
      const nextNot = [...(existing?.notifications ?? []), "Feedback trimis."];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("swap_intents")
          .update({ feedback: { rating, comment }, notifications: nextNot, updated_at: new Date().toISOString() })
          .eq("id", swapId).select("*").maybeSingle();
        if (error) { setLastError(error.message); return; }
        if (data) { const mapped = mapSwapIntent(data); setSwaps((prev) => prev.map((s) => s.id === swapId ? mapped : s)); }
        return;
      }
      setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, feedback: { rating, comment }, notifications: nextNot } : s));
    },
    [dataSource, mapSwapIntent, supabase, swaps],
  );

  const updateSwapLogistics = useCallback(
    async (swapId: string, logistics: SwapIntent["logistics"]) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((s) => s.id === swapId);
      const nextNot = [...(existing?.notifications ?? []), `Logistics updated: ${logistics.locationType}`];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("swap_intents")
          .update({ logistics, notifications: nextNot, updated_at: new Date().toISOString() })
          .eq("id", swapId).select("*").maybeSingle();
        if (error) { setLastError(error.message); return; }
        if (data) { const mapped = mapSwapIntent(data); setSwaps((prev) => prev.map((s) => s.id === swapId ? mapped : s)); }
        return;
      }
      setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, logistics, notifications: nextNot } : s));
    },
    [dataSource, mapSwapIntent, supabase, swaps],
  );

  // ── Analytics (moved before confirmDelivery so trackEvent is available) ──
  const analyticsBuffer = useRef<AnalyticsEvent[]>([]);
  const trackEvent = useCallback((event: string, properties?: Record<string, string | number | boolean>) => {
    analyticsBuffer.current.push({ event, properties, timestamp: new Date().toISOString() });
    if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, properties ?? "");
  }, []);

  // ── Confirm Delivery / File Dispute ──
  const confirmDelivery = useCallback(async (swapId: string, side: "requester" | "responder") => {
    if (!user?.id) return;
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;

    const field = side === "requester" ? "requesterConfirmed" : "responderConfirmed";
    const otherConfirmed = side === "requester" ? swap.responderConfirmed : swap.requesterConfirmed;

    const updated = { ...swap, [field]: true };
    // If both confirmed → auto-complete
    if (otherConfirmed) {
      updated.status = "completed";
      updated.notifications = [...updated.notifications, "Ambele părți au confirmat. Schimb finalizat!"];
    } else {
      updated.notifications = [...updated.notifications, `${side === "requester" ? "Solicitantul" : "Partenerul"} a confirmat predarea.`];
    }

    setSwaps((prev) => prev.map((s) => s.id === swapId ? updated : s));

    if (dataSource === "supabase" && supabase) {
      const payload: Record<string, unknown> = {
        [side === "requester" ? "requester_confirmed" : "responder_confirmed"]: true,
        notifications: updated.notifications,
        updated_at: new Date().toISOString(),
      };
      if (otherConfirmed) payload.status = "completed";
      await supabase.from("swap_intents").update(payload).eq("id", swapId);
    }

    trackEvent("swap_delivery_confirmed", { swapId, side });
    if (otherConfirmed) trackEvent("swap_auto_completed", { swapId });
  }, [user?.id, swaps, dataSource, supabase, trackEvent]);

  const fileDispute = useCallback(async (
    swapId: string,
    reason: "item_not_received" | "wrong_item" | "damaged" | "condition_mismatch" | "no_show" | "other",
    description: string,
    photos?: string[],
  ) => {
    if (!user?.id) return;
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;

    const dispute: NonNullable<SwapIntent["dispute"]> = {
      filedBy: user.id,
      reason,
      description,
      evidencePhotos: photos ?? [],
      status: "open",
      filedAt: new Date().toISOString(),
    };

    const updated = {
      ...swap,
      status: "disputed" as const,
      dispute,
      notifications: [...swap.notifications, `Dispută deschisă: ${reason}`],
    };

    setSwaps((prev) => prev.map((s) => s.id === swapId ? updated : s));

    if (dataSource === "supabase" && supabase) {
      await supabase.from("swap_intents").update({
        status: "disputed",
        dispute,
        notifications: updated.notifications,
        updated_at: new Date().toISOString(),
      }).eq("id", swapId);
    }

    setNotifications((prev) => [{
      id: `dispute-${swapId}-${Date.now()}`,
      userId: user.id,
      type: "dispute_filed",
      message: `Dispută deschisă pentru schimbul ${swap.requesterItemId.slice(0, 8)}`,
      read: false,
      priority: "warning",
      createdAt: new Date().toISOString(),
    }, ...prev]);

    trackEvent("dispute_filed", { swapId, reason });
  }, [user?.id, swaps, dataSource, supabase, trackEvent]);

  // ── Safety ──
  const reportUser = useCallback(
    async (params: { reportedUserId: string; reportedItemId?: string; reason: string; description?: string }) => {
      if (!user?.id) return;
      setLastError(null);
      if (dataSource === "supabase" && supabase) {
        const payload: Record<string, unknown> = {
          reporter_id: user.id, reported_user_id: params.reportedUserId,
          reason: params.reason, description: params.description ?? "", status: "pending",
        };
        if (params.reportedItemId) payload.reported_item_id = params.reportedItemId;
        const { error } = await supabase.from("abuse_reports").insert(payload);
        if (error) setLastError(error.message);
        sendAuditLog({ userId: user.id, action: "user.reported", entityType: "user", entityId: params.reportedUserId, newData: { reason: params.reason, reportedItemId: params.reportedItemId } });
      }
    },
    [dataSource, sendAuditLog, supabase, user?.id],
  );

  const blockUser = useCallback(async (targetUserId: string) => {
    if (!user?.id || !targetUserId) return;
    setLastError(null);
    if (dataSource === "supabase" && supabase) {
      const { error } = await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: targetUserId });
      if (error) setLastError(error.message);
    }
    setBlockedUsers((prev) => [...prev, targetUserId]);
    sendAuditLog({ userId: user?.id ?? "", action: "user.blocked", entityType: "user", entityId: targetUserId });
  }, [dataSource, sendAuditLog, supabase, user?.id]);

  const unblockUser = useCallback(async (targetUserId: string) => {
    if (!user?.id || !targetUserId) return;
    setLastError(null);
    if (dataSource === "supabase" && supabase) {
      const { error } = await supabase.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", targetUserId);
      if (error) setLastError(error.message);
    }
    setBlockedUsers((prev) => prev.filter((id) => id !== targetUserId));
  }, [dataSource, supabase, user?.id]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    if (!notificationId) return;
    setLastError(null);
    if (dataSource === "supabase" && supabase) {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
      if (error) setLastError(error.message);
    }
    setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
  }, [dataSource, supabase]);

  const startNewItem = useCallback(() => {
    if (!user) return null;
    const item = createEmptyItem(user.id);
    if (user.location?.city) item.location = user.location.city;
    return item;
  }, [user]);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  // ── Monetization ──
  const [tokenLedger, setTokenLedger] = useState<TokenLedgerEntry[]>(() => {
    if (!user) return [];
    return [{ id: nanoid(), userId: user?.id ?? "", amount: 10, reason: "signup_bonus" as const,
      description: "Welcome bonus", createdAt: new Date().toISOString() }];
  });

  const tierBenefits = useMemo(() => computeTierBenefits(user?.badge ?? "free"), [user?.badge]);

  // Token grants on swap completion
  useEffect(() => {
    const completedSwaps = swaps.filter((s) => s.status === "completed");
    const grantedSwapIds = new Set(tokenLedger.filter((e) => e.reason === "swap_completed").map((e) => e.description));
    for (const swap of completedSwaps) {
      if (!grantedSwapIds.has(swap.id) && user?.id) {
        setTokenLedger((prev) => [...prev, {
          id: nanoid(), userId: user.id, amount: 5, reason: "swap_completed" as const,
          description: swap.id, createdAt: new Date().toISOString(),
        }]);
        trackEvent("tokens_granted", { amount: 5, reason: "swap_completed", swapId: swap.id });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swaps, user?.id]);

  // ── Achievements ──
  const achievements = useMemo<Achievement[]>(() => {
    if (!user) return [];
    const cs = user.stats.completedSwaps;
    const ti = items.filter((i) => i.ownerId === user.id).length;
    const defs: { id: AchievementId; title: string; icon: string; target: number; current: number; desc: string }[] = [
      { id: "first_swap", title: "First Swap", icon: "🔄", target: 1, current: cs, desc: "Complete your first swap" },
      { id: "five_swaps", title: "Swap Veteran", icon: "🏅", target: 5, current: cs, desc: "Complete 5 swaps" },
      { id: "ten_swaps", title: "Swap Master", icon: "🏆", target: 10, current: cs, desc: "Complete 10 swaps" },
      { id: "twenty_five_swaps", title: "Swap Legend", icon: "👑", target: 25, current: cs, desc: "Complete 25 swaps" },
      { id: "first_listing", title: "First Listing", icon: "📦", target: 1, current: ti, desc: "List your first item" },
      { id: "ten_listings", title: "Collector", icon: "🗄️", target: 10, current: ti, desc: "List 10 items" },
      { id: "eco_warrior", title: "Eco Warrior", icon: "🌿", target: 3, current: cs, desc: "Save the planet with 3 swaps" },
      { id: "house_swapper", title: "Home Exchange", icon: "🏠", target: 1, current: 0, desc: "Complete a house swap" },
      { id: "service_provider", title: "Service Star", icon: "⚡", target: 1, current: 0, desc: "Complete a service swap" },
      { id: "premium_member", title: "Premium", icon: "💎", target: 1, current: user.badge !== "free" ? 1 : 0, desc: "Upgrade to premium" },
      { id: "early_adopter", title: "Early Adopter", icon: "🚀", target: 1, current: 1, desc: "Join Swaply early" },
    ];
    return defs.map((d) => ({
      id: d.id, title: d.title, description: d.desc, icon: d.icon,
      progress: Math.min(100, Math.round((d.current / d.target) * 100)),
      target: d.target, current: Math.min(d.current, d.target),
      unlockedAt: d.current >= d.target ? new Date().toISOString() : undefined,
    }));
  }, [user, items]);

  // ── Shop (expanded — 16 items across 5 categories) ──
  const shopItems = useMemo<ShopItem[]>(() => {
    const promos = getActivePromotions();
    return ALL_SHOP_ITEMS.map((item) => ({
      ...item,
      cost: applyPromoDiscount(item.cost, promos),
    }));
  }, []);

  const purchaseShopItem = useCallback(async (itemId: TokenShopItem): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    const item = shopItems.find((si) => si.id === itemId);
    if (!item) return { error: "Item not found" };
    const balance = tokenLedger.reduce((sum, e) => sum + e.amount, 0);
    if (balance < item.cost) return { error: "Insufficient tokens" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -item.cost,
      reason: "boost_spent" as const, description: `Purchased: ${item.title}`,
      createdAt: new Date().toISOString(),
    }]);
    trackEvent("shop_purchase", { itemId, cost: item.cost });
    return {};
  }, [user, shopItems, tokenLedger, trackEvent]);

  // ── 4. Daily Login Streak ──
  const [loginStreak, setLoginStreak] = useState<LoginStreak>({
    currentStreak: 1, longestStreak: 1, lastLoginDate: new Date().toISOString(),
    todayClaimed: false, nextReward: 2,
  });

  const claimDailyReward = useCallback(async () => {
    if (!user) return { error: "Not logged in" };
    if (loginStreak.todayClaimed) return { error: "Deja revendicat azi" };
    const reward = getStreakReward(loginStreak.currentStreak);
    const promos = getActivePromotions();
    const multiplier = getTokenMultiplier(promos);
    const finalReward = reward * multiplier;
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: finalReward,
      reason: "daily_streak" as const,
      description: `Streak zi ${loginStreak.currentStreak}${multiplier > 1 ? ` (×${multiplier} promo)` : ""}`,
      createdAt: new Date().toISOString(),
    }]);
    setLoginStreak((prev) => ({ ...prev, todayClaimed: true, nextReward: getStreakReward(prev.currentStreak + 1) }));
    trackEvent("daily_streak_claimed", { day: loginStreak.currentStreak, tokens: finalReward });
    return { tokens: finalReward };
  }, [user, loginStreak, trackEvent]);

  // Update streak on each session
  useEffect(() => {
    if (user) {
      setLoginStreak((prev) => computeStreak(prev.lastLoginDate, prev.currentStreak));
    }
  }, [user?.id]);

  // ── 3. Referral Program ──
  const referralCode = useMemo(() => user ? generateReferralCode(user.id) : "", [user?.id]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  const sendReferralInvite = useCallback(async (email: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (!email.includes("@")) return { error: "Email invalid" };
    setReferrals((prev) => [...prev, {
      id: nanoid(), referrerId: user.id, referredId: "", referredEmail: email,
      referralCode, status: "pending" as const, tokensEarned: 0,
      createdAt: new Date().toISOString(),
    }]);
    trackEvent("referral_sent", { email });
    return {};
  }, [user, referralCode, trackEvent]);

  // ── 7. Gift Tokens ──
  const giftTokens = useCallback(async (recipientId: string, amount: number, message: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    const balance = computeBalance(tokenLedger);
    const err = validateGiftAmount(amount, balance);
    if (err) return { error: err };
    setTokenLedger((prev) => [
      ...prev,
      { id: nanoid(), userId: user.id, amount: -amount, reason: "gift_sent" as const, description: `Gift → ${recipientId}: ${message}`, createdAt: new Date().toISOString() },
      { id: nanoid(), userId: recipientId, amount, reason: "gift_received" as const, description: `Gift de la ${user.displayName}: ${message}`, createdAt: new Date().toISOString() },
    ]);
    trackEvent("tokens_gifted", { recipientId, amount });
    return {};
  }, [user, tokenLedger, trackEvent]);

  // ── 5. Featured Listing Slots ──
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>([]);

  const purchaseFeaturedSlot = useCallback(async (itemId: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    const balance = computeBalance(tokenLedger);
    if (balance < FEATURED_COST) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -FEATURED_COST,
      reason: "featured_spent" as const, description: `Featured: ${itemId}`,
      createdAt: new Date().toISOString(),
    }]);
    const expiresAt = new Date(Date.now() + FEATURED_DURATION_HOURS * 60 * 60 * 1000).toISOString();
    setFeaturedListings((prev) => [...prev, {
      id: nanoid(), itemId, userId: user.id, position: prev.length,
      expiresAt, createdAt: new Date().toISOString(),
    }]);
    trackEvent("featured_purchased", { itemId, cost: FEATURED_COST });
    return {};
  }, [user, tokenLedger, trackEvent]);

  // ── 6. Swap Insurance ──
  const purchaseInsurance = useCallback(async (swapId: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    const balance = computeBalance(tokenLedger);
    if (balance < INSURANCE_COST) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -INSURANCE_COST,
      reason: "insurance_spent" as const, description: `Insurance: ${swapId}`,
      createdAt: new Date().toISOString(),
    }]);
    trackEvent("insurance_purchased", { swapId, cost: INSURANCE_COST });
    return {};
  }, [user, tokenLedger, trackEvent]);

  // ── 9. Verified Badge ──
  const [isVerified, setIsVerified] = useState(false);

  const purchaseVerifiedBadge = useCallback(async (): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (isVerified) return { error: "Deja verificat" };
    const balance = computeBalance(tokenLedger);
    if (balance < VERIFIED_BADGE_COST) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -VERIFIED_BADGE_COST,
      reason: "verified_spent" as const, description: "Verified badge",
      createdAt: new Date().toISOString(),
    }]);
    setIsVerified(true);
    trackEvent("verified_badge_purchased", { cost: VERIFIED_BADGE_COST });
    return {};
  }, [user, isVerified, tokenLedger, trackEvent]);

  // ── 10. Profile Themes ──
  const [purchasedThemes, setPurchasedThemes] = useState<string[]>([]);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  const purchaseTheme = useCallback(async (themeId: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (purchasedThemes.includes(themeId)) return { error: "Deja cumpărat" };
    const theme = PROFILE_THEMES.find((t) => t.id === themeId);
    if (!theme) return { error: "Tema inexistentă" };
    const balance = computeBalance(tokenLedger);
    if (balance < theme.cost) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -theme.cost,
      reason: "theme_spent" as const, description: `Theme: ${theme.name}`,
      createdAt: new Date().toISOString(),
    }]);
    setPurchasedThemes((prev) => [...prev, themeId]);
    setActiveTheme(themeId);
    trackEvent("theme_purchased", { themeId, cost: theme.cost });
    return {};
  }, [user, purchasedThemes, tokenLedger, trackEvent]);

  const activateTheme = useCallback((themeId: string) => {
    if (purchasedThemes.includes(themeId) || !themeId) setActiveTheme(themeId || null);
  }, [purchasedThemes]);

  // ── 17. Business Account ──
  const [isBusiness, setIsBusiness] = useState(false);

  const purchaseBusinessUpgrade = useCallback(async (companyName: string): Promise<{ error?: string }> => {
    if (!user) return { error: "Not logged in" };
    if (isBusiness) return { error: "Deja business" };
    const balance = computeBalance(tokenLedger);
    if (balance < BUSINESS_UPGRADE_COST) return { error: "Fonduri insuficiente" };
    setTokenLedger((prev) => [...prev, {
      id: nanoid(), userId: user.id, amount: -BUSINESS_UPGRADE_COST,
      reason: "business_upgrade" as const, description: `Business: ${companyName}`,
      createdAt: new Date().toISOString(),
    }]);
    setIsBusiness(true);
    trackEvent("business_upgrade", { companyName, cost: BUSINESS_UPGRADE_COST });
    return {};
  }, [user, isBusiness, tokenLedger, trackEvent]);

  // ── 2. Subscription ──
  const [subscription] = useState<UserSubscription>({
    planId: (user?.badge ?? "free") as "free" | "premium" | "platinum",
    status: "active", currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  });

  // ── 18. Active Promotions ──
  const activePromotions = useMemo(() => getActivePromotions(), []);

  // ── 19. Swap Milestones ──
  const swapMilestones = useMemo(() =>
    getSwapMilestones(user?.stats.completedSwaps ?? 0),
    [user?.stats.completedSwaps],
  );

  // Auto-grant milestone bonuses
  useEffect(() => {
    if (!user) return;
    const milestone = getUnclaimedMilestoneBonus(user.stats.completedSwaps, []);
    if (milestone) {
      const promos = getActivePromotions();
      const multiplier = getTokenMultiplier(promos);
      setTokenLedger((prev) => [...prev, {
        id: nanoid(), userId: user.id, amount: milestone.bonusTokens * multiplier,
        reason: "milestone_bonus" as const,
        description: `Milestone: ${milestone.label}`,
        createdAt: new Date().toISOString(),
      }]);
      trackEvent("milestone_bonus", { swapCount: milestone.swapCount, tokens: milestone.bonusTokens * multiplier });
    }
  }, [user?.stats.completedSwaps]);

  // ── 20. Loyalty Milestones ──
  const loyaltyMilestones = useMemo(() => {
    if (!user) return LOYALTY_MILESTONES;
    const days = computeDaysActive(user.stats.completedSwaps > 0 ? user.stats.completedSwaps.toString() : new Date().toISOString());
    return getLoyaltyMilestones(days);
  }, [user]);

  // ── 11-16. Feature gating ──
  const hasFeature = useCallback((feature: PremiumFeature) => {
    return hasFeatureAccess(user?.badge ?? "free", feature);
  }, [user?.badge]);

  // ── Token balance (computed) ──
  const tokenBalance = useMemo(() => computeBalance(tokenLedger), [tokenLedger]);

  // ── GDPR ──
  const exportUserData = useCallback(async (): Promise<string> => {
    if (!user) return "{}";
    return JSON.stringify({
      profile: user, items: items.filter((i) => i.ownerId === user.id),
      conversations, swaps: swaps.filter((s) => s.requesterId === user.id || s.responderId === user.id),
      notifications: notifications.filter((n) => n.userId === user.id),
      tokenLedger: tokenLedger.filter((t) => t.userId === user.id),
      achievements: achievements.filter((a) => a.unlockedAt),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }, [user, items, conversations, swaps, notifications, tokenLedger, achievements]);

  // ── Account management ──
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("active");

  const pauseAccount = useCallback(async () => {
    setAccountStatus("paused");
    for (const item of items.filter((i) => i.ownerId === user?.id && i.status === "active")) {
      await setItemStatus(item.id, "paused");
    }
    trackEvent("account_paused");
  }, [items, user?.id, setItemStatus, trackEvent]);

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
    const limit = isBusiness ? 200 : tierBenefits.itemLimit;
    return ownItems.length >= limit;
  }, [user, items]);

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
        reportsAgainst: 0, reportsDismissed: 0, isBlocked: false,
        profileCompleteness: 0, hasAvatar: false, hasLocation: false,
        consecutiveLoginDays: 0,
      });
    }
    const signals = buildTrustSignals(user, {
      accountAgeDays: 30, // TODO: compute from createdAt
      emailVerified: true,
      reportsAgainst: 0,
      averageRating: 4.0,
      totalRatingsReceived: user.stats.completedSwaps,
      consecutiveLoginDays: loginStreak.currentStreak,
    });
    return computeTrustScore(signals);
  }, [user, loginStreak.currentStreak]);

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
    const usersWithSwaps = swaps.filter((s) => s.status === "proposed" || s.status === "scheduled" || s.status === "in_progress").length > 0 ? 1 : 0;
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
    upsertItem, deleteItem, duplicateItem, setItemStatus,
    ensureConversation, addMessage, toggleConversationTranslation,
    proposeSwap, updateSwapStatus, addSwapFeedback, updateSwapLogistics,
    reportUser, blockUser, unblockUser, blockedUsers,
    markNotificationRead, clearNotifications, startNewItem,
    infoStats: mockInfoStats, tierBenefits, tokenLedger, trackEvent,
    achievements, shopItems, purchaseShopItem, exportUserData,
    accountStatus, pauseAccount, resumeAccount, itemLimitReached,
    updateHouseProfile, addServiceProfile, removeServiceProfile,
    demoMode, demoItemCount, activateDemoMode, deactivateDemoMode,
    setTyping, markMessagesRead,
    // Dispute / Confirmation
    confirmDelivery, fileDispute,
    // Monetization (20 capabilities)
    loginStreak, claimDailyReward, referralCode, referrals, sendReferralInvite,
    giftTokens, purchaseFeaturedSlot, purchaseInsurance, purchaseVerifiedBadge,
    purchaseTheme, activateTheme, purchaseBusinessUpgrade,
    subscription, activePromotions, featuredListings,
    swapMilestones, loyaltyMilestones, tokenBalance, hasFeature,
    activeTheme, isVerified, isBusiness,
    // Trust & Safety
    trustScore, frictionLimits, checkScam,
    safeMeetingChecklist: safeMeetingChecklistVal,
    trustLevelConfig: trustLevelConfigVal,
    // Product Control
    featureFlags, setFeatureFlag, isFeatureEnabled,
    cronJobs, metricsFunnel, funnelRates,
  }), [
    dataSource, loading, lastError, announcements, notifications, conversations,
    featureToggles, items, login, resetPassword, deleteAccount, changeEmail,
    changePassword, clearNotifications, logout, matches, register, swaps,
    updateProfile, upsertItem, deleteItem, duplicateItem, setItemStatus,
    ensureConversation, addMessage, toggleConversationTranslation,
    proposeSwap, updateSwapStatus, addSwapFeedback, updateSwapLogistics,
    reportUser, blockUser, unblockUser, blockedUsers,
    startNewItem, markNotificationRead, language, setLanguage, user,
    tierBenefits, tokenLedger, trackEvent, achievements, shopItems, purchaseShopItem,
    exportUserData, accountStatus, pauseAccount, resumeAccount, itemLimitReached,
    updateHouseProfile, addServiceProfile, removeServiceProfile,
    demoMode, demoItemCount, activateDemoMode, deactivateDemoMode,
    setTyping, markMessagesRead, confirmDelivery, fileDispute,
    loginStreak, claimDailyReward, referralCode, referrals, sendReferralInvite,
    giftTokens, purchaseFeaturedSlot, purchaseInsurance, purchaseVerifiedBadge,
    purchaseTheme, activateTheme, purchaseBusinessUpgrade,
    subscription, activePromotions, featuredListings,
    swapMilestones, loyaltyMilestones, tokenBalance, hasFeature,
    activeTheme, isVerified, isBusiness,
    trustScore, frictionLimits, checkScam, safeMeetingChecklistVal, trustLevelConfigVal,
    featureFlags, setFeatureFlag, isFeatureEnabled, cronJobs, metricsFunnel, funnelRates,
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}
