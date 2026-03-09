"use client";

import { AppStateProvider } from "@/lib/state";
import { I18nProvider } from "@/i18n/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      <I18nProvider>{children}</I18nProvider>
    </AppStateProvider>
  );
}
