// src/features/swipe/components/swipe-deck.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import type { Item } from "@/features/items/types";

type SwipeKind = "supply" | "demand";

interface SwipeDeckProps {
  kind: SwipeKind;
  items: Item[];
}

export function SwipeDeck({ kind, items }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasMore = index < items.length;
  const current = hasMore ? items[index] : null;

  const handleSwipe = async (
    direction: "like" | "dislike" | "superlike
