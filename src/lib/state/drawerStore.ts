"use client";

import { create } from "zustand";

export type DrawerVariant =
  | { type: "home" }
  | { type: "chat"; conversationId: string }
  | { type: "explore" }
  | { type: "matching" }
  | { type: "exchange"; swapId: string };

interface DrawerStore {
  open: boolean;
  variant: DrawerVariant | null;
  openWith: (v: DrawerVariant) => void;
  toggle: (v?: DrawerVariant) => void;
  close: () => void;
}

export const useDrawerStore = create<DrawerStore>((set) => ({
  open: false,
  variant: null,
  openWith: (variant) => set({ open: true, variant }),
  toggle: (variant) =>
    set((s) =>
      s.open
        ? { open: false }
        : { open: true, variant: variant ?? s.variant ?? { type: "home" } },
    ),
  close: () => set({ open: false }),
}));
