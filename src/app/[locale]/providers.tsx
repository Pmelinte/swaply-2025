"use client";

import { AppStateProvider } from "@/lib/state";

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <AppStateProvider initialLocale={locale}>
      {children}
    </AppStateProvider>
  );
}
