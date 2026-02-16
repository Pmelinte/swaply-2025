"use client";

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
import { getSupabaseClient } from "./supabase/client";
import {
  Announcement,
  ChatMessage,
  Conversation,
  FeatureToggle,
  LanguageCode,
  Item,
  MatchCandidate,
  Notification,
  SwapIntent,
  UserProfile,
} from "./types";
import {
  createEmptyItem,
  mockAnnouncements,
  mockConversations,
  mockFeatureToggles,
  mockInfoStats,
  mockItems,
  mockSwaps,
  mockUser,
} from "./mock-data";
import { getAllKeywords, areSiblingCategories } from "./categories";

const safeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const safeBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;
const safeArray = <T,>(value: unknown, fallback: T[]) =>
  Array.isArray(value) ? (value as T[]) : fallback;
const safeObject = <T extends object>(value: unknown, fallback: T) =>
  value && typeof value === "object" ? (value as T) : fallback;
const safeBadgeTier = (value: unknown, fallback: UserProfile["badge"] = "free") =>
  value === "free" || value === "premium" || value === "platinum"
    ? value
    : fallback;
const safeNotificationPriority = (
  value: unknown,
  fallback: Notification["priority"] = "info",
) => (value === "info" || value === "warning" || value === "success" ? value : fallback);
const safeSwapStatus = (
  value: unknown,
  fallback: SwapIntent["status"] = "proposed",
) =>
  value === "proposed" ||
  value === "scheduled" ||
  value === "in_progress" ||
  value === "completed" ||
  value === "cancelled"
    ? value
    : fallback;
const safeLocationType = (
  value: unknown,
  fallback: SwapIntent["logistics"]["locationType"] = "public_spot",
) => (value === "public_spot" || value === "courier" || value === "pickup" ? value : fallback);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Electronică": [
    "electronica",
    "electronic",
    "tech",
    "laptop",
    "pc",
    "calculator",
    "monitor",
    "tastatura",
    "keyboard",
    "casti",
    "headphones",
    "telefon",
    "phone",
    "tablet",
    "console",
    "gaming",
    "ssd",
  ],
  "Sport & Outdoor": [
    "sport",
    "outdoor",
    "bicicleta",
    "bike",
    "scooter",
    "camping",
    "cort",
    "tent",
    "hiking",
    "rucsac",
    "backpack",
    "yoga",
    "fitness",
    "running",
    "pantofi",
    "shoes",
  ],
  "Hobby & Jocuri": [
    "hobby",
    "joc",
    "jocuri",
    "boardgame",
    "board game",
    "puzzle",
    "lego",
    "sah",
    "chess",
    "chitara",
    "guitar",
    "pictura",
    "painting",
    "drone",
    "telescope",
  ],
  "Cărți & Media": [
    "carti",
    "carte",
    "books",
    "book",
    "manga",
    "comics",
    "vinyl",
    "dvd",
    "media",
    "colectie",
    "collection",
  ],
  "Casă & Grădină": [
    "casa",
    "home",
    "gradina",
    "garden",
    "unelte",
    "tools",
    "bucatarie",
    "kitchen",
    "lampa",
    "lamp",
    "aspirator",
    "vacuum",
    "planta",
    "plant",
    "decor",
  ],
  "Modă & Accesorii": [
    "moda",
    "fashion",
    "accesorii",
    "accessories",
    "rucsac",
    "backpack",
    "ceas",
    "watch",
    "geaca",
    "jacket",
    "ochelari",
    "sunglasses",
    "geanta",
    "bag",
    "piele",
    "leather",
  ],
};

function normalizeMatchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function wishlistMatchesCategory(wishlist: string, category: string) {
  const normalizedWishlist = normalizeMatchText(wishlist);
  const normalizedCategory = normalizeMatchText(category);
  if (!normalizedWishlist.trim()) return false;
  if (normalizedWishlist.includes(normalizedCategory)) return true;

  // Use taxonomy keywords (includes parent keywords for subcategories)
  const taxonomyKeywords = getAllKeywords(category);
  if (taxonomyKeywords.length > 0) {
    return taxonomyKeywords.some((kw) => normalizedWishlist.includes(normalizeMatchText(kw)));
  }

  // Fallback to legacy hardcoded keywords
  const keywords = CATEGORY_KEYWORDS[category] ?? [];
  return keywords.some((keyword) => normalizedWishlist.includes(normalizeMatchText(keyword)));
}

/* ─── Intent compatibility matrix ─── */
const INTENT_COMPAT: Record<string, Record<string, number>> = {
  explore:         { explore: 5, open: 8, committed: 2, high_commitment: 0 },
  open:            { explore: 8, open: 10, committed: 8, high_commitment: 4 },
  committed:       { explore: 2, open: 8, committed: 12, high_commitment: 10 },
  high_commitment: { explore: 0, open: 4, committed: 10, high_commitment: 15 },
};

