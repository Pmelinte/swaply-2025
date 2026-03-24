/**
 * Swap chains hook — multi-party circular swaps (A→B→C→A).
 * Persists via /api/chains with local state fallback.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SwapChain, SwapChainLink } from "../types";
import { nanoid } from "nanoid";
import { getSupabaseClient } from "../supabase/client";

interface UseSwapChainsParams {
  userId: string | null;
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
}

export interface DetectedChainOpportunity {
  participants: Array<{
    userId: string;
    userName: string;
    givesItemId: string;
    givesItemTitle: string;
    receivesItemId: string;
    receivesItemTitle: string;
  }>;
  score: number;
}

// Map DB snake_case to camelCase
function mapChainFromDb(row: Record<string, unknown>): SwapChain {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "Lanț de schimb",
    status: row.status as SwapChain["status"],
    initiatorId: row.created_by as string,
    links: Array.isArray(row.links) ? (row.links as Record<string, unknown>[]).map(mapLinkFromDb) : [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapLinkFromDb(row: Record<string, unknown>): SwapChainLink {
  return {
    id: row.id as string,
    chainId: row.chain_id as string,
    position: row.position as number,
    giverId: row.giver_id as string,
    receiverId: row.receiver_id as string,
    itemId: row.item_id as string,
    confirmed: row.confirmed as boolean,
    createdAt: row.created_at as string,
  };
}

export function useSwapChains({ userId, trackEvent }: UseSwapChainsParams) {
  const [chains, setChains] = useState<SwapChain[]>([]);
  const [detectedOpportunities, setDetectedOpportunities] = useState<DetectedChainOpportunity[]>([]);
  const [detecting, setDetecting] = useState(false);

  // Fetch chains from API on mount
  useEffect(() => {
    if (!userId) return;

    async function fetchChains() {
      try {
        const supabase = getSupabaseClient();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data?.session?.access_token;
        if (!token) return;

        const res = await fetch("/api/chains", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setChains((data.chains ?? []).map(mapChainFromDb));
        }
      } catch {
        // Silent fallback to empty
      }
    }

    void fetchChains();
  }, [userId]);

  /** Detect chain opportunities */
  const detectChains = useCallback(async () => {
    if (!userId || detecting) return;
    setDetecting(true);
    try {
      const supabase = getSupabaseClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data?.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/chains/detect", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetectedOpportunities(data.chains ?? []);
      }
    } catch {
      // Silent
    } finally {
      setDetecting(false);
    }
  }, [userId, detecting]);

  /** Create a new swap chain */
  const createChain = useCallback(
    async (name: string, links: Omit<SwapChainLink, "id" | "chainId" | "confirmed" | "createdAt">[]): Promise<SwapChain | null> => {
      if (!userId) return null;
      if (links.length < 2) return null;

      try {
        const supabase = getSupabaseClient();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data?.session?.access_token;

        if (token) {
          const res = await fetch("/api/chains", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ name, links }),
          });
          if (res.ok) {
            const data = await res.json();
            const chain = mapChainFromDb(data.chain);
            setChains((prev) => [chain, ...prev]);
            trackEvent("swap_chain_created", { linkCount: links.length });
            return chain;
          }
        }
      } catch {
        // Fallback to local
      }

      // Local fallback
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
          confirmed: link.giverId === userId,
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

      try {
        const supabase = getSupabaseClient();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data?.session?.access_token;

        if (token) {
          const res = await fetch("/api/chains/confirm", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ chainId, linkId, action: "confirm" }),
          });
          if (res.ok) {
            const data = await res.json();
            // Optimistic update
            setChains((prev) =>
              prev.map((chain) => {
                if (chain.id !== chainId) return chain;
                return {
                  ...chain,
                  links: chain.links.map((l) => l.id === linkId ? { ...l, confirmed: true } : l),
                  status: data.allConfirmed ? "confirmed" : chain.status,
                  updatedAt: new Date().toISOString(),
                };
              }),
            );
            trackEvent("chain_link_confirmed", { chainId, allConfirmed: data.allConfirmed });
            return {};
          }
        }
      } catch {
        // Fallback
      }

      // Local fallback
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

      try {
        const supabase = getSupabaseClient();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data?.session?.access_token;

        if (token) {
          const res = await fetch("/api/chains/confirm", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ chainId, action: "start" }),
          });
          if (res.ok) {
            setChains((prev) =>
              prev.map((c) =>
                c.id === chainId ? { ...c, status: "in_progress", updatedAt: new Date().toISOString() } : c,
              ),
            );
            trackEvent("swap_chain_started", { chainId });
            return {};
          }
          const data = await res.json();
          return { error: data.error };
        }
      } catch {
        // Fallback
      }

      const chain = chains.find((c) => c.id === chainId);
      if (!chain) return { error: "Lanțul nu a fost găsit." };
      if (chain.initiatorId !== userId) return { error: "Doar inițiatorul poate porni lanțul." };
      if (chain.status !== "confirmed") return { error: "Toți participanții trebuie să confirme mai întâi." };

      setChains((prev) =>
        prev.map((c) =>
          c.id === chainId ? { ...c, status: "in_progress", updatedAt: new Date().toISOString() } : c,
        ),
      );
      trackEvent("swap_chain_started", { chainId });
      return {};
    },
    [userId, chains, trackEvent],
  );

  /** Complete a chain */
  const completeChain = useCallback(
    async (chainId: string): Promise<{ error?: string }> => {
      if (!userId) return { error: "Trebuie să fii autentificat." };

      try {
        const supabase = getSupabaseClient();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data?.session?.access_token;

        if (token) {
          const res = await fetch("/api/chains/confirm", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ chainId, action: "complete" }),
          });
          if (res.ok) {
            setChains((prev) =>
              prev.map((c) =>
                c.id === chainId ? { ...c, status: "completed", updatedAt: new Date().toISOString() } : c,
              ),
            );
            trackEvent("swap_chain_completed", { chainId });
            return {};
          }
        }
      } catch {
        // Fallback
      }

      setChains((prev) =>
        prev.map((c) =>
          c.id === chainId ? { ...c, status: "completed", updatedAt: new Date().toISOString() } : c,
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

      try {
        const supabase = getSupabaseClient();
        const session = supabase ? await supabase.auth.getSession() : null;
        const token = session?.data?.session?.access_token;

        if (token) {
          const res = await fetch("/api/chains/confirm", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ chainId, action: "cancel" }),
          });
          if (res.ok) {
            setChains((prev) =>
              prev.map((c) =>
                c.id === chainId ? { ...c, status: "cancelled", updatedAt: new Date().toISOString() } : c,
              ),
            );
            trackEvent("swap_chain_cancelled", { chainId });
            return {};
          }
        }
      } catch {
        // Fallback
      }

      setChains((prev) =>
        prev.map((c) =>
          c.id === chainId ? { ...c, status: "cancelled", updatedAt: new Date().toISOString() } : c,
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
    detectedOpportunities,
    detecting,
    createChain,
    confirmChainLink,
    startChain,
    completeChain,
    cancelChain,
    detectChains,
  };
}
