"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, StateShowcase } from "@/components/ui";
import { SwipeCard } from "@/features/items/SwipeCard";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { Item } from "@/lib/types";

const MAX_RIGHT_SWIPES = 3;

/** Mini card for the 3 fixed slots below each swipe zone */
function SlotCard({
  item,
  onRemove,
  onView,
  color,
}: {
  item: Item | null;
  onRemove?: () => void;
  onView?: () => void;
  color: "blue" | "green";
}) {
  const borderColor = color === "blue" ? "border-blue-300 dark:border-blue-700" : "border-emerald-300 dark:border-emerald-700";
  const bgColor = color === "blue" ? "bg-blue-50/50 dark:bg-blue-950/30" : "bg-emerald-50/50 dark:bg-emerald-950/30";

  if (!item) {
    return (
      <div className={`flex h-32 items-center justify-center rounded-xl border-2 border-dashed ${borderColor} ${bgColor} text-xs text-zinc-400`}>
        Slot liber
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} p-2`}>
      <div className="relative mx-auto h-16 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={item.photos?.[0] || NO_IMAGE_URL}
          alt={item.title}
          fill
          className="object-cover"
          sizes="120px"
          unoptimized={!item.photos?.[0]}
        />
      </div>
      <p className="mt-1 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
        {item.title}
      </p>
      <p className="truncate text-[10px] text-zinc-500">{item.category}</p>
      <div className="mt-1 flex gap-1">
        {onView ? (
          <button
            type="button"
            onClick={onView}
            className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
          >
            Vezi
          </button>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200"
          >
            X
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function ObjectsPage() {
  const router = useRouter();
  const { user, items } = useAppState();

  // --- WISHES (dorinte) state ---
  const [wishSwipeIndex, setWishSwipeIndex] = useState(0);
  const [wishRightCount, setWishRightCount] = useState(0);
  const [wishSlots, setWishSlots] = useState<(Item | null)[]>([null, null, null]);
  const [wishDismissed, setWishDismissed] = useState<Set<string>>(new Set());

  // --- OFFERS (oferte) state ---
  const [offerSwipeIndex, setOfferSwipeIndex] = useState(0);
  const [offerRightCount, setOfferRightCount] = useState(0);
  const [offerSlots, setOfferSlots] = useState<(Item | null)[]>([null, null, null]);
  const [offerDismissed, setOfferDismissed] = useState<Set<string>>(new Set());

  // Items from other users (what I might want)
  const otherItems = useMemo(
    () => items.filter((i) => user && i.ownerId !== user.id && i.isActive),
    [items, user],
  );

  // My own active items (what I can offer)
  const myItems = useMemo(
    () => items.filter((i) => user && i.ownerId === user.id && i.isActive),
    [items, user],
  );

  // Swipe candidates: filter out dismissed and already slotted items
  const wishCandidates = useMemo(() => {
    const slottedIds = new Set(wishSlots.filter(Boolean).map((i) => i!.id));
    return otherItems.filter((i) => !wishDismissed.has(i.id) && !slottedIds.has(i.id));
  }, [otherItems, wishDismissed, wishSlots]);

  const offerCandidates = useMemo(() => {
    const slottedIds = new Set(offerSlots.filter(Boolean).map((i) => i!.id));
    return myItems.filter((i) => !offerDismissed.has(i.id) && !slottedIds.has(i.id));
  }, [myItems, offerDismissed, offerSlots]);

  const currentWishItem = wishCandidates[wishSwipeIndex] ?? null;
  const currentOfferItem = offerCandidates[offerSwipeIndex] ?? null;

  const wishBlocked = wishRightCount >= MAX_RIGHT_SWIPES;
  const offerBlocked = offerRightCount >= MAX_RIGHT_SWIPES;

  // --- Swipe handlers ---
  const handleWishRight = useCallback(() => {
    if (!currentWishItem || wishBlocked) return;
    // Add to first empty slot
    setWishSlots((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        next[emptyIdx] = currentWishItem;
      }
      return next;
    });
    setWishRightCount((c) => c + 1);
    setWishSwipeIndex((idx) => Math.min(idx + 1, wishCandidates.length - 1));
  }, [currentWishItem, wishBlocked, wishCandidates.length]);

  const handleWishLeft = useCallback(() => {
    if (!currentWishItem) return;
    setWishDismissed((prev) => new Set(prev).add(currentWishItem.id));
    setWishSwipeIndex((idx) => Math.min(idx + 1, wishCandidates.length));
  }, [currentWishItem, wishCandidates.length]);

  const handleOfferRight = useCallback(() => {
    if (!currentOfferItem || offerBlocked) return;
    setOfferSlots((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        next[emptyIdx] = currentOfferItem;
      }
      return next;
    });
    setOfferRightCount((c) => c + 1);
    setOfferSwipeIndex((idx) => Math.min(idx + 1, offerCandidates.length - 1));
  }, [currentOfferItem, offerBlocked, offerCandidates.length]);

  const handleOfferLeft = useCallback(() => {
    if (!currentOfferItem) return;
    setOfferDismissed((prev) => new Set(prev).add(currentOfferItem.id));
    setOfferSwipeIndex((idx) => Math.min(idx + 1, offerCandidates.length));
  }, [currentOfferItem, offerCandidates.length]);

  if (!user) {
    return (
      <div className="space-y-4">
        <LoggedOutGate returnTo="/objects" />
        <NextStepRecommendation
          steps={[{ label: "Creaza cont", href: "/login", description: "Autentifica-te pentru a lista obiecte" }]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ==================== DORINTE (ALBASTRU) ==================== */}
      <div className="rounded-2xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm dark:border-blue-800 dark:from-blue-950/40 dark:to-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-blue-800 dark:text-blue-200">
              Dorinte
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Ce obiecte te intereseaza? Swipe dreapta = DA, stanga = NU
            </p>
          </div>
          <Pill color="blue">{wishRightCount}/{MAX_RIGHT_SWIPES} alese</Pill>
        </div>

        {/* Swipe zone */}
        <div className="mx-auto max-w-sm">
          {wishBlocked ? (
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/30">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Ai ales {MAX_RIGHT_SWIPES} obiecte dorite!
              </p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Analizeaza obiectele selectate si decide ce poti oferi in schimb.
              </p>
              <button
                type="button"
                onClick={() => {
                  setWishRightCount(0);
                  setWishSwipeIndex(0);
                  setWishDismissed(new Set());
                }}
                className="mt-3 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Reseteaza si alege din nou
              </button>
            </div>
          ) : currentWishItem ? (
            <SwipeCard
              item={currentWishItem}
              onSwipeLeft={handleWishLeft}
              onSwipeRight={handleWishRight}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-800 dark:bg-blue-950/20">
              <p className="text-sm text-zinc-500">Nu mai sunt obiecte de explorat.</p>
              <button
                type="button"
                onClick={() => {
                  setWishSwipeIndex(0);
                  setWishDismissed(new Set());
                }}
                className="mt-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Reincarca
              </button>
            </div>
          )}
        </div>

        {/* 3 fixed slots */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
            Obiectele tale dorite (stiu ce vreau):
          </p>
          <div className="grid grid-cols-3 gap-2">
            {wishSlots.map((item, idx) => (
              <SlotCard
                key={idx}
                item={item}
                color="blue"
                onView={item ? () => router.push(`/objects/${item.id}`) : undefined}
                onRemove={
                  item
                    ? () =>
                        setWishSlots((prev) => {
                          const next = [...prev];
                          next[idx] = null;
                          return next;
                        })
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ==================== OFERTE (VERDE) ==================== */}
      <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white p-4 shadow-sm dark:border-emerald-800 dark:from-emerald-950/40 dark:to-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
              Oferte
            </h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Ce obiect poti oferi? Alege din obiectele tale active.
            </p>
          </div>
          <div className="flex gap-2">
            <Pill color="green">{offerRightCount}/{MAX_RIGHT_SWIPES} alese</Pill>
            <CTAButton href="/objects/new">+ Adauga</CTAButton>
          </div>
        </div>

        {/* Swipe zone */}
        <div className="mx-auto max-w-sm">
          {offerBlocked ? (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Ai ales {MAX_RIGHT_SWIPES} obiecte de oferit!
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Ai suficiente semnale pentru o analiza.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOfferRightCount(0);
                    setOfferSwipeIndex(0);
                    setOfferDismissed(new Set());
                  }}
                  className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300"
                >
                  Reseteaza
                </button>
                <CTAButton href="/match">Matching</CTAButton>
              </div>
            </div>
          ) : currentOfferItem ? (
            <SwipeCard
              item={currentOfferItem}
              onSwipeLeft={handleOfferLeft}
              onSwipeRight={handleOfferRight}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
              <p className="text-sm text-zinc-500">
                {myItems.length === 0
                  ? "Nu ai obiecte active. Adauga unul!"
                  : "Ai parcurs toate obiectele tale."}
              </p>
              {myItems.length === 0 ? (
                <CTAButton href="/objects/new">Adauga obiect</CTAButton>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setOfferSwipeIndex(0);
                    setOfferDismissed(new Set());
                  }}
                  className="mt-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Reincarca
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3 fixed slots */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Obiectele tale oferite (stiu ce ofer):
          </p>
          <div className="grid grid-cols-3 gap-2">
            {offerSlots.map((item, idx) => (
              <SlotCard
                key={idx}
                item={item}
                color="green"
                onView={item ? () => router.push(`/objects/${item.id}`) : undefined}
                onRemove={
                  item
                    ? () =>
                        setOfferSlots((prev) => {
                          const next = [...prev];
                          next[idx] = null;
                          return next;
                        })
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Nudge banner (appears when both zones have signals) ── */}
      {(wishRightCount >= MAX_RIGHT_SWIPES || offerRightCount >= MAX_RIGHT_SWIPES) ? (
        <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4 text-center dark:border-purple-800 dark:bg-purple-950/30">
          <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
            Ai suficiente semnale pentru o analiza
          </p>
          <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
            AI analizeaza compatibilitatea si iti propune variante.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <CTAButton href="/match">Matching</CTAButton>
            <button
              type="button"
              onClick={() => {
                setWishRightCount(0); setOfferRightCount(0);
                setWishSwipeIndex(0); setOfferSwipeIndex(0);
                setWishDismissed(new Set()); setOfferDismissed(new Set());
              }}
              className="rounded-full border border-purple-300 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300"
            >
              Mai tarziu
            </button>
          </div>
        </div>
      ) : null}

      <NextStepRecommendation
        steps={[
          { label: "Analizeaza potriviri", href: "/match", description: "AI analizeaza compatibilitatea obiectelor tale" },
          { label: "Trimite mesaj", href: "/chat", description: "Discuta cu alti utilizatori despre schimburi" },
        ]}
      />

      <StateShowcase
        title="Stari OBIECTE"
        states={[
          {
            key: "loading",
            title: "Se incarca lista de obiecte",
            description: "Skeleton pe carduri + placeholder pentru filtre.",
          },
          {
            key: "empty",
            title: "Niciun obiect",
            description: "Empty state cu CTA spre adaugare obiect nou.",
          },
          {
            key: "error",
            title: "Eroare la incarcarea obiectelor",
            description: "Mesaj clar fara crash; permit reincarcarea paginii.",
          },
        ]}
      />
    </div>
  );
}