/* ─── Score tier thresholds (cardiovascular risk model) ─── */
function scoreTier(score: number): import("./types").MatchTier {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 40) return "possible";
  return "weak";
}

function computeMatchesForUser(userId: string, items: Item[]): MatchCandidate[] {
  const myItems = items.filter(
    (item) => item.ownerId === userId && item.isActive && item.status === "active",
  );
  const otherItems = items.filter(
    (item) => item.ownerId !== userId && item.isActive && item.status === "active",
  );

  const candidates: MatchCandidate[] = [];

  for (const offered of myItems) {
    for (const requested of otherItems) {
      /* ─── Hard filters ─── */
      const wantRequested = wishlistMatchesCategory(offered.wishlist, requested.category);
      const theyWantOffered = wishlistMatchesCategory(requested.wishlist, offered.category);
      const eitherFlexBroad = offered.flexibility === "broad" || requested.flexibility === "broad";

      // Must have at least one wishlist match OR broad flexibility
      if (!wantRequested && !theyWantOffered && !eitherFlexBroad) continue;

      /* ─── Soft signals (cumulative scoring) ─── */
      let score = 0;
      const reasons: string[] = [];

      // 1. Category / wishlist match (max 30)
      if (wantRequested && theyWantOffered) {
        score += 30;
        reasons.push("Categorii reciproc compatibile");
      } else if (wantRequested) {
        score += 20;
        reasons.push(`Wishlist-ul tau indica „${requested.category}"`);
      } else if (theyWantOffered) {
        score += 20;
        reasons.push(`Partenerul cauta „${offered.category}"`);
      } else if (eitherFlexBroad) {
        score += 8;
        reasons.push("Flexibilitate larga permite explorare");
      }

      // 2. Intent compatibility (max 15)
      const myIntent = offered.intent ?? "open";
      const theirIntent = requested.intent ?? "open";
      const intentScore = INTENT_COMPAT[myIntent]?.[theirIntent] ?? 5;
      score += intentScore;
      if (intentScore >= 10) {
        reasons.push("Intentii de schimb compatibile");
      } else if (intentScore <= 2) {
        reasons.push("Asteptari diferite de angajament");
      }

      // 3. Flexibility bonus (max 10)
      const flexMap = { strict: 0, moderate: 4, broad: 10 } as const;
      const flexA = flexMap[offered.flexibility ?? "moderate"] ?? 4;
      const flexB = flexMap[requested.flexibility ?? "moderate"] ?? 4;
      const flexBonus = Math.round((flexA + flexB) / 2);
      score += flexBonus;
      if (flexBonus >= 7) {
        reasons.push("Ambele parti sunt flexibile");
      }

      // 4. Perceived value proximity (max 15)
      const valOrder = { small: 1, medium: 2, large: 3, sentimental: 2 } as const;
      const valA = valOrder[offered.perceivedValue ?? "medium"] ?? 2;
      const valB = valOrder[requested.perceivedValue ?? "medium"] ?? 2;
      const valDiff = Math.abs(valA - valB);
      const valBonus = valDiff === 0 ? 15 : valDiff === 1 ? 8 : 2;
      score += valBonus;
      if (valDiff === 0) {
        reasons.push("Valoare perceputa apropiata");
      } else if (valDiff >= 2) {
        reasons.push("Diferenta mare de valoare perceputa");
      }

      // 5. Location match (max 10)
      const locA = normalizeMatchText(offered.location);
      const locB = normalizeMatchText(requested.location);
      if (locA && locA === locB) {
        score += 10;
        reasons.push("Aceeasi locatie — logistica simpla");
      }

      // 6. Bundle compatibility (max 5)
      if (offered.acceptsBundle && requested.acceptsBundle) {
        score += 5;
        reasons.push("Ambii accepta pachet de obiecte");
      }

      // 6b. Subcategory proximity bonus (max 5)
      if (areSiblingCategories(offered.category, requested.category)) {
        score += 5;
        reasons.push("Subcategorii inrudite");
      }

      // 7. Tags overlap (max 10)
      const tagsA = new Set([...(offered.userFinalTags ?? []), ...(offered.aiSuggestedTags ?? [])]);
      const tagsB = new Set([...(requested.userFinalTags ?? []), ...(requested.aiSuggestedTags ?? [])]);
      let tagOverlap = 0;
      for (const t of tagsA) if (tagsB.has(t)) tagOverlap++;
      const tagBonus = Math.min(10, tagOverlap * 3);
      score += tagBonus;
      if (tagOverlap >= 2) {
        reasons.push(`${tagOverlap} taguri comune`);
      }

      // 8. Sentimental / recipient matters (max 5)
      if (offered.perceivedValue === "sentimental" || requested.perceivedValue === "sentimental") {
        if (offered.recipientMatters || requested.recipientMatters) {
          score += 5;
          reasons.push("Schimb cu valoare sentimentala — destinatarul conteaza");
        }
      }

      // Cap at 100
      score = Math.min(100, score);
      const tier = scoreTier(score);

      candidates.push({
        id: `match_${offered.id}_${requested.id}`,
        itemOffered: offered,
        itemRequested: requested,
        compatibilityScore: score,
        tier,
        reasons,
        reason: reasons.slice(0, 3).join(". ") + ".",
        manualFallbackReason: "Analiza calculata local (scor cumulativ).",
      });
    }
  }

  return candidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

function makeDmConversationId(a: string, b: string) {
  const [left, right] = [a, b].sort();
  return `dm:${left}:${right}`;
}

function parseDmConversationId(conversationId: string) {
  const parts = conversationId.split(":");
  if (parts.length !== 3) return null;
  if (parts[0] !== "dm") return null;
  const [, a, b] = parts;
  if (!a || !b) return null;
  return { a, b };
}

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
  login: (
    email: string,
    password?: string,
    acceptTerms?: boolean,
  ) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password?: string,
    acceptTerms?: boolean,
  ) => Promise<{ error?: string }>;
  updateProfile: (
    updates: Partial<UserProfile>,
    options?: { persist?: boolean },
  ) => Promise<void>;
  upsertItem: (item: Item) => Promise<Item | null>;
  deleteItem: (id: string) => Promise<void>;
  ensureConversation: (participantId: string) => Promise<string | null>;
  addMessage: (conversationId: string, content: string) => Promise<void>;
  toggleConversationTranslation: (conversationId: string) => void;
  proposeSwap: (params: {
    requesterItemId: string;
    responderItemId: string;
    responderId: string;
  }) => Promise<SwapIntent | null>;
  updateSwapStatus: (swapId: string, status: SwapIntent["status"]) => Promise<void>;
  addSwapFeedback: (swapId: string, rating: number, comment: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<{ error?: string }>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => void;
  startNewItem: () => Item | null;
  infoStats: typeof mockInfoStats;
}

