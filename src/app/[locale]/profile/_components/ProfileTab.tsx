"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Badge, SectionCard } from "@/components/ui-custom";
import { MissingDataCallout } from "@/components/gated";
import type { UserProfile } from "@/lib/types";
import { languageNames, localeFlagUrl, type Locale, locales } from "@/i18n/config";
import {
  getGlobalProfileContract,
} from "@/lib/profile/userProfilePersistence";
import type { GlobalUserProfile } from "@/lib/profile/profileTypes";
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

const languageText = {
  ro: {
    primary: "Limba principală",
    secondary: "Limba secundară",
    tertiary: "A treia limbă",
    optional: "Opțional",
    description: "Ordinea stabilește fallback-ul folosit în toate domeniile Swaply.",
    autoTranslate: "Tradu automat mesajele în limba preferată",
    showOriginal: "Arată și textul original când există traducere",
  },
  en: {
    primary: "Primary language",
    secondary: "Secondary language",
    tertiary: "Third language",
    optional: "Optional",
    description: "This order defines the fallback used across every Swaply domain.",
    autoTranslate: "Translate messages automatically into the preferred language",
    showOriginal: "Also show the original text when a translation exists",
  },
} as const;

export default function ProfileTab({ draft, update, userId }: ProfileTabProps) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const text = locale === "ro" ? languageText.ro : languageText.en;
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const contract = getGlobalProfileContract(draft, locale);
  const preferences = contract.languagePreferences;

  const locationIncomplete = !draft.location?.city || !draft.location?.country;

  const updateLanguage = (position: 0 | 1 | 2, value: string) => {
    const next: Array<Locale | null> = [
      preferences.primary,
      preferences.secondary,
      preferences.tertiary,
    ];
    const localeValue = value ? value as Locale : null;
    if (position === 0 && !localeValue) return;
    next[position] = localeValue;

    const selected = next.filter((entry): entry is Locale => Boolean(entry));
    if (new Set(selected).size !== selected.length) return;

    const primary = next[0] ?? preferences.primary;
    const nextPreferences = {
      ...preferences,
      primary,
      secondary: next[1],
      tertiary: next[2],
    };

    update({
      languages: selected as unknown as UserProfile["languages"],
      globalProfile: {
        ...contract,
        languagePreferences: nextPreferences,
        legacyLanguages: selected,
        preferredLocale: primary,
      },
    } as Partial<GlobalUserProfile>);
  };

  const updateTranslationPreference = (
    key: "autoTranslateMessages" | "showOriginalLanguage",
    value: boolean,
  ) => {
    update({
      globalProfile: {
        ...contract,
        languagePreferences: {
          ...preferences,
          [key]: value,
        },
      },
    } as Partial<GlobalUserProfile>);
  };

  const languageSelect = (
    position: 0 | 1 | 2,
    label: string,
    value: Locale | null,
    optional: boolean,
  ) => {
    const selectedElsewhere = new Set(
      [preferences.primary, preferences.secondary, preferences.tertiary]
        .filter((entry, index): entry is Locale => Boolean(entry) && index !== position),
    );

    return (
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {label}
        <select
          value={value ?? ""}
          onChange={(event) => updateLanguage(position, event.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {optional && <option value="">{text.optional}</option>}
          {locales
            .filter((candidate) => candidate === value || !selectedElsewhere.has(candidate))
            .map((candidate) => {
              const info = languageNames[candidate];
              return (
                <option key={candidate} value={candidate}>
                  {info.nativeName} ({info.name})
                </option>
              );
            })}
        </select>
      </label>
    );
  };

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
                onChange={(event) => update({ avatarUrl: event.target.value })}
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
                onChange={async (event) => {
                  const file = event.target.files?.[0];
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
                    event.target.value = "";
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
              onChange={(event) => update({ displayName: event.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("firstName")}
            <input
              value={draft.firstName ?? ""}
              onChange={(event) => update({ firstName: event.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("bio")}
          <textarea
            value={draft.bio ?? ""}
            onChange={(event) => update({ bio: event.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            rows={3}
          />
        </label>

        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              {t("spokenLanguages")}
            </p>
            {preferences.primary && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:bg-zinc-800 dark:text-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={localeFlagUrl(preferences.primary)} alt="" width={16} height={12} className="rounded-sm" />
                {languageNames[preferences.primary].nativeName}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{text.description}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {languageSelect(0, text.primary, preferences.primary, false)}
            {languageSelect(1, text.secondary, preferences.secondary, true)}
            {languageSelect(2, text.tertiary, preferences.tertiary, true)}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={preferences.autoTranslateMessages}
                onChange={(event) => updateTranslationPreference("autoTranslateMessages", event.target.checked)}
                className="mt-0.5"
              />
              <span>{text.autoTranslate}</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={preferences.showOriginalLanguage}
                onChange={(event) => updateTranslationPreference("showOriginalLanguage", event.target.checked)}
                className="mt-0.5"
              />
              <span>{text.showOriginal}</span>
            </label>
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
              onChange={(event) =>
                update({ location: { ...(draft.location ?? {}), postalCode: event.target.value } })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("maxTravelRadius")}
            <input
              type="number"
              value={draft.location?.travelRadiusKm ?? 0}
              onChange={(event) =>
                update({
                  location: {
                    ...(draft.location ?? {}),
                    travelRadiusKm: Number(event.target.value),
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
              onChange={(event) =>
                update({
                  visibility: { ...draft.visibility, showExactLocation: event.target.checked },
                })
              }
            />
            {t("exactLocationVisible")}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.visibility.showLastSeen}
              onChange={(event) =>
                update({
                  visibility: { ...draft.visibility, showLastSeen: event.target.checked },
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
