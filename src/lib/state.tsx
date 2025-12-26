"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  Announcement,
  Conversation,
  FeatureToggle,
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

interface AppStateContextProps {
  user: UserProfile | null;
  announcements: Announcement[];
  items: Item[];
  matches: MatchCandidate[];
  conversations: Conversation[];
  swaps: SwapIntent[];
  featureToggles: FeatureToggle;
  login: (email: string) => void;
  logout: () => void;
  register: (email: string, password: string, acceptTerms: boolean) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  upsertItem: (item: Item) => void;
  deleteItem: (id: string) => void;
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
  const [user, setUser] = useState<UserProfile | null>(mockUser);
  const [announcements] = useState<Announcement[]>(mockAnnouncements);
  const [items, setItems] = useState<Item[]>(mockItems);
  const [matches, setMatches] = useState<MatchCandidate[]>(mockMatches);
  const [conversations, setConversations] =
    useState<Conversation[]>(mockConversations);
  const [swaps, setSwaps] = useState<SwapIntent[]>(mockSwaps);
  const [featureToggles] = useState<FeatureToggle>(computeFeatureToggles());

  const login = useCallback((email: string) => {
    setUser((current) => ({
      ...(current ?? mockUser),
      email,
    }));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const register = useCallback(
    (email: string, _password: string, acceptTerms: boolean) => {
      if (!acceptTerms) return;
      setUser({
        ...mockUser,
        id: nanoid(),
        email,
        displayName: email.split("@")[0],
        badge: "free",
        stats: { ...mockUser.stats, tokens: 0, completedSwaps: 0, activeListings: 0 },
      });
    },
    [],
  );

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const upsertItem = useCallback(
    (item: Item) => {
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
    },
    [],
  );

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setMatches((prev) => prev.filter((m) => m.itemOffered.id !== id));
  }, []);

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
      announcements,
      items,
      matches,
      conversations,
      swaps,
      featureToggles,
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
