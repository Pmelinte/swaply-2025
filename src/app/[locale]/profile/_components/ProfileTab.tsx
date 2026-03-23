"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import { Badge, SectionCard } from "@/components/ui";
import { MissingDataCallout } from "@/components/gated";
import type { UserProfile, LanguageCode } from "@/lib/types";
import { languageNames, localeFlagUrl, type Locale, locales } from "@/i18n/config";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />,
});
import { uploadItemPhoto } from "@/lib/storage";

interface ProfileTabProps {
  draft: UserProfile;
  update: (partial: Partial<UserProfile>) => void;
  userId: string;
}

export default function ProfileTab({ draft, update, userId }: ProfileTabProps) {
  const t = useTranslations("profile");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const locationIncomplete = !draft.location?.city || !draft.location?.country;

  return (
    <>
      <SectionCard
        title={t("publicIdentity")}
        description={t("publicIdentityDescription")}
        action={<Badge tier={draft.badge} />}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
            {draft.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={draft.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-400">
                {draft.displayName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("avatarUrl")}
              <input
                value={draft.avatarUrl ?? ""}
                onChange={(e) => update({ avatarUrl: e.target.value })}
                placeholder={t("avatarPlaceholder")}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50">
              <Plus className="h-3.5 w-3.5" />
              {t("uploadAvatar")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={avatarUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatarUploading(true);
                  try {
                    const result = await uploadItemPhoto(file, userId);
                    if (result.error) {
                      setSaveMessage(result.error);
                    } else if (result.url) {
                      update({ avatarUrl: result.url });
                    }
                  } finally {
                    setAvatarUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <p className="text-xs text-zinc-400">{t("avatarUploadNote")}</p>
            {saveMessage && <p className="text-xs text-red-500">{saveMessage}</p>}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("displayName")}
            <input
              value={draft.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("firstName")}
            <input
              value={draft.firstName ?? ""}
              onChange={(e) => update({ firstName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("bio")}
          <textarea
            value={draft.bio ?? ""}
            onChange={(e) => update({ bio: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            rows={3}
          />
        </label>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("spokenLanguages")}</p>
          <div className="flex flex-wrap gap-2">
            {draft.languages.map((lang) => {
              const info = languageNames[lang as Locale];
              return (
                <span key={lang} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {info && <img src={localeFlagUrl(lang as Locale)} alt="" width={16} height={12} className="rounded-sm" />}
                  {info ? info.nativeName : lang.toUpperCase()}
                  <button
                    type="button"
                    onClick={() => update({ languages: draft.languages.filter((l) => l !== lang) })}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                    aria-label={`${t("removeLanguage")} ${info ? info.nativeName : lang}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            <div className="inline-flex items-center gap-1">
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value as LanguageCode;
                  if (val && !draft.languages.includes(val)) {
                    update({ languages: [...draft.languages, val] });
                  }
                }}
                aria-label={t("addLanguage")}
                className="w-40 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">{t("addLanguage")}</option>
                {locales
                  .filter((loc) => !draft.languages.includes(loc as LanguageCode))
                  .map((loc) => {
                    const info = languageNames[loc];
                    return (
                      <option key={loc} value={loc}>
                        {info.nativeName} ({info.name})
                      </option>
                    );
                  })}
              </select>
            </div>
          </div>
        </div>
      </SectionCard>

      {locationIncomplete ? (
        <MissingDataCallout
          title={t("incompleteLocation")}
          message={t("incompleteLocationDescription")}
          cta={<span className="text-sm font-semibold">{t("completeFieldsBelow")}</span>}
        />
      ) : null}

      <SectionCard
        title={t("localization")}
        description={t("localizationDescription")}
      >
        <LocationPicker
          country={draft.location?.country ?? ""}
          region={draft.location?.region ?? ""}
          city={draft.location?.city ?? ""}
          onChange={({ country, region, city }) =>
            update({
              location: {
                ...(draft.location ?? {}),
                country,
                region,
                city,
              },
            })
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("postalCode")}
            <input
              value={draft.location?.postalCode ?? ""}
              onChange={(e) =>
                update({ location: { ...(draft.location ?? {}), postalCode: e.target.value } })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("maxTravelRadius")}
            <input
              type="number"
              value={draft.location?.travelRadiusKm ?? 0}
              onChange={(e) =>
                update({
                  location: {
                    ...(draft.location ?? {}),
                    travelRadiusKm: Number(e.target.value),
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.visibility.showExactLocation}
              onChange={(e) =>
                update({
                  visibility: { ...draft.visibility, showExactLocation: e.target.checked },
                })
              }
            />
            {t("exactLocationVisible")}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.visibility.showLastSeen}
              onChange={(e) =>
                update({
                  visibility: { ...draft.visibility, showLastSeen: e.target.checked },
                })
              }
            />
            {t("lastActivityVisible")}
          </label>
        </div>
      </SectionCard>
    </>
  );
}
