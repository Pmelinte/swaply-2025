"use client";

import dynamic from "next/dynamic";

const InstallPrompt = dynamic(
  () => import("@/components/pwa/InstallPrompt").then((m) => m.InstallPrompt),
  { ssr: false },
);
const CookieConsent = dynamic(
  () => import("@/components/legal/CookieConsent").then((m) => m.CookieConsent),
  { ssr: false },
);
const OnboardingTutorial = dynamic(
  () => import("@/components/onboarding/OnboardingTutorial").then((m) => m.OnboardingTutorial),
  { ssr: false },
);
const OnboardingChecklist = dynamic(
  () => import("@/components/onboarding/OnboardingChecklist").then((m) => m.OnboardingChecklist),
  { ssr: false },
);

export function ClientOverlays() {
  return (
    <>
      <InstallPrompt />
      <CookieConsent />
      <OnboardingTutorial />
      <OnboardingChecklist />
    </>
  );
}
