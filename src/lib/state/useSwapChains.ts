/**
 * Swap chains hook — multi-party circular swaps (A→B→C→A).
 */
import { useCallback, useMemo, useState } from "react";
import type { SwapChain, SwapChainLink } from "../types";
import { nanoid } from "nanoid";

interface UseSwapChainsParams {
  userId: string | null;
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
}

export function useSwapChains({ userId, trackEvent }: UseSwapChainsParams) {
  const [chains, setChains] = useState<SwapChain[]>([]);

  /** Create a new swap chain */
  const createChain = useCallback(
    async (name: string, links: Omit<SwapChainLink, "id" | "chainId" | "confirmed" | "createdAt">[]): Promise<SwapChain | null> => {
      if (!userId) return null;
      if (links.length < 2) return null; // need at least 2 links for a chain

      const chainId = nanoid();
      const now = new Date().toISOString();

      const chain: SwapChain = {
        id: chainId,
        name: name || "Lanț de schimb",
        status: "forming",
        initiatorId: userId,
        links: links.map((link, idx) => ({
          ...link,
          id: nanoid(),
          chainId,
          position: idx,
          confirmed: link.giverId === userId, // initiator auto-confirms
          createdAt: now,
        })),
        createdAt: now,
        updatedAt: now,
      };

      setChains((prev) => [chain, ...prev]);
      trackEvent("swap_chain_created", { linkCount: links.length });

      return chain;
    },
    [userId, trackEvent],
  );

  /** Confirm your link in a chain */
  const confirmChainLink = useCallback(
    async (chainId: string, linkId: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      let allConfirmed = false;
      setChains((prev) =>
        prev.map((chain) => {
          if (chain.id !== chainId) return chain;

          const updatedLinks = chain.links.map((link) => {
            if (link.id !== linkId) return link;
            if (link.giverId !== userId && link.receiverId !== userId) return link;
            return { ...link, confirmed: true };
          });

          allConfirmed = updatedLinks.every((l) => l.confirmed);

          return {
            ...chain,
            links: updatedLinks,
            status: allConfirmed ? "confirmed" : chain.status,
            updatedAt: new Date().toISOString(),
          };
        }),
      );

      trackEvent("chain_link_confirmed", { chainId, allConfirmed });
      return {};
    },
    [userId, trackEvent],
  );

  /** Start executing a confirmed chain */
  const startChain = useCallback(
    async (chainId: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      const chain = chains.find((c) => c.id === chainId);
      if (!chain) return { error: "Lanțul nu a fost găsit." };
      if (chain.initiatorId !== userId) return { error: "Doar inițiatorul poate porni lanțul." };
      if (chain.status !== "confirmed") return { error: "Toți participanții trebuie să confirme mai întâi." };

      setChains((prev) =>
        prev.map((c) =>
          c.id === chainId
            ? { ...c, status: "in_progress", updatedAt: new Date().toISOString() }
            : c,
        ),
      );

      trackEvent("swap_chain_started", { chainId, linkCount: chain.links.length });
      return {};
    },
    [userId, chains, trackEvent],
  );

  /** Complete a chain */
  const completeChain = useCallback(
    async (chainId: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      setChains((prev) =>
        prev.map((c) =>
          c.id === chainId
            ? { ...c, status: "completed", updatedAt: new Date().toISOString() }
            : c,
        ),
      );

      trackEvent("swap_chain_completed", { chainId });
      return {};
    },
    [userId, trackEvent],
  );

  /** Cancel a chain */
  const cancelChain = useCallback(
    async (chainId: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      setChains((prev) =>
        prev.map((c) =>
          c.id === chainId
            ? { ...c, status: "cancelled", updatedAt: new Date().toISOString() }
            : c,
        ),
      );

      trackEvent("swap_chain_cancelled", { chainId });
      return {};
    },
    [userId, trackEvent],
  );

  /** My active chains */
  const myChains = useMemo(
    () =>
      chains.filter((c) =>
        c.initiatorId === userId ||
        c.links.some((l) => l.giverId === userId || l.receiverId === userId),
      ),
    [chains, userId],
  );

  /** Pending confirmations for me */
  const pendingConfirmations = useMemo(
    () =>
      chains.flatMap((c) =>
        c.status === "forming"
          ? c.links
              .filter(
                (l) =>
                  !l.confirmed &&
                  (l.giverId === userId || l.receiverId === userId),
              )
              .map((l) => ({ chain: c, link: l }))
          : [],
      ),
    [chains, userId],
  );

  return {
    chains,
    myChains,
    pendingConfirmations,
    createChain,
    confirmChainLink,
    startChain,
    completeChain,
    cancelChain,
  };
}
