"use client";

import { AppStateProvider } from "@/lib/state";
import { PayPalProvider } from "@/components/payments/PayPalProvider";

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <AppStateProvider initialLocale={locale}>
      <PayPalProvider>
        {children}
      </PayPalProvider>
    </AppStateProvider>
  );
}
