"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export function PayPalProvider({ children }: { children: React.ReactNode }) {
  if (!CLIENT_ID) return <>{children}</>;

  return (
    <PayPalScriptProvider
      options={{
        clientId: CLIENT_ID,
        currency: "EUR",
        intent: "capture",
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}
