"use client";

import { useTranslations } from "next-intl";
import { Shield, ShieldCheck } from "lucide-react";

interface VerificationBadgeTagProps {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  idVerified?: boolean;
  selfieVerified?: boolean;
  compact?: boolean;
}

/**
 * Visual badge shown on item cards and public profiles.
 * - Green "Verified user" if email + phone are verified
 * - Blue "Identity confirmed" if ID is also verified
 * - No badge if neither condition is met
 */
export function VerificationBadgeTag({
  emailVerified,
  phoneVerified,
  idVerified,
  compact = false,
}: VerificationBadgeTagProps) {
  const t = useTranslations("profile");

  const hasBasic = emailVerified && phoneVerified;
  const hasIdentity = hasBasic && idVerified;

  if (!hasBasic) return null;

  if (hasIdentity) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      } font-semibold`}>
        <ShieldCheck className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
        {!compact && t("badgeIdentityConfirmed")}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ${
      compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
    } font-semibold`}>
      <Shield className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {!compact && t("badgeVerifiedUser")}
    </span>
  );
}