const AppStateContext = createContext<AppStateContextProps | undefined>(
  undefined,
);

function computeFeatureToggles(): FeatureToggle {
  const aiEnabled =
    process.env.NEXT_PUBLIC_HF_ENABLED === "true" || mockFeatureToggles.aiEnabled;
  const mapsEnabled =
    process.env.NEXT_PUBLIC_MAPS_TOKEN?.length === 0
      ? mockFeatureToggles.mapsEnabled
      : Boolean(process.env.NEXT_PUBLIC_MAPS_TOKEN);
  const cloudinaryEnabled = Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      mockFeatureToggles.cloudinaryEnabled,
  );
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return { aiEnabled, mapsEnabled, cloudinaryEnabled, supabaseConfigured };
}

const SESSION_KEY = "swaply_logged_in";

function setLoggedIn(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(SESSION_KEY, "true");
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const supabaseConfigured = Boolean(supabase);
  // Start with neutral state to avoid hydration mismatch.
  // Demo mode is applied in useEffect after mount.
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
  const [announcements] = useState<Announcement[]>(mockAnnouncements);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [swaps, setSwaps] = useState<SwapIntent[]>([]);
  const [featureToggles] = useState<FeatureToggle>(computeFeatureToggles());
  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("swaply_language");
    if (saved) {
      // Accept any locale from our supported list
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

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setMatches([]);
      return;
    }
    setMatches(computeMatchesForUser(user.id, items));
  }, [items, user?.id]);

  // Restore session after hydration (avoids server/client mismatch)
  useEffect(() => {
    // Only fall back to mock when Supabase is NOT configured
    if (!supabaseConfigured) {
      setDataSource("mock");
      setUser(mockUser);
      setItems(mockItems);
      setConversations(mockConversations);
      setSwaps(mockSwaps);
      setNotifications([]);
      setLoading({ profile: false, items: false, auth: false });
    }
    // When Supabase IS configured, the auth listener useEffect handles session restoration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapProfile = useCallback(
    (data: Partial<UserProfile> & Record<string, unknown>): UserProfile => {
      const currentUser = userRef.current;
      return {
        id: safeString(
          data.user_id,
          safeString(data.id, safeString(data.uid, nanoid())),
        ),
        email: safeString(data.email, currentUser?.email ?? ""),
        displayName: safeString(
          data.display_name,
          safeString(data.username, safeString(data.displayName, "Utilizator Swaply")),
        ),
        firstName: safeString(data.first_name, safeString(data.full_name, safeString(data.firstName))),
        avatarUrl: safeString(data.avatar_url, safeString(data.avatarUrl)),
        bio: safeString(data.bio, safeString(data.about_me)),
        languages: safeArray<LanguageCode>(
          data.languages,
          currentUser?.languages ?? ["ro"],
        ),
        badge: safeBadgeTier(data.badge, currentUser?.badge ?? "free"),
        location:
          (safeObject(
            data.location,
            currentUser?.location ?? {},
          ) as UserProfile["location"]) ||
          (data.city || data.region || data.country
            ? {
                country: safeString(data.country),
                region: safeString(data.region),
                city: safeString(data.city),
                postalCode: safeString(data.postal_code),
                travelRadiusKm:
                  typeof data.travel_radius_km === "number"
                    ? data.travel_radius_km
                    : currentUser?.location?.travelRadiusKm,
              }
            : currentUser?.location),
        visibility:
          safeObject(
            data.visibility,
            currentUser?.visibility ?? {
              publicProfile: true,
              itemsVisibility: "public",
              showExactLocation: false,
              showLastSeen: true,
            },
          ) as UserProfile["visibility"],
        notifications:
          safeObject(
            data.notifications,
            currentUser?.notifications ?? {
              email: true,
              push: true,
              chat: true,
              matches: true,
              swapUpdates: true,
            },
          ) as UserProfile["notifications"],
        swapPreferences:
          safeObject(
            data.swap_preferences,
            currentUser?.swapPreferences ?? {
              logistics: "flexible",
              notes: "",
            },
          ) as UserProfile["swapPreferences"],
        security:
          safeObject(
            data.security,
            currentUser?.security ?? {
              twoFactorEnabled: false,
              method: null,
              passkeysEnabled: false,
            },
          ) as UserProfile["security"],
        stats:
          safeObject(
            data.stats,
            currentUser?.stats ?? {
              tokens: 0,
              reputation: "starter",
              completedSwaps: 0,
              activeListings: 0,
            },
          ) as UserProfile["stats"],
      };
    },
    [],
  );

  const mapItem = useCallback(
    (row: Partial<Item> & Record<string, unknown>): Item => {
      const currentUser = userRef.current;
      // Semantic fields live inside ai_metadata jsonb in the DB
      const aiMeta = safeObject(row.ai_metadata, {}) as Record<string, unknown>;
      return {
        id: safeString(row.id, nanoid()),
        ownerId: safeString(
          row.owner_id,
          safeString(row.ownerId, currentUser?.id ?? "unknown"),
        ),
        title: safeString(row.title, "Obiect fără titlu"),
        category: safeString(row.category, "General"),
        condition: (safeString(row.condition, "good") as Item["condition"]) ?? "good",
        description: safeString(row.description),
        wishlist: safeString(row.wishlist, safeString(aiMeta.wishlist)),
        status: (safeString(row.status, "active") as Item["status"]) ?? "active",
        isDemo: safeBoolean(row.is_demo, false),
        isActive: safeBoolean(row.is_active, true),
        createdAt: safeString(row.created_at, new Date().toISOString()),
        location: safeString(row.location, safeString(row.city)),
        aiSuggestedTags: safeArray<string>(row.ai_suggested_tags, safeArray<string>(row.tags, row.aiSuggestedTags ?? [])),
        userFinalTags: safeArray<string>(row.user_final_tags, safeArray<string>(row.tags, row.userFinalTags ?? [])),
        // DB stores photos as "images" jsonb array
        photos: safeArray<string>(row.photos, safeArray<string>(row.images, [])),
        // Semantic fields from ai_metadata
        intent: (safeString(aiMeta.intent) || undefined) as Item["intent"],
        flexibility: (safeString(aiMeta.flexibility) || undefined) as Item["flexibility"],
        perceivedValue: (safeString(aiMeta.perceivedValue) || undefined) as Item["perceivedValue"],
        acceptsBundle: typeof aiMeta.acceptsBundle === "boolean" ? aiMeta.acceptsBundle : undefined,
        recipientMatters: typeof aiMeta.recipientMatters === "boolean" ? aiMeta.recipientMatters : undefined,
        clarity: (safeString(aiMeta.clarity) || undefined) as Item["clarity"],
        context: (safeString(aiMeta.context) || undefined) as Item["context"],
        aiNote: safeString(aiMeta.aiNote) || undefined,
      };
    },
    [],
  );

  const mapMessage = useCallback(
    (row: Partial<ChatMessage> & Record<string, unknown>): ChatMessage => {
      const attachments = safeArray<Record<string, unknown>>(row.attachments, [])
        .map((att) => ({
          id: safeString(att.id, nanoid()),
          name: safeString(att.name, "attachment"),
          safe: safeBoolean(att.safe, true),
        }))
        // Avoid leaking unexpected objects into UI
        .filter((att) => typeof att.name === "string" && typeof att.safe === "boolean");

      return {
        id: safeString(row.id, nanoid()),
        conversationId: safeString(row.conversation_id, safeString(row.conversationId)),
        senderId: safeString(row.sender_id, safeString(row.senderId)),
        content: safeString(row.content),
        createdAt: safeString(row.created_at, safeString(row.createdAt, new Date().toISOString())),
        translated: safeBoolean(row.translated, false),
        attachments,
        moderated: safeBoolean(row.moderated, false),
      };
    },
    [],
  );

  const mapSwapIntent = useCallback(
    (row: Partial<SwapIntent> & Record<string, unknown>): SwapIntent => {
      const logistics = safeObject(row.logistics, {}) as Record<string, unknown>;
      const feedbackRaw =
        row.feedback && typeof row.feedback === "object"
          ? (safeObject(row.feedback, {}) as Record<string, unknown>)
          : null;
      const feedback =
        feedbackRaw && typeof feedbackRaw.rating === "number"
          ? { rating: feedbackRaw.rating, comment: safeString(feedbackRaw.comment) }
          : undefined;
      return {
        id: safeString(row.id, nanoid()),
        requesterId: safeString(row.requester_id, safeString(row.requesterId)),
        responderId: safeString(row.responder_id, safeString(row.responderId)),
        requesterItemId: safeString(
          row.requester_item_id,
          safeString(row.requesterItemId),
        ),
        responderItemId: safeString(
          row.responder_item_id,
          safeString(row.responderItemId),
        ),
        status: safeSwapStatus(row.status, "proposed"),
        logistics: {
          locationType: safeLocationType(logistics.locationType),
          meetupPoint: safeString(logistics.meetupPoint),
          courierTracking: safeString(logistics.courierTracking),
        },
        notifications: safeArray<string>(row.notifications, []),
        feedback,
      };
    },
    [],
  );

  const mapNotification = useCallback(
    (row: Partial<Notification> & Record<string, unknown>): Notification => ({
      id: safeString(row.id, nanoid()),
      userId: safeString(row.user_id, safeString(row.userId)),
      type: safeString(row.type, "info"),
      message: safeString(row.message),
      read: safeBoolean(row.read, false),
      priority: safeNotificationPriority(row.priority, "info"),
      createdAt: safeString(row.created_at, safeString(row.createdAt, new Date().toISOString())),
    }),
    [],
  );

  const hydrateSupabase = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      setLastError(null);
      setLoading((prev) => ({ ...prev, profile: true, items: true }));
      // Production DB uses user_id (uuid) as primary key, not id (text)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        setLastError(profileError.message);
      }

      if (profileData) {
        setUser(mapProfile({ ...profileData, id: profileData.user_id }));
      } else if (supabaseConfigured) {
        // First login: create profile from auth session data
        const session = await supabase.auth.getSession();
        const email = session.data.session?.user.email ?? "";
        const newProfile = mapProfile({ id: userId, email });
        setUser(newProfile);

        // Persist the new profile to Supabase
        const { error: insertError } = await supabase.from("profiles").upsert({
          user_id: userId,
          username: email.split("@")[0],
          email,
          display_name: email.split("@")[0],
          badge: "free",
          languages: ["ro"],
          location: {},
          visibility: newProfile.visibility,
          notifications: newProfile.notifications,
          swap_preferences: newProfile.swapPreferences,
          security: newProfile.security,
          stats: newProfile.stats,
        });
        if (insertError) {
          setLastError(insertError.message);
        }
      }

      const [
        { data: itemsData, error: itemsError },
        { data: swapsData, error: swapsError },
        { data: notificationsData, error: notificationsError },
        { data: messagesData, error: messagesError },
      ] = await Promise.all([
        supabase
          .from("items")
          .select("*")
          .or(`is_active.eq.true,owner_id.eq.${userId}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("swap_intents")
          .select("*")
          .or(`requester_id.eq.${userId},responder_id.eq.${userId}`)
          .order("updated_at", { ascending: false }),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("messages")
          .select("*")
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
              .map((conversationId) => {
                const parsed = parseDmConversationId(conversationId);
                if (!parsed) return null;
                if (parsed.a === userId) return parsed.b;
                if (parsed.b === userId) return parsed.a;
                return null;
              })
              .filter(Boolean),
          ),
        ) as string[];

        const profilesById = new Map<
          string,
          { displayName: string; badge: UserProfile["badge"] }
        >();

        if (participantIds.length) {
          const { data: participantProfiles, error: participantProfilesError } = await supabase
            .from("profiles")
            .select("user_id, display_name, username, badge")
            .in("user_id", participantIds);

          if (participantProfilesError) {
            setLastError(participantProfilesError.message);
          }

          for (const row of participantProfiles ?? []) {
            const id = safeString(row.user_id);
            if (!id) continue;
            profilesById.set(id, {
              displayName: safeString(row.display_name, safeString(row.username, "Utilizator")),
              badge: safeBadgeTier(row.badge, "free"),
            });
          }
        }

        const nextConversations = conversationIds
          .map((conversationId) => {
            const parsed = parseDmConversationId(conversationId);
            const participantId =
              parsed?.a === userId ? parsed.b : parsed?.b === userId ? parsed.a : "unknown";
            const participantProfile = profilesById.get(participantId);
            const messages = byConversation.get(conversationId) ?? [];
            const lastMessage = messages[messages.length - 1];
            return {
              id: conversationId,
              participantId,
              participantName:
                participantProfile?.displayName ??
                (participantId === "unknown"
                  ? "Conversație"
                  : `Utilizator ${participantId.slice(0, 8)}`),
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
    [
      mapItem,
      mapMessage,
      mapNotification,
      mapProfile,
      mapSwapIntent,
      supabase,
      supabaseConfigured,
    ],
  );

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
        // No active Supabase session — clear stale localStorage flag
        setLoggedIn(false);
        setUser(null);
        setItems([]);
        setConversations([]);
        setSwaps([]);
        setNotifications([]);
        setLoading((prev) => ({ ...prev, auth: false, profile: false, items: false }));
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, nextSession) => {
          if (nextSession?.user?.id) {
            setDataSource("supabase");
            setLoggedIn(true);
            await hydrateSupabase(nextSession.user.id);
          } else {
            setLoggedIn(false);
            setUser(null);
            setItems([]);
            setConversations([]);
            setSwaps([]);
            setNotifications([]);
          }
        },
      );

      unsubscribe = () => listener.subscription.unsubscribe();
    };

    void init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [hydrateSupabase, supabase, supabaseConfigured]);

  const login = useCallback(
    async (
      email: string,
      password = "",
      acceptTerms = false,
    ): Promise<{ error?: string }> => {
      setLastError(null);
      if (!acceptTerms) {
        const error = "Bifează acceptarea Termeni & GDPR pentru a continua.";
        setLastError(error);
        return { error };
      }

      // Always try Supabase when configured, regardless of current dataSource
      if (supabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setLastError(error.message);
          return { error: error.message };
        }
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
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signOut errors — state is already cleared
      }
    }
    setDataSource(supabaseConfigured ? "supabase" : "mock");
  }, [dataSource, supabase, supabaseConfigured]);

  const changeEmail = useCallback(
    async (newEmail: string): Promise<{ error?: string }> => {
      setLastError(null);
      if (!newEmail.trim()) {
        const error = "Email-ul nu poate fi gol.";
        setLastError(error);
        return { error };
      }
      if (supabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) {
          setLastError(error.message);
          return { error: error.message };
        }
        return {};
      }
      if (user) {
        setUser({ ...user, email: newEmail });
      }
      return {};
    },
    [supabaseConfigured, supabase, user],
  );

  const changePassword = useCallback(
    async (newPassword: string): Promise<{ error?: string }> => {
      setLastError(null);
      if (newPassword.length < 6) {
        const error = "Parola trebuie să aibă cel puțin 6 caractere.";
        setLastError(error);
        return { error };
      }
      if (supabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setLastError(error.message);
          return { error: error.message };
        }
        return {};
      }
      return {};
    },
    [supabaseConfigured, supabase],
  );

  const register = useCallback(
    async (
      email: string,
      password = "",
      acceptTerms = false,
    ): Promise<{ error?: string }> => {
      setLastError(null);
      if (!acceptTerms) {
        const error = "Bifează acceptarea Termeni & GDPR pentru a continua.";
        setLastError(error);
        return { error };
      }

      // Always try Supabase when configured, regardless of current dataSource
      if (supabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              accepted_terms: acceptTerms,
              language,
            },
          },
        });
        if (error) {
          setLastError(error.message);
          return { error: error.message };
        }
        if (data.session?.user.id) {
          setDataSource("supabase");
          await hydrateSupabase(data.session.user.id);
        }
        return {};
      }

      setUser({
        ...mockUser,
        id: nanoid(),
        email,
        displayName: email.split("@")[0],
        badge: "free",
        stats: { ...mockUser.stats, tokens: 0, completedSwaps: 0, activeListings: 0 },
      });
      return {};
    },
    [supabaseConfigured, hydrateSupabase, language, supabase],
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>, options?: { persist?: boolean }) => {
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));

      // Use userRef for the latest user value (avoids stale closure)
      const currentUser = userRef.current;
      if (
        supabaseConfigured &&
        supabase &&
        options?.persist &&
        currentUser?.id
      ) {
        setLastError(null);
        const merged = { ...currentUser, ...updates };
        const payload: Record<string, unknown> = {
          user_id: currentUser.id,
          email: merged.email,
          username: merged.displayName,
          display_name: merged.displayName,
          full_name: merged.firstName ? `${merged.firstName} ${merged.displayName}` : merged.displayName,
          first_name: merged.firstName ?? null,
          avatar_url: merged.avatarUrl ?? null,
          bio: merged.bio ?? null,
          badge: merged.badge,
          languages: merged.languages,
          location: merged.location ?? {},
          visibility: merged.visibility,
          notifications: merged.notifications,
          swap_preferences: merged.swapPreferences,
          security: merged.security,
          stats: merged.stats,
          updated_at: new Date().toISOString(),
        };

        const { error, data } = await supabase
          .from("profiles")
          .upsert(payload)
          .select()
          .maybeSingle();

        if (error) {
          setLastError(error.message);
          throw new Error(error.message);
        } else if (data) {
          setUser(mapProfile(data));
        }
      }
    },
    [supabaseConfigured, mapProfile, supabase],
  );

  const upsertItem = useCallback(
    async (item: Item) => {
      if (dataSource === "supabase" && supabase && user?.id) {
        const payload = {
          id: item.id,
          owner_id: user.id,
          title: item.title,
          category: item.category,
          condition: item.condition,
          description: item.description,
          wishlist: item.wishlist,
          status: item.status,
          is_active: item.isActive ?? true,
          is_demo: item.isDemo ?? false,
          location: item.location,
          ai_suggested_tags: item.aiSuggestedTags ?? [],
          user_final_tags: item.userFinalTags ?? [],
          photos: item.photos ?? [],
          updated_at: new Date().toISOString(),
        };

        const query = item.id
          ? supabase.from("items").upsert(payload).select().maybeSingle()
          : supabase.from("items").insert(payload).select().maybeSingle();

        const { data, error } = await query;
        if (error) {
          setLastError(error.message);
        } else if (data) {
          const mapped = mapItem(data);
          setItems((prev) => {
            const existingIndex = prev.findIndex((i) => i.id === mapped.id);
            if (existingIndex >= 0) {
              const next = [...prev];
              next[existingIndex] = mapped;
              return next;
            }
            return [mapped, ...prev];
          });
          return mapped;
        }
      }

      setItems((prev) => {
        const existingIndex = prev.findIndex((i) => i.id === item.id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = item;
          return next;
        }
        return [...prev, item];
      });
      return item;
    },
    [dataSource, mapItem, supabase, user],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (dataSource === "supabase" && supabase) {
        const { error } = await supabase.from("items").delete().eq("id", id);
        if (error) {
          setLastError(error.message);
        }
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [dataSource, supabase],
  );

  const ensureConversation = useCallback(
    async (participantId: string) => {
      if (!user?.id) return null;
      if (!participantId || participantId === user.id) return null;

      const conversationId = makeDmConversationId(user.id, participantId);
      const existing = conversations.some((c) => c.id === conversationId);
      if (existing) return conversationId;

      let participantName = `Utilizator ${participantId.slice(0, 8)}`;
      let participantBadge: UserProfile["badge"] = "free";

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, badge")
          .eq("user_id", participantId)
          .maybeSingle();
        if (error) {
          setLastError(error.message);
        } else if (data) {
          participantName = safeString(data.display_name, participantName);
          participantBadge = safeBadgeTier(data.badge, participantBadge);
        }
      }

      const now = new Date().toISOString();
      setConversations((prev) => [
        {
          id: conversationId,
          participantId,
          participantName,
          participantBadge,
          lastMessage: "",
          updatedAt: now,
          messages: [],
          translationEnabled: false,
        },
        ...prev,
      ]);

      return conversationId;
    },
    [conversations, dataSource, supabase, user?.id],
  );

  const addMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!user?.id) return;
      setLastError(null);

      const now = new Date().toISOString();
      const fallbackMessage: ChatMessage = {
        id: nanoid(),
        conversationId,
        senderId: user.id,
        content,
        createdAt: now,
        attachments: [],
      };

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content,
            attachments: [],
            translated: false,
            moderated: false,
          })
          .select("*")
          .maybeSingle();

        if (error) {
          setLastError(error.message);
          return;
        }

        const inserted = data ? mapMessage(data) : fallbackMessage;
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === conversationId);
          if (idx === -1) {
            const parsed = parseDmConversationId(conversationId);
            const participantId =
              parsed?.a === user.id ? parsed.b : parsed?.b === user.id ? parsed.a : "unknown";
            return [
              {
                id: conversationId,
                participantId,
                participantName:
                  participantId === "unknown"
                    ? "Conversație"
                    : `Utilizator ${participantId.slice(0, 8)}`,
                participantBadge: "free",
                lastMessage: inserted.content,
                updatedAt: inserted.createdAt,
                messages: [inserted],
                translationEnabled: false,
              },
              ...prev,
            ];
          }

          const next = [...prev];
          const existing = next[idx];
          next[idx] = {
            ...existing,
            messages: [...existing.messages, inserted],
            lastMessage: inserted.content,
            updatedAt: inserted.createdAt,
          };
          return next;
        });
        return;
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, fallbackMessage],
                lastMessage: content,
                updatedAt: now,
              }
            : c,
        ),
      );
    },
    [dataSource, mapMessage, supabase, user?.id],
  );

  const toggleConversationTranslation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, translationEnabled: !c.translationEnabled }
          : c,
      ),
    );
  }, []);

  const proposeSwap = useCallback(
    async ({
      requesterItemId,
      responderItemId,
      responderId,
    }: {
      requesterItemId: string;
      responderItemId: string;
      responderId: string;
    }) => {
      if (!user?.id) return null;
      if (!requesterItemId || !responderItemId || !responderId) return null;
      if (responderId === user.id) return null;

      setLastError(null);

      const logistics: SwapIntent["logistics"] = {
        locationType: user.swapPreferences.logistics === "courier" ? "courier" : "public_spot",
      };
      const notifications = ["Propunere swap trimisă."];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase
          .from("swap_intents")
          .insert({
            requester_id: user.id,
            responder_id: responderId,
            requester_item_id: requesterItemId,
            responder_item_id: responderItemId,
            status: "proposed",
            logistics,
            notifications,
            updated_at: new Date().toISOString(),
          })
          .select("*")
          .maybeSingle();

        if (error) {
          setLastError(error.message);
          return null;
        }
        if (!data) return null;

        const mapped = mapSwapIntent(data);
        setSwaps((prev) => [mapped, ...prev.filter((s) => s.id !== mapped.id)]);
        return mapped;
      }

      const localSwap: SwapIntent = {
        id: nanoid(),
        requesterId: user.id,
        responderId,
        requesterItemId,
        responderItemId,
        status: "proposed",
        logistics,
        notifications,
      };
      setSwaps((prev) => [localSwap, ...prev]);
      return localSwap;
    },
    [dataSource, mapSwapIntent, supabase, user],
  );

  const updateSwapStatus = useCallback(
    async (swapId: string, status: SwapIntent["status"]) => {
      if (!swapId) return;
      setLastError(null);

      const note = `Status actualizat: ${status}`;
      const existing = swaps.find((s) => s.id === swapId);
      const nextNotifications = [...(existing?.notifications ?? []), note];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase
          .from("swap_intents")
          .update({
            status,
            notifications: nextNotifications,
            updated_at: new Date().toISOString(),
          })
          .eq("id", swapId)
          .select("*")
          .maybeSingle();
        if (error) {
          setLastError(error.message);
          return;
        }
        if (data) {
          const mapped = mapSwapIntent(data);
          setSwaps((prev) => prev.map((swap) => (swap.id === swapId ? mapped : swap)));
        }
        return;
      }

      setSwaps((prev) =>
        prev.map((swap) =>
          swap.id === swapId ? { ...swap, status, notifications: nextNotifications } : swap,
        ),
      );
    },
    [dataSource, mapSwapIntent, supabase, swaps],
  );

  const addSwapFeedback = useCallback(
    async (swapId: string, rating: number, comment: string) => {
      if (!swapId) return;
      setLastError(null);

      const existing = swaps.find((s) => s.id === swapId);
      const nextNotifications = [...(existing?.notifications ?? []), "Feedback trimis."];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase
          .from("swap_intents")
          .update({
            feedback: { rating, comment },
            notifications: nextNotifications,
            updated_at: new Date().toISOString(),
          })
          .eq("id", swapId)
          .select("*")
          .maybeSingle();
        if (error) {
          setLastError(error.message);
          return;
        }
        if (data) {
          const mapped = mapSwapIntent(data);
          setSwaps((prev) => prev.map((swap) => (swap.id === swapId ? mapped : swap)));
        }
        return;
      }

      setSwaps((prev) =>
        prev.map((swap) =>
          swap.id === swapId
            ? { ...swap, feedback: { rating, comment }, notifications: nextNotifications }
            : swap,
        ),
      );
    },
    [dataSource, mapSwapIntent, supabase, swaps],
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return;
      setLastError(null);

      if (dataSource === "supabase" && supabase) {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId);
        if (error) {
          setLastError(error.message);
        }
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    },
    [dataSource, supabase],
  );

  const startNewItem = useCallback(() => {
    if (!user) return null;
    const item = createEmptyItem(user.id);
    if (user.location?.city) {
      item.location = user.location.city;
    }
    return item;
  }, [user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(
    () => ({
      user,
      dataSource,
      loading,
      lastError,
      announcements,
      notifications,
      items,
      matches,
      conversations,
      swaps,
      featureToggles,
      language,
      setLanguage,
      login,
      logout,
      register,
      changeEmail,
      changePassword,
      updateProfile,
      upsertItem,
      deleteItem,
      ensureConversation,
      addMessage,
      toggleConversationTranslation,
      proposeSwap,
      updateSwapStatus,
      addSwapFeedback,
      markNotificationRead,
      clearNotifications,
      startNewItem,
      infoStats: mockInfoStats,
    }),
    [
      dataSource,
      loading,
      lastError,
      announcements,
      notifications,
      conversations,
      featureToggles,
      items,
      login,
      changeEmail,
      changePassword,
      clearNotifications,
      logout,
      matches,
      register,
      swaps,
      updateProfile,
      upsertItem,
      deleteItem,
      ensureConversation,
      addMessage,
      toggleConversationTranslation,
      proposeSwap,
      updateSwapStatus,
      addSwapFeedback,
      startNewItem,
      markNotificationRead,
      language,
      setLanguage,
      user,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
