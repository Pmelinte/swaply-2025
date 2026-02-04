"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { nanoid } from "nanoid";
import { getSupabaseClient } from "./supabase/client";
import {
  Announcement,
  Conversation,
  FeatureToggle,
  LanguageCode,
  Item,
  MatchCandidate,
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
  mockMatches,
  mockSwaps,
  mockUser,
} from "./mock-data";

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

interface AppStateContextProps {
  user: UserProfile | null;
  dataSource: "supabase" | "mock";
  loading: { profile: boolean; items: boolean; auth: boolean };
  lastError: string | null;
  announcements: Announcement[];
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
  addMessage: (conversationId: string, content: string) => void;
  toggleConversationTranslation: (conversationId: string) => void;
  updateSwapStatus: (swapId: string, status: SwapIntent["status"]) => void;
  addSwapFeedback: (swapId: string, rating: number, comment: string) => void;
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

export function AppStateProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const supabaseConfigured = Boolean(supabase);
  const [dataSource, setDataSource] = useState<"supabase" | "mock">(
    supabaseConfigured ? "supabase" : "mock",
  );
  const [loading, setLoading] = useState({
    profile: supabaseConfigured,
    items: supabaseConfigured,
    auth: supabaseConfigured,
  });
  const [lastError, setLastError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(
    supabaseConfigured ? null : mockUser,
  );
  const [announcements] = useState<Announcement[]>(mockAnnouncements);
  const [items, setItems] = useState<Item[]>(supabaseConfigured ? [] : mockItems);
  const [matches, setMatches] = useState<MatchCandidate[]>(mockMatches);
  const [conversations, setConversations] =
    useState<Conversation[]>(mockConversations);
  const [swaps, setSwaps] = useState<SwapIntent[]>(mockSwaps);
  const [featureToggles] = useState<FeatureToggle>(computeFeatureToggles());
  const [language, setLanguage] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "ro";
    const saved = window.localStorage.getItem("swaply_language");
    if (saved === "ro" || saved === "en" || saved === "es") {
      return saved;
    }
    return "ro";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("swaply_language", language);
  }, [language]);

  const mapProfile = useCallback(
    (data: Partial<UserProfile> & Record<string, unknown>): UserProfile => {
      return {
        id: safeString(
          data.id,
          safeString(data.user_id, safeString(data.uid, nanoid())),
        ),
        email: safeString(data.email, user?.email ?? ""),
        displayName: safeString(
          data.display_name,
          safeString(data.displayName, "Utilizator Swaply"),
        ),
        firstName: safeString(data.first_name, safeString(data.firstName)),
        avatarUrl: safeString(data.avatar_url, safeString(data.avatarUrl)),
        bio: safeString(data.bio, safeString(data.about_me)),
        languages: safeArray<LanguageCode>(data.languages, user?.languages ?? ["ro"]),
        badge: safeBadgeTier(data.badge, user?.badge ?? "free"),
        location:
          (safeObject(data.location, user?.location ?? {}) as UserProfile["location"]) ||
          (data.city || data.region || data.country
            ? {
                country: safeString(data.country),
                region: safeString(data.region),
                city: safeString(data.city),
                postalCode: safeString(data.postal_code),
                travelRadiusKm:
                  typeof data.travel_radius_km === "number"
                    ? data.travel_radius_km
                    : user?.location?.travelRadiusKm,
              }
            : user?.location),
        visibility:
          safeObject(data.visibility, user?.visibility ?? {
            publicProfile: true,
            itemsVisibility: "public",
            showExactLocation: false,
            showLastSeen: true,
          }) as UserProfile["visibility"],
        notifications:
          safeObject(data.notifications, user?.notifications ?? {
            email: true,
            push: true,
            chat: true,
            matches: true,
            swapUpdates: true,
          }) as UserProfile["notifications"],
        swapPreferences:
          safeObject(data.swap_preferences, user?.swapPreferences ?? {
            logistics: "flexible",
            notes: "",
          }) as UserProfile["swapPreferences"],
        security:
          safeObject(data.security, user?.security ?? {
            twoFactorEnabled: false,
            method: null,
            passkeysEnabled: false,
          }) as UserProfile["security"],
        stats:
          safeObject(data.stats, user?.stats ?? {
            tokens: 0,
            reputation: "starter",
            completedSwaps: 0,
            activeListings: 0,
          }) as UserProfile["stats"],
      };
    },
    [user],
  );

  const mapItem = useCallback(
    (row: Partial<Item> & Record<string, unknown>): Item => {
      return {
        id: safeString(row.id, nanoid()),
        ownerId: safeString(row.owner_id, safeString(row.ownerId, user?.id ?? "unknown")),
        title: safeString(row.title, "Obiect fără titlu"),
        category: safeString(row.category, "General"),
        condition: (safeString(row.condition, "good") as Item["condition"]) ?? "good",
        description: safeString(row.description),
        wishlist: safeString(row.wishlist),
        status: (safeString(row.status, "active") as Item["status"]) ?? "active",
        isDemo: safeBoolean(row.is_demo, false),
        isActive: safeBoolean(row.is_active, true),
        createdAt: safeString(row.created_at, new Date().toISOString()),
        location: safeString(row.location, safeString(row.city)),
        aiSuggestedTags: safeArray<string>(row.ai_suggested_tags, row.aiSuggestedTags ?? []),
        userFinalTags: safeArray<string>(row.user_final_tags, row.userFinalTags ?? []),
        photos: safeArray<string>(row.photos, []),
      };
    },
    [user?.id],
  );

  const hydrateSupabase = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      setLoading((prev) => ({ ...prev, profile: true, items: true }));
      const [{ data: profileData, error: profileError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      ]);

      if (profileError) {
        setLastError(profileError.message);
      }

      if (profileData) {
        setUser(mapProfile(profileData));
      } else if (supabaseConfigured) {
        // fallback to auth session data
        const session = await supabase.auth.getSession();
        const email = session.data.session?.user.email ?? "";
        setUser(mapProfile({ id: userId, email }));
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .or(`is_active.eq.true,owner_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (itemsError) {
        setLastError(itemsError.message);
      }
      if (itemsData) {
        setItems(itemsData.map(mapItem));
      }

      setLoading((prev) => ({ ...prev, profile: false, items: false, auth: false }));
    },
    [mapItem, mapProfile, supabase, supabaseConfigured],
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
        setLoading({ profile: false, items: false, auth: false });
        return;
      }

      const session = data.session;
      if (session?.user?.id) {
        setDataSource("supabase");
        await hydrateSupabase(session.user.id);
      } else {
        setLoading((prev) => ({ ...prev, auth: false, profile: false, items: false }));
      }

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, nextSession) => {
          if (nextSession?.user?.id) {
            setDataSource("supabase");
            await hydrateSupabase(nextSession.user.id);
          } else {
            setUser(null);
            setItems([]);
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

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setLastError(error.message);
          return { error: error.message };
        }
        if (data.session?.user.id) {
          await hydrateSupabase(data.session.user.id);
        }
        return {};
      }

      setUser((current) => ({
        ...(current ?? mockUser),
        email,
      }));
      return {};
    },
    [dataSource, hydrateSupabase, supabase],
  );

  const logout = useCallback(async () => {
    if (dataSource === "supabase" && supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setItems([]);
      return;
    }
    setUser(null);
  }, [dataSource, supabase]);

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

      if (dataSource === "supabase" && supabase) {
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
    [dataSource, hydrateSupabase, language, supabase],
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>, options?: { persist?: boolean }) => {
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));

      if (
        dataSource === "supabase" &&
        supabase &&
        options?.persist &&
        user?.id
      ) {
        const payload: Record<string, unknown> = {
          id: user.id,
          display_name: updates.displayName ?? user.displayName,
          bio: updates.bio ?? user.bio,
          badge: updates.badge ?? user.badge,
          languages: updates.languages ?? user.languages,
          location: updates.location ?? user.location,
          updated_at: new Date().toISOString(),
        };

        const { error, data } = await supabase
          .from("profiles")
          .upsert(payload)
          .select()
          .maybeSingle();

        if (error) {
          setLastError(error.message);
        } else if (data) {
          setUser(mapProfile(data));
        }
      }
    },
    [dataSource, mapProfile, supabase, user],
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
      setMatches((prev) =>
        prev.map((m) =>
          m.itemOffered.id === item.id
            ? { ...m, itemOffered: item }
            : m,
        ),
      );
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
      setMatches((prev) => prev.filter((m) => m.itemOffered.id !== id));
    },
    [dataSource, supabase],
  );

  const addMessage = useCallback(
    (conversationId: string, content: string) => {
      const newMessage = {
        id: nanoid(),
        conversationId,
        senderId: user?.id ?? "guest",
        content,
        createdAt: new Date().toISOString(),
        attachments: [],
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: [...c.messages, newMessage],
                lastMessage: content,
                updatedAt: newMessage.createdAt,
              }
            : c,
        ),
      );
    },
    [user?.id],
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

  const updateSwapStatus = useCallback(
    (swapId: string, status: SwapIntent["status"]) => {
      setSwaps((prev) =>
        prev.map((swap) => (swap.id === swapId ? { ...swap, status } : swap)),
      );
    },
    [],
  );

  const addSwapFeedback = useCallback(
    (swapId: string, rating: number, comment: string) => {
      setSwaps((prev) =>
        prev.map((swap) =>
          swap.id === swapId ? { ...swap, feedback: { rating, comment } } : swap,
        ),
      );
    },
    [],
  );

  const startNewItem = useCallback(() => {
    if (!user) return null;
    return createEmptyItem(user.id);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      dataSource,
      loading,
      lastError,
      announcements,
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
      updateProfile,
      upsertItem,
      deleteItem,
      addMessage,
      toggleConversationTranslation,
      updateSwapStatus,
      addSwapFeedback,
      startNewItem,
      infoStats: mockInfoStats,
    }),
    [
      dataSource,
      loading,
      lastError,
      announcements,
      conversations,
      featureToggles,
      items,
      login,
      logout,
      matches,
      register,
      swaps,
      updateProfile,
      upsertItem,
      deleteItem,
      addMessage,
      toggleConversationTranslation,
      updateSwapStatus,
      addSwapFeedback,
      startNewItem,
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
