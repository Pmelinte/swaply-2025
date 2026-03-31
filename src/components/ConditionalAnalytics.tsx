"use client";

import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useCookieConsent } from "@/components/CookieConsent";

export function ConditionalAnalytics() {
  const consent = useCookieConsent();

  if (consent !== "accepted") return null;

  return (
    <>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
      <Analytics />
    </>
  );
}
