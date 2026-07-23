"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { getSupabaseClient } from "@/lib/supabase/client";

interface ProfileData {
  displayName: string;
  avatarUrl: string | null;
  reputation: string;
  completedSwaps: number;
  phoneVerified: boolean;
  idVerified: boolean;
  responseRate: number;
}

interface Props {
  partnerId: string;
  partnerName: string;
}

export function ChatDrawerUserProfile({ partnerId, partnerName }: Props) {
  const t = useTranslations("chat.drawer");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !partnerId) return;

    supabase
      .from("public_profiles")
      .select("display_name, avatar_url, trust_level, swaps_completed, phone_verified, id_verified, response_rate_pct")
      .eq("user_id", partnerId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            displayName: (data.display_name as string) ?? partnerName,
            avatarUrl: data.avatar_url as string | null,
            reputation: (data.trust_level as string) ?? "starter",
            completedSwaps: (data.swaps_completed as number) ?? 0,
            phoneVerified: !!(data.phone_verified),
            idVerified: !!(data.id_verified),
            responseRate: (data.response_rate_pct as number) ?? 50,
          });
        }
        setLoading(false);
      });
  }, [partnerId, partnerName]);

  const isLoading = loading && Boolean(partnerId);

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
  }

  if (!profile) {
    return <p className="py-4 text-center text-sm text-zinc-400">{t("noProfile")}</p>;
  }

  const repMap: Record<string, string> = {
    starter: "⭐ Starter",
    trusted: "⭐⭐ Trusted",
    ambassador: "⭐⭐⭐ Ambassador",
  };

  return (
    <div className="space-y-4">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {profile.avatarUrl ? (
            <Image src={profile.avatarUrl} alt={profile.displayName} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-400">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">@{profile.displayName}</p>
          <p className="text-xs text-zinc-400">{repMap[profile.reputation] ?? profile.reputation}</p>
        </div>
      </div>

      {/* Verifications */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          {t("verifications")}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            profile.phoneVerified ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
          }`}>
            {profile.phoneVerified ? "✅" : "☐"} {t("phone")}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            profile.idVerified ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
          }`}>
            {profile.idVerified ? "✅" : "☐"} {t("idVerified")}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-zinc-50 p-2 text-center dark:bg-zinc-800">
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{profile.completedSwaps}</p>
          <p className="text-[10px] text-zinc-400">{t("completedSwaps")}</p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-2 text-center dark:bg-zinc-800">
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{profile.responseRate}%</p>
          <p className="text-[10px] text-zinc-400">{t("responseRate")}</p>
        </div>
      </div>
    </div>
  );
}
