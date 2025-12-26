"use client";

import { AppStateProvider } from "@/lib/state";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}
