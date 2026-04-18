"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { LocationFilter } from "@/components/explore/filters/shared/LocationFilter";
import type {
  Context,
  Intent,
  ProfileFilters,
} from "@/lib/explore/exploreFilterTypes";

interface Props {
  filters: ProfileFilters;
  onChange: (updates: Partial<ProfileFilters>) => void;
}

const RATINGS = [
  { key: "ratingAny", value: null as number | null, stars: "⭐" },
  { key: "rating3", value: 3, stars: "⭐⭐⭐" },
  { key: "rating4", value: 4, stars: "⭐⭐⭐⭐" },
  { key: "rating5", value: 5, stars: "⭐⭐⭐⭐⭐" },
];

const RESPONSE_TIMES = [
  { key: "respAny", value: null as string | null },
  { key: "resp24", value: "24" },
  { key: "resp6", value: "6" },
  { key: "resp1", value: "1" },
];

const INTENTS: { emoji: string; value: Intent; key: string }[] = [
  { emoji: "🔭", value: "explore", key: "intentExplore" },
  { emoji: "🤝", value: "open", key: "intentOpen" },
  { emoji: "🎯", value: "clear", key: "intentClear" },
  { emoji: "🔥", value: "serious", key: "intentSerious" },
];

const CONTEXTS: { emoji: string; value: Context; key: string }[] = [
  { emoji: "🏠", value: "permanent", key: "ctxPermanent" },
  { emoji: "✈️", value: "vacation", key: "ctxVacation" },
  { emoji: "⏱️", value: "temporary", key: "ctxTemporary" },
  { emoji: "🚨", value: "urgent", key: "ctxUrgent" },
];

function toggleMulti<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function ProfileTab({ filters, onChange }: Props) {
  const t = useTranslations("exploreDrawer");
  const [langInput, setLangInput] = useState("");

  const addLanguage = () => {
    const trimmed = langInput.trim();
    if (trimmed && !filters.languages.includes(trimmed)) {
      onChange({ languages: [...filters.languages, trimmed] });
      setLangInput("");
    }
  };

  return (
    <div className="space-y-5">
      {/* Verification */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("verificationLabel")}
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.id_verified}
              onChange={(e) => onChange({ id_verified: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-900 dark:text-zinc-50">🪪 {t("idVerifiedLabel")}</span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.email_verified}
              onChange={(e) => onChange({ email_verified: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-900 dark:text-zinc-50">📧 {t("emailVerifiedLabel")}</span>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.has_completed_swap}
              onChange={(e) => onChange({ has_completed_swap: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-zinc-900 dark:text-zinc-50">✅ {t("completedSwapLabel")}</span>
          </label>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("ratingLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onChange({ min_rating: r.value })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filters.min_rating === r.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {r.stars} {t(r.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Response time */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("responseTimeLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {RESPONSE_TIMES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onChange({ response_time: r.value })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filters.response_time === r.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {t(r.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Intent */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("intentLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {INTENTS.map((i) => (
            <button
              key={i.value}
              type="button"
              onClick={() => onChange({ intents: toggleMulti(filters.intents, i.value) })}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filters.intents.includes(i.value)
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <span>{i.emoji}</span>
              <span>{t(i.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Context */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("contextLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CONTEXTS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange({ contexts: toggleMulti(filters.contexts, c.value) })}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                filters.contexts.includes(c.value)
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              <span>{c.emoji}</span>
              <span>{t(c.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("languagesLabel")}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addLanguage();
              }
            }}
            placeholder={t("languagesPlaceholder")}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={addLanguage}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            {t("addButton")}
          </button>
        </div>
        {filters.languages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {filters.languages.map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
              >
                {lang}
                <button
                  type="button"
                  onClick={() =>
                    onChange({ languages: filters.languages.filter((l) => l !== lang) })
                  }
                  className="hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Affinity groups */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("affinityLabel")}
        </label>
        <input
          type="text"
          value={filters.affinity}
          onChange={(e) => onChange({ affinity: e.target.value })}
          placeholder={t("affinityPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* User location */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("userLocationLabel")}
        </label>
        <LocationFilter
          city={filters.city}
          radiusKm={filters.radius_km}
          onCityChange={(v) => onChange({ city: v })}
          onRadiusChange={(v) => onChange({ radius_km: v })}
        />
      </div>
    </div>
  );
}
