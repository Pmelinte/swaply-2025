"use client";

/**
 * AdBanner — Non-intrusive ad component for Free tier users.
 * Shows Google AdSense, Carbon Ads, or sponsor banners.
 * Premium/Platinum users see nothing.
 */

import { useAppState } from "@/lib/state";
import { useTranslations } from "next-intl";

interface AdBannerProps {
  placement: "banner_top" | "sidebar" | "inline_feed" | "footer";
  className?: string;
}

export function AdBanner({ placement, className = "" }: AdBannerProps) {
  const { user, isFeatureEnabled } = useAppState();
  const t = useTranslations("adBanner");

  // Premium/Platinum users = ad-free
  if (user?.badge === "premium" || user?.badge === "platinum") return null;

  // Feature flag gate — admin can disable all ads from Supabase
  if (!isFeatureEnabled("ads_display")) return null;

  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const carbonServe = process.env.NEXT_PUBLIC_CARBON_SERVE;

  // AdSense
  if (adsenseId) {
    const format = placement === "sidebar" ? "rectangle" : "horizontal";
    return (
      <div className={`swaply-ad ${className}`} data-placement={placement}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={adsenseId}
          data-ad-slot={placement}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Carbon Ads
  if (carbonServe) {
    return (
      <div className={`swaply-ad ${className}`} data-placement={placement}>
        <script
          async
          type="text/javascript"
          src={`//cdn.carbonads.com/carbon.js?serve=${carbonServe}&placement=swaplyapp`}
          id="_carbonads_js"
        />
      </div>
    );
  }

  // Fallback: eco-friendly CTA (promotes premium upgrade)
  return (
    <div
      className={`swaply-ad flex min-h-[4.75rem] flex-col items-center justify-center rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-3 text-center dark:border-blue-900 dark:from-blue-950/20 dark:to-purple-950/20 ${className}`}
      data-placement={placement}
    >
      <p className="text-xs font-medium leading-5 text-blue-700 dark:text-blue-300">
        {t("premiumCta")}
      </p>
      <a
        href="/monetization"
        className="mt-1 inline-block rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold leading-4 text-white hover:bg-blue-700"
      >
        {t("upgradeNow")}
      </a>
    </div>
  );
}
