"use client";

import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { MonetizationHub } from "@/features/monetization/MonetizationHub";

export default function MonetizationPage() {
  const { user } = useAppState();

  if (!user) {
    return <LoggedOutGate returnTo="/monetization" />;
  }

  return <MonetizationHub />;
}
